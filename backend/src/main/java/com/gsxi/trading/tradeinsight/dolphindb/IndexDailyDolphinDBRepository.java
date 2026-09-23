package com.gsxi.trading.tradeinsight.dolphindb;

import com.gsxi.trading.tradeinsight.entity.StockZhIndexDaily;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * 指数日K线数据 DolphinDB 仓库，替代原 MyBatis {@code IndexDailyMapper}。
 *
 * @author gsxi
 */
@Repository
public class IndexDailyDolphinDBRepository {

    private static final String TBL = "loadTable('dfs://tradeinsight','stock_zh_index_daily')";

    private final DolphinDBClient client;

    public IndexDailyDolphinDBRepository(DolphinDBClient client) {
        this.client = client;
    }

    /** 批量插入（逐行 JDBC，已存在数据由 Service 层过滤）。 */
    public int batchInsert(List<StockZhIndexDaily> list) {
        if (list == null || list.isEmpty()) {
            return 0;
        }
        // change 为 DolphinDB/SQL 关键字，以反引号引用
        String sql = "insert into " + TBL + " (symbol,trade_date,open,close,high,low,volume,amount," +
                "amplitude,`change`,price_change,turnover_rate,create_time,update_time) " +
                "values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        for (StockZhIndexDaily e : list) {
            client.update(sql,
                    e.getSymbol(), e.getTradeDate(), toDouble(e.getOpen()), toDouble(e.getClose()),
                    toDouble(e.getHigh()), toDouble(e.getLow()), toDouble(e.getVolume()), toDouble(e.getAmount()),
                    toDouble(e.getAmplitude()), toDouble(e.getChange()), toDouble(e.getPriceChange()),
                    toDouble(e.getTurnoverRate()), e.getCreateTime(), e.getUpdateTime());
        }
        return list.size();
    }

    /** 指定指数最新交易日期。 */
    public LocalDate selectLatestTradeDate(String symbol) {
        String sql = "select max(trade_date) as tradeDate from " + TBL + " where symbol=?";
        return client.queryForObject(sql, (rs, i) -> ValueConverter.toLocalDate(rs.getObject(1)), symbol);
    }

    /** 按指数代码与日期区间查询。 */
    public List<StockZhIndexDaily> selectBySymbolAndDateRange(String symbol, LocalDate startDate, LocalDate endDate) {
        String sql = "select symbol, trade_date as tradeDate, open, close, high, low, volume, amount, " +
                "amplitude, `change`, price_change as priceChange, turnover_rate as turnoverRate, " +
                "create_time as createTime, update_time as updateTime " +
                "from " + TBL + " where symbol=? and trade_date between ? and ? order by trade_date";
        return client.query(sql, new DolphinDBRowMapper<>(StockZhIndexDaily.class), symbol, startDate, endDate);
    }

    /** 统计指数+日期是否存在。 */
    public int countBySymbolAndTradeDate(String symbol, LocalDate tradeDate) {
        return client.queryForInt("select count(*) from " + TBL + " where symbol=? and trade_date=?", symbol, tradeDate);
    }

    /** 按交易日期删除。 */
    public int deleteByTradeDate(LocalDate tradeDate) {
        return client.update("delete from " + TBL + " where trade_date=?", tradeDate);
    }

    private static Double toDouble(java.math.BigDecimal bd) {
        return bd == null ? null : bd.doubleValue();
    }
}
