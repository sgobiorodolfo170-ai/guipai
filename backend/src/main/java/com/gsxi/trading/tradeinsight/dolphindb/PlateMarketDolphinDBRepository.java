package com.gsxi.trading.tradeinsight.dolphindb;

import com.gsxi.trading.tradeinsight.entity.PlateMarketQuotation;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * 板块行情数据 DolphinDB 仓库，替代原 MyBatis {@code PlateMarketQuotationMapper}。
 *
 * @author gsxi
 */
@Repository
public class PlateMarketDolphinDBRepository {

    private static final String TBL = "loadTable('dfs://tradeinsight','plate_market_quotation')";

    private final DolphinDBClient client;

    public PlateMarketDolphinDBRepository(DolphinDBClient client) {
        this.client = client;
    }

    /** 批量插入（逐行 JDBC，已存在数据由 Service 层过滤）。 */
    public int batchInsert(List<PlateMarketQuotation> list) {
        if (list == null || list.isEmpty()) {
            return 0;
        }
        String sql = "insert into " + TBL + " (trade_date,plate,increase_rate,total_volume,total_turnover," +
                "net_inflow,up_count,down_count,average_price,leading_stock,leading_stock_price," +
                "leading_stock_increase,create_time) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        for (PlateMarketQuotation e : list) {
            client.update(sql,
                    e.getTradeDate(), e.getPlate(), toDouble(e.getIncreaseRate()), toDouble(e.getTotalVolume()),
                    toDouble(e.getTotalTurnover()), toDouble(e.getNetInflow()), e.getUpCount(), e.getDownCount(),
                    toDouble(e.getAveragePrice()), e.getLeadingStock(), toDouble(e.getLeadingStockPrice()),
                    toDouble(e.getLeadingStockIncrease()), e.getCreateTime());
        }
        return list.size();
    }

    /** 按日期查询板块行情。 */
    public List<PlateMarketQuotation> selectByTradeDate(LocalDate tradeDate) {
        String sql = "select trade_date as tradeDate, plate, increase_rate as increaseRate, " +
                "total_volume as totalVolume, total_turnover as totalTurnover, net_inflow as netInflow, " +
                "up_count as upCount, down_count as downCount, average_price as averagePrice, " +
                "leading_stock as leadingStock, leading_stock_price as leadingStockPrice, " +
                "leading_stock_increase as leadingStockIncrease, create_time as createTime " +
                "from " + TBL + " where trade_date=? order by plate";
        return client.query(sql, new DolphinDBRowMapper<>(PlateMarketQuotation.class), tradeDate);
    }

    /** 统计日期+板块是否存在。 */
    public int countByDateAndPlate(LocalDate tradeDate, String plate) {
        return client.queryForInt("select count(*) from " + TBL + " where trade_date=? and plate=?", tradeDate, plate);
    }

    /** 按日期删除。 */
    public int deleteByTradeDate(LocalDate tradeDate) {
        return client.update("delete from " + TBL + " where trade_date=?", tradeDate);
    }

    /** 按日期统计行数。 */
    public long countByTradeDate(LocalDate tradeDate) {
        return client.queryForLong("select count(*) from " + TBL + " where trade_date=?", tradeDate);
    }

    private static Double toDouble(java.math.BigDecimal bd) {
        return bd == null ? null : bd.doubleValue();
    }
}
