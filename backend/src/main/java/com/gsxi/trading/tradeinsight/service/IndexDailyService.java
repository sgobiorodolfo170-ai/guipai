package com.gsxi.trading.tradeinsight.service;

import com.gsxi.trading.tradeinsight.entity.StockZhIndexDaily;

import java.time.LocalDate;
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/26
 * @description 指数同步服务接口
 */
public interface IndexDailyService {

    /**
     * 批量保存指数日K数据（自动过滤重复数据）
     * @param list 指数数据列表
     * @return 成功保存的数量
     */
    int batchSave(List<StockZhIndexDaily> list);

    /**
     * 获取指定指数的最新交易日期（用于增量同步）
     * @param symbol 指数代码
     * @return 最新日期（null表示无数据）
     */
    LocalDate getLatestTradeDate(String symbol);

    /**
     * 按指数代码和日期区间查询数据
     * @param symbol 指数代码
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @return 指数数据列表
     */
    List<StockZhIndexDaily> getBySymbolAndDateRange(String symbol, LocalDate startDate, LocalDate endDate);

    /**
     * 检查指定指数和日期的数据是否存在
     * @param symbol 指数代码
     * @param tradeDate 交易日期
     * @return 是否存在
     */
    boolean existsBySymbolAndTradeDate(String symbol, LocalDate tradeDate);


    /**
     *  删除指定日期的指数数据
     * @param tradeDate 交易日期
     * @return 删除的行数
     */
    int deleteByTradeDate(LocalDate tradeDate);
}
