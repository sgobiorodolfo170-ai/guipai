package com.gsxi.trading.tradeinsight.service;

import com.gsxi.trading.tradeinsight.dto.internal.BasicStatisticsDTO;
import com.gsxi.trading.tradeinsight.dto.internal.LimitBoardStatisticsDTO;
import com.gsxi.trading.tradeinsight.dto.response.BasicStatisticsResponse;
import com.gsxi.trading.tradeinsight.dto.response.LimitBoardStatisticsResponse;

import java.time.LocalDate;
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/1/1
 * @description 涨跌停板统计分析主服务接口
 * 提供基础统计数据查询和缓存逻辑，实现统一的涨跌停板详细统计功能
 */
public interface LimitBoardStatisticsService {

    // ==================== 基础统计数据查询 ====================

    /**
     * 获取指定日期的基础统计数据
     * 包含涨停和跌停板的综合统计信息
     * 
     * @param date 查询日期
     * @return 基础统计响应数据，如果无数据返回空的响应对象
     */
    BasicStatisticsResponse getBasicStatistics(LocalDate date);

    /**
     * 获取日期范围内的基础统计数据
     * 支持多日期的基础统计数据查询
     * 
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @return 基础统计响应数据列表
     */
    List<BasicStatisticsResponse> getBasicStatisticsRange(LocalDate startDate, LocalDate endDate);

    // ==================== 涨跌停板详细统计 ====================

    /**
     * 获取指定日期和类型的涨跌停板详细统计
     * 
     * @param date 查询日期
     * @param dataType 数据类型（LIMIT_UP-涨停板，LIMIT_DOWN-跌停板）
     * @return 涨跌停板统计响应数据，如果无数据返回空的响应对象
     */
    LimitBoardStatisticsResponse getLimitBoardStatistics(LocalDate date, String dataType);

    /**
     * 获取日期范围内的涨跌停板详细统计
     * 
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @param dataType 数据类型（LIMIT_UP-涨停板，LIMIT_DOWN-跌停板）
     * @return 涨跌停板统计响应数据列表
     */
    List<LimitBoardStatisticsResponse> getLimitBoardStatisticsRange(
            LocalDate startDate, LocalDate endDate, String dataType);

    // ==================== 数据验证和异常处理 ====================

    /**
     * 验证查询参数的有效性
     * 
     * @param date 查询日期
     * @throws IllegalArgumentException 如果参数无效
     */
    void validateQueryDate(LocalDate date);

    /**
     * 验证日期范围参数的有效性
     * 
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @throws IllegalArgumentException 如果参数无效
     */
    void validateDateRange(LocalDate startDate, LocalDate endDate);

    /**
     * 验证数据类型参数的有效性
     * 
     * @param dataType 数据类型
     * @throws IllegalArgumentException 如果参数无效
     */
    void validateDataType(String dataType);

    // ==================== 缓存管理 ====================

    /**
     * 刷新指定日期的基础统计缓存
     * 当数据更新时调用此方法刷新缓存
     * 
     * @param date 数据日期
     * @return 是否刷新成功
     */
    boolean refreshBasicStatisticsCache(LocalDate date);

    /**
     * 刷新指定日期和类型的涨跌停板统计缓存
     * 
     * @param date 数据日期
     * @param dataType 数据类型
     * @return 是否刷新成功
     */
    boolean refreshLimitBoardStatisticsCache(LocalDate date, String dataType);

    /**
     * 清除指定日期的所有统计缓存
     * 
     * @param date 数据日期
     * @return 清除的缓存数量
     */
    long clearStatisticsCache(LocalDate date);

    // ==================== 数据可用性检查 ====================

    /**
     * 检查指定日期是否有涨跌停板数据
     * 
     * @param date 查询日期
     * @return 是否有数据
     */
    boolean hasDataForDate(LocalDate date);

    /**
     * 检查指定日期和类型是否有数据
     * 
     * @param date 查询日期
     * @param dataType 数据类型
     * @return 是否有数据
     */
    boolean hasDataForDateAndType(LocalDate date, String dataType);

    /**
     * 获取最新的数据日期
     * 
     * @return 最新数据日期，如果无数据返回null
     */
    LocalDate getLatestDataDate();

    /**
     * 获取指定数据类型的最新数据日期
     * 
     * @param dataType 数据类型
     * @return 最新数据日期，如果无数据返回null
     */
    LocalDate getLatestDataDate(String dataType);
}