package com.gsxi.trading.tradeinsight.dolphindb;

import com.gsxi.trading.tradeinsight.config.DolphinDBProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.Year;
import java.util.ArrayList;
import java.util.List;

/**
 * DolphinDB 库表结构初始化器。
 *
 * <p>启动时（当 dolphindb.auto-create-schema=true）自动创建：
 * <ul>
 *   <li>DFS 库 dfs://tradeinsight（按 trade_date 年度 RANGE 分区）</li>
 *   <li>4 张时序分区表：stock_zh_index_daily / plate_market_quotation / stock_limit_pool / daily_k</li>
 * </ul>
 *
 * <p>采用幂等设计：库/表已存在则跳过，不会删除已有数据。
 * 若 DolphinDB 不可达，仅打印告警，不阻断应用启动（关系型功能仍可正常使用）。</p>
 *
 * @author gsxi
 */
@Component
public class DolphinDBSchemaInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DolphinDBSchemaInitializer.class);

    private final DolphinDBClient client;
    private final DolphinDBProperties properties;

    @Autowired
    public DolphinDBSchemaInitializer(DolphinDBClient client, DolphinDBProperties properties) {
        this.client = client;
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.isAutoCreateSchema()) {
            log.info("DolphinDB auto-create-schema=false，跳过库表初始化");
            return;
        }
        try {
            createSchema();
            log.info("DolphinDB 库表初始化完成: {}", properties.getDatabase());
        } catch (Exception e) {
            // 不阻断应用启动，行情相关接口在 DolphinDB 不可达时会抛 DolphinDBAccessException
            log.error("DolphinDB 库表初始化失败（行情功能将不可用）: {}", e.getMessage(), e);
        }
    }

    private void createSchema() {
        String dbPath = properties.getDatabase();
        String boundaries = buildYearlyBoundaries(1990, Year.now().getValue() + 5);

        StringBuilder sb = new StringBuilder();
        // 1. 创建数据库（按 trade_date 年度 RANGE 分区）
        sb.append(String.format(
                "if (!existsDatabase(\"%s\")) { db = database(\"%s\", RANGE, [%s]) }\n",
                dbPath, dbPath, boundaries));
        sb.append(String.format("db = database(\"%s\")\n", dbPath));

        // 2. 指数日K表
        sb.append(String.format(
                "if (!existsTable(\"%s\", \"stock_zh_index_daily\")) {\n" +
                        "  t = table(1:0, `symbol`trade_date`open`close`high`low`volume`amount`change`turnover_rate`amplitude`price_change`create_time`update_time," +
                        " [SYMBOL, DATE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, TIMESTAMP, TIMESTAMP]);\n" +
                        "  db.createPartitionedTable(t, `stock_zh_index_daily, `trade_date)\n" +
                        "}\n", dbPath));

        // 3. 板块行情表
        sb.append(String.format(
                "if (!existsTable(\"%s\", \"plate_market_quotation\")) {\n" +
                        "  t = table(1:0, `trade_date`plate`increase_rate`total_volume`total_turnover`net_inflow`up_count`down_count`average_price`leading_stock`leading_stock_price`leading_stock_increase`create_time," +
                        " [DATE, SYMBOL, DOUBLE, DOUBLE, DOUBLE, DOUBLE, INT, INT, DOUBLE, SYMBOL, DOUBLE, DOUBLE, TIMESTAMP]);\n" +
                        "  db.createPartitionedTable(t, `plate_market_quotation, `trade_date)\n" +
                        "}\n", dbPath));

        // 4. 涨跌停池表（first_limit_time / last_limit_time 以 STRING 存储 HH:mm:ss，便于区间比较）
        sb.append(String.format(
                "if (!existsTable(\"%s\", \"stock_limit_pool\")) {\n" +
                        "  t = table(1:0, `data_type`trade_date`stock_code`stock_name`industry`increase_rate`latest_price`turnover`circulation_market_value`total_market_value`turnover_rate`limit_funds`first_limit_time`limit_stats`dynamic_pe`limit_turnover`continuous_limit`last_limit_time`blast_times`create_time," +
                        " [SYMBOL, DATE, SYMBOL, SYMBOL, SYMBOL, DOUBLE, DOUBLE, LONG, DOUBLE, DOUBLE, DOUBLE, LONG, STRING, SYMBOL, DOUBLE, LONG, INT, STRING, INT, TIMESTAMP]);\n" +
                        "  db.createPartitionedTable(t, `stock_limit_pool, `trade_date)\n" +
                        "}\n", dbPath));

        // 5. 股票日线表（预留，当前未被业务使用）
        sb.append(String.format(
                "if (!existsTable(\"%s\", \"daily_k\")) {\n" +
                        "  t = table(1:0, `date`code`open`high`low`close`preclose`volume`amount`adjustflag`turn`tradestatus`pctChg`isST`update_time," +
                        " [DATE, SYMBOL, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, LONG, DOUBLE, INT, DOUBLE, INT, DOUBLE, INT, TIMESTAMP]);\n" +
                        "  db.createPartitionedTable(t, `daily_k, `date)\n" +
                        "}\n", dbPath));

        client.runScript(sb.toString());
    }

    /** 构造年度 RANGE 分区边界字符串：1990.01.01,1991.01.01,...,endYear.01.01 */
    private String buildYearlyBoundaries(int startYear, int endYear) {
        List<String> list = new ArrayList<>();
        for (int y = startYear; y <= endYear; y++) {
            list.add(String.format("%d.01.01", y));
        }
        return String.join(",", list);
    }
}
