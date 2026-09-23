package com.gsxi.trading.tradeinsight.service;

import com.gsxi.trading.tradeinsight.dto.request.StockHistoryRequest;
import com.gsxi.trading.tradeinsight.dto.request.StockMinuteRequest;

import java.util.List;
import java.util.Map;

/**
 * AKTOOLS API 服务接口
 * 
 * @author Kiro
 * @version 1.0
 * @date 2025-08-19
 * @description 提供 AKTOOLS API 相关的股票数据查询服务
 */
public interface AktoolsApiService {
    
    /**
     * 获取全市场A股实时行情
     * 
     * @return 实时行情数据列表
     */
    List<Map<String, Object>> getStockSpotData();
    
    /**
     * 获取单只股票历史日/周/月线数据
     * 
     * @param request 查询请求参数
     * @return 历史数据列表
     */
    List<Map<String, Object>> getStockHistoryData(StockHistoryRequest request);
    
    /**
     * 获取股票分钟级K线数据
     * 
     * @param request 查询请求参数
     * @return 分钟级K线数据列表
     */
    List<Map<String, Object>> getStockMinuteData(StockMinuteRequest request);
    
    /**
     * 获取个股基础信息
     * 
     * @param symbol 股票代码
     * @return 个股基础信息
     */
    List<Map<String, Object>> getStockInfo(String symbol);
    
    /**
     * 获取十大股东持股明细
     * 
     * @param date 财报截止日（如 20230930）
     * @return 十大股东持股明细列表
     */
    List<Map<String, Object>> getStockHoldingDetail(String date,String indicator, String symbol);
    

    /**
     * 获取当日涨停池
     *
     * @param date 涨停日期（如 20230930）
     * @return 当日涨停池列表
     */
    List<Map<String, Object>> getStockLimitPool(String date);

    /**
     * 获取当日跌停池
     *
     * @param date 跌停日期（如 20230930）
     * @return 当日跌停池列表
     */
    List<Map<String, Object>> getStockDropPool(String date);

    /**
     * 板块行业一览表
     *
     * @return 板块行业一览表
     */
    List<Map<String, Object>> getStockIndustry();

    /**
     * 昨天涨停板的表现
     *
     * @param date 涨停日期 如20250819
     * @return 昨日涨停池
     */
    List<Map<String, Object>> getZtPoolPrevious(String date);

    /**
     * 获取指数数据
     *
     * @param symbol symbol="上证系列指数"；choice of {"沪深重要指数", "上证系列指数", "深证系列指数", "指数成份", "中证系列指数"}
     *  @return 指数数据
     */
    List<Map<String, Object>> getStockIndexSpot(String symbol );

    /**
     * 股票指数的历史数据按日频率更新
     * @param symbol 指数代码
     * @return 单次返回指定 symbol 的所有历史行情数据
     */
    List<Map<String, Object>> getIndexDailyData(String symbol,String startDate,String endDate);
}