package com.gsxi.trading.tradeinsight.service;

import com.gsxi.trading.tradeinsight.dto.response.PercentileAnalysisResponse;
import com.gsxi.trading.tradeinsight.dto.response.SentimentIndicatorResponse;
import com.gsxi.trading.tradeinsight.dto.response.SentimentTrendResponse;

import java.time.LocalDate;
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/1/1
 * @description 市场情绪分析服务接口
 * 实现市场情绪指标计算，实现历史对比分析功能，添加异常检测和预警机制
 */
public interface MarketSentimentService {

    // ==================== 市场情绪指标计算 ====================

    /**
     * 获取市场情绪指标
     * 计算综合的市场情绪指标，包括涨跌停比、连板率、炸板率等
     * 
     * @param date 查询日期
     * @return 市场情绪指标响应数据
     */
    SentimentIndicatorResponse getSentimentIndicator(LocalDate date);

    /**
     * 获取市场情绪趋势
     * 分析一段时间内市场情绪指标的变化趋势
     * 
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @return 市场情绪趋势响应数据
     */
    SentimentTrendResponse getSentimentTrend(LocalDate startDate, LocalDate endDate);

    /**
     * 计算综合情绪评分
     * 基于多个指标计算0-100分的综合情绪评分
     * 
     * @param date 查询日期
     * @return 综合情绪评分（0-100分）
     */
    Double calculateSentimentScore(LocalDate date);

    /**
     * 获取情绪等级描述
     * 根据情绪评分返回等级描述
     * 
     * @param date 查询日期
     * @return 情绪等级描述（如：极度乐观、乐观、中性、悲观、极度悲观）
     */
    String getSentimentLevel(LocalDate date);

    // ==================== 历史对比分析功能 ====================

    /**
     * 获取历史对比分析
     * 将当前数据与历史数据进行对比分析
     * 
     * @param targetDate 目标日期
     * @param days 历史对比天数
     * @return 分位数分析响应数据
     */
    PercentileAnalysisResponse getHistoricalComparison(LocalDate targetDate, int days);

    /**
     * 获取分位数分析
     * 计算目标日期的各项指标在历史数据中的分位数位置
     * 
     * @param targetDate 目标日期
     * @param days 历史天数
     * @return 分位数分析响应数据
     */
    PercentileAnalysisResponse getPercentileAnalysis(LocalDate targetDate, int days);

    /**
     * 计算历史排名
     * 计算指定指标在历史数据中的排名
     * 
     * @param targetDate 目标日期
     * @param days 历史天数
     * @param indicator 指标名称（如：limitUpCount、limitUpDownRatio等）
     * @return 历史排名（1表示最高，days表示最低）
     */
    Integer getHistoricalRank(LocalDate targetDate, int days, String indicator);

    /**
     * 判断是否为历史极值
     * 判断指定日期的数据是否为历史极值（前5%或后5%）
     * 
     * @param targetDate 目标日期
     * @param days 历史天数
     * @return 极值描述（如：历史高位、历史低位、正常范围）
     */
    String getExtremeValueDescription(LocalDate targetDate, int days);

    // ==================== 异常检测和预警机制 ====================

    /**
     * 检测市场异常情况
     * 基于多个指标检测市场是否出现异常情况
     * 
     * @param date 检测日期
     * @return 异常检测结果列表
     */
    List<String> detectMarketAnomalies(LocalDate date);

    /**
     * 生成市场预警信息
     * 基于当前市场情绪和历史数据生成预警信息
     * 
     * @param date 分析日期
     * @return 预警信息列表
     */
    List<String> generateMarketWarnings(LocalDate date);

    /**
     * 检测情绪极值
     * 检测市场情绪是否达到极值水平
     * 
     * @param date 检测日期
     * @return 极值检测结果
     */
    String detectSentimentExtreme(LocalDate date);

    /**
     * 计算市场风险等级
     * 基于多个指标计算市场风险等级
     * 
     * @param date 分析日期
     * @return 风险等级（1-5级，1为最低风险，5为最高风险）
     */
    Integer calculateMarketRiskLevel(LocalDate date);

    // ==================== 趋势分析和预测 ====================

    /**
     * 分析情绪变化趋势
     * 分析最近一段时间的情绪变化趋势
     * 
     * @param endDate 结束日期
     * @param days 分析天数
     * @return 趋势描述（如：上升趋势、下降趋势、震荡趋势）
     */
    String analyzeSentimentTrend(LocalDate endDate, int days);

    /**
     * 计算情绪动量
     * 计算市场情绪的变化动量
     * 
     * @param date 计算日期
     * @param period 计算周期（天数）
     * @return 情绪动量值
     */
    Double calculateSentimentMomentum(LocalDate date, int period);

    /**
     * 预测短期情绪方向
     * 基于历史数据和当前情绪预测短期方向
     * 
     * @param date 分析日期
     * @return 预测方向（如：看涨、看跌、中性）
     */
    String predictShortTermSentiment(LocalDate date);

    // ==================== 缓存和数据管理 ====================

    /**
     * 刷新情绪分析缓存
     * 
     * @param date 数据日期
     * @return 是否刷新成功
     */
    boolean refreshSentimentCache(LocalDate date);

    /**
     * 清除情绪分析缓存
     * 
     * @param date 数据日期
     * @return 清除的缓存数量
     */
    long clearSentimentCache(LocalDate date);

    /**
     * 预热情绪分析缓存
     * 预先计算和缓存常用的情绪分析数据
     * 
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @return 预热成功的数据条数
     */
    int warmupSentimentCache(LocalDate startDate, LocalDate endDate);

    // ==================== 数据验证和配置 ====================

    /**
     * 验证情绪分析参数
     * 
     * @param date 分析日期
     * @param days 天数参数（可选）
     * @throws IllegalArgumentException 如果参数无效
     */
    void validateSentimentParams(LocalDate date, Integer days);

    /**
     * 检查情绪分析数据完整性
     * 
     * @param date 检查日期
     * @return 数据完整性报告
     */
    String checkDataIntegrity(LocalDate date);

    /**
     * 获取情绪分析配置信息
     * 
     * @return 配置信息描述
     */
    String getSentimentAnalysisConfig();
}