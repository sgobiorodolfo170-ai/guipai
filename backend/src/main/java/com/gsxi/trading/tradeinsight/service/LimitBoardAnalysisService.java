package com.gsxi.trading.tradeinsight.service;

import com.gsxi.trading.tradeinsight.dto.response.*;

import java.time.LocalDate;
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/1/1
 * @description 涨跌停板分析服务接口
 * 实现统一的质量分析功能，支持涨停和跌停，实现行业分析和趋势计算，实现跌停板反弹分析功能
 */
public interface LimitBoardAnalysisService {

    // ==================== 连板分析功能 ====================

    /**
     * 获取连板分布统计
     * 分析不同连板数的股票分布情况
     * 
     * @param date 查询日期
     * @param dataType 数据类型（LIMIT_UP-涨停板，LIMIT_DOWN-跌停板）
     * @return 连板分布数据列表
     */
    List<ContinuousLimitDistribution> getContinuousLimitDistribution(LocalDate date, String dataType);

    /**
     * 获取连板成功率分析
     * 分析N连板股票次日继续涨停/跌停的成功率
     * 
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @param dataType 数据类型（LIMIT_UP-涨停板，LIMIT_DOWN-跌停板）
     * @return 连板成功率响应数据
     */
    ContinuousLimitSuccessRateResponse getContinuousLimitSuccessRate(
            LocalDate startDate, LocalDate endDate, String dataType);

    // ==================== 时间分布分析 ====================

    /**
     * 获取时间分布统计
     * 分析不同时间段的涨跌停板分布情况
     * 
     * @param date 查询日期
     * @param dataType 数据类型（LIMIT_UP-涨停板，LIMIT_DOWN-跌停板）
     * @return 时间分布数据列表
     */
    List<TimeDistribution> getTimeDistribution(LocalDate date, String dataType);

    // ==================== 行业分析功能 ====================

    /**
     * 获取行业分布统计
     * 分析不同行业的涨跌停板分布情况
     * 
     * @param date 查询日期
     * @param dataType 数据类型（LIMIT_UP-涨停板，LIMIT_DOWN-跌停板）
     * @return 行业分布数据列表
     */
    List<IndustryDistribution> getIndustryDistribution(LocalDate date, String dataType);

    /**
     * 获取行业涨跌停对比分析
     * 分析各行业涨停和跌停股票的对比情况
     * 
     * @param date 查询日期
     * @return 行业趋势响应数据
     */
    IndustryTrendResponse getIndustryTrendAnalysis(LocalDate date);

    // ==================== 质量分析功能 ====================

    /**
     * 获取涨跌停板质量分析
     * 分析涨跌停板的质量指标，包括封单强度、时间分布等
     * 
     * @param date 查询日期
     * @param dataType 数据类型（LIMIT_UP-涨停板，LIMIT_DOWN-跌停板）
     * @return 质量分析响应数据
     */
    LimitBoardQualityResponse getQualityAnalysis(LocalDate date, String dataType);

    // ==================== 跌停板反弹分析 ====================

    /**
     * 获取跌停板反弹分析
     * 分析跌停板次日的反弹情况
     * 
     * @param date 查询日期
     * @return 跌停板反弹响应数据
     */
    LimitDownReboundResponse getLimitDownReboundAnalysis(LocalDate date);

    /**
     * 获取跌停板按连跌停数反弹分析
     * 按不同连跌停数分析反弹情况
     * 
     * @param date 查询日期
     * @return 跌停板反弹响应数据
     */
    LimitDownReboundResponse getLimitDownReboundByConsecutive(LocalDate date);

    /**
     * 获取跌停板按行业反弹分析
     * 按不同行业分析跌停板反弹情况
     * 
     * @param date 查询日期
     * @return 跌停板反弹响应数据
     */
    LimitDownReboundResponse getLimitDownReboundByIndustry(LocalDate date);

    /**
     * 获取跌停板按市盈率反弹分析
     * 按不同市盈率区间分析跌停板反弹情况
     * 
     * @param date 查询日期
     * @return 跌停板反弹响应数据
     */
    LimitDownReboundResponse getLimitDownReboundByPe(LocalDate date);

    // ==================== 涨跌停对比分析 ====================

    /**
     * 获取涨跌停对比分析
     * 对比分析涨停板和跌停板的各项指标
     * 
     * @param date 查询日期
     * @return 涨跌停对比响应数据
     */
    LimitBoardComparisonResponse getLimitBoardComparison(LocalDate date);

    /**
     * 获取日期范围内的涨跌停对比分析
     * 
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @return 涨跌停对比响应数据列表
     */
    List<LimitBoardComparisonResponse> getLimitBoardComparisonRange(LocalDate startDate, LocalDate endDate);

    // ==================== 缓存管理 ====================

    /**
     * 刷新指定日期的分析缓存
     * 
     * @param date 数据日期
     * @return 是否刷新成功
     */
    boolean refreshAnalysisCache(LocalDate date);

    /**
     * 刷新指定日期和类型的分析缓存
     * 
     * @param date 数据日期
     * @param dataType 数据类型
     * @return 是否刷新成功
     */
    boolean refreshAnalysisCache(LocalDate date, String dataType);

    /**
     * 清除指定日期的所有分析缓存
     * 
     * @param date 数据日期
     * @return 清除的缓存数量
     */
    long clearAnalysisCache(LocalDate date);

    // ==================== 数据验证 ====================

    /**
     * 验证分析查询参数
     * 
     * @param date 查询日期
     * @param dataType 数据类型（可选）
     * @throws IllegalArgumentException 如果参数无效
     */
    void validateAnalysisParams(LocalDate date, String dataType);

    /**
     * 检查指定日期是否有足够的数据进行分析
     * 
     * @param date 查询日期
     * @param dataType 数据类型
     * @return 是否有足够数据
     */
    boolean hasSufficientDataForAnalysis(LocalDate date, String dataType);
}