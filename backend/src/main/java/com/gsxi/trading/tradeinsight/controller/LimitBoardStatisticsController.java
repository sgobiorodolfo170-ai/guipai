package com.gsxi.trading.tradeinsight.controller;

import com.gsxi.trading.tradeinsight.dto.request.LimitBoardQueryRequest;
import com.gsxi.trading.tradeinsight.dto.response.*;
import com.gsxi.trading.tradeinsight.exception.ExceptionUtils;
import com.gsxi.trading.tradeinsight.service.LimitBoardAnalysisService;
import com.gsxi.trading.tradeinsight.service.LimitBoardStatisticsService;
import com.gsxi.trading.tradeinsight.service.MarketSentimentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

/**
 * 涨跌停板统计分析控制器
 *
 * @author gsxi
 * @version 1.0
 * @date 2025/9/1
 * @description 提供涨跌停板统计分析功能的RESTful API接口
 * 包括基础统计、详细分析、质量分析、行业分析、情绪分析等功能
 */
@RestController
@RequestMapping("/api/limit-board-statistics")
@RequiredArgsConstructor
@Slf4j
@Validated
@Tag(name = "涨跌停板统计分析", description = "涨跌停板数据统计分析相关接口")
public class LimitBoardStatisticsController {

    private final LimitBoardStatisticsService limitBoardStatisticsService;
    private final LimitBoardAnalysisService limitBoardAnalysisService;
    private final MarketSentimentService marketSentimentService;

    // ==================== 基础统计数据接口 ====================

    /**
     * 获取指定日期的基础统计数据
     *
     * @param date 查询日期
     * @return 基础统计数据
     */
    @GetMapping("/basic/{date}")
    @Operation(summary = "获取基础统计数据", description = "获取指定日期的涨跌停板基础统计数据，包含涨停和跌停的综合统计")
    public AjaxResult getBasicStatistics(
            @Parameter(description = "查询日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate date) {
        
        log.info("获取基础统计数据，日期: {}", date);
        
        // 参数验证
        ExceptionUtils.checkNotNull(date, "查询日期");
        limitBoardStatisticsService.validateQueryDate(date);
        
        // 查询数据
        BasicStatisticsResponse response = limitBoardStatisticsService.getBasicStatistics(date);
        
        return AjaxResult.success("查询成功", response);
    }

    /**
     * 获取日期范围内的基础统计数据
     *
     * @param startDate 开始日期
     * @param endDate   结束日期
     * @return 基础统计数据列表
     */
    @GetMapping("/basic/range")
    @Operation(summary = "获取范围基础统计数据", description = "获取指定日期范围内的涨跌停板基础统计数据")
    public AjaxResult getBasicStatisticsRange(
            @Parameter(description = "开始日期，格式：yyyy-MM-dd", example = "2025-01-01")
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate startDate,
            @Parameter(description = "结束日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate endDate) {
        
        log.info("获取基础统计数据范围，开始日期: {}，结束日期: {}", startDate, endDate);
        
        // 参数验证
        ExceptionUtils.checkNotNull(startDate, "开始日期");
        ExceptionUtils.checkNotNull(endDate, "结束日期");
        ExceptionUtils.checkDateRange(startDate, endDate);
        limitBoardStatisticsService.validateDateRange(startDate, endDate);
        
        // 查询数据
        List<BasicStatisticsResponse> response = limitBoardStatisticsService.getBasicStatisticsRange(startDate, endDate);
        
        return AjaxResult.success("查询成功", response);
    }

    // ==================== 涨跌停板详细统计接口 ====================

    /**
     * 获取涨跌停板详细统计数据
     *
     * @param date     查询日期
     * @param dataType 数据类型（LIMIT_UP-涨停板，LIMIT_DOWN-跌停板）
     * @return 涨跌停板详细统计数据
     */
    @GetMapping("/detail/{date}")
    @Operation(summary = "获取涨跌停板详细统计", description = "获取指定日期和类型的涨跌停板详细统计数据")
    public AjaxResult getLimitBoardStatistics(
            @Parameter(description = "查询日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate date,
            @Parameter(description = "数据类型：LIMIT_UP(涨停板) 或 LIMIT_DOWN(跌停板)", example = "LIMIT_UP")
            @RequestParam @NotNull String dataType) {
        
        log.info("获取涨跌停板详细统计，日期: {}，类型: {}", date, dataType);
        
        // 参数验证
        ExceptionUtils.checkNotNull(date, "查询日期");
        ExceptionUtils.checkNotBlank(dataType, "数据类型");
        ExceptionUtils.checkLimitBoardType(dataType);
        limitBoardStatisticsService.validateQueryDate(date);
        limitBoardStatisticsService.validateDataType(dataType);
        
        // 查询数据
        LimitBoardStatisticsResponse response = limitBoardStatisticsService.getLimitBoardStatistics(date, dataType);
        
        return AjaxResult.success("查询成功", response);
    }

    /**
     * 获取日期范围内的涨跌停板详细统计数据
     *
     * @param startDate 开始日期
     * @param endDate   结束日期
     * @param dataType  数据类型
     * @return 涨跌停板详细统计数据列表
     */
    @GetMapping("/detail/range")
    @Operation(summary = "获取范围涨跌停板详细统计", description = "获取指定日期范围内的涨跌停板详细统计数据")
    public AjaxResult getLimitBoardStatisticsRange(
            @Parameter(description = "开始日期，格式：yyyy-MM-dd", example = "2025-01-01")
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate startDate,
            @Parameter(description = "结束日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate endDate,
            @Parameter(description = "数据类型：LIMIT_UP(涨停板) 或 LIMIT_DOWN(跌停板)", example = "LIMIT_UP")
            @RequestParam @NotNull String dataType) {
        
        log.info("获取涨跌停板详细统计范围，开始日期: {}，结束日期: {}，类型: {}", startDate, endDate, dataType);
        
        // 参数验证
        ExceptionUtils.checkNotNull(startDate, "开始日期");
        ExceptionUtils.checkNotNull(endDate, "结束日期");
        ExceptionUtils.checkNotBlank(dataType, "数据类型");
        ExceptionUtils.checkDateRange(startDate, endDate);
        ExceptionUtils.checkLimitBoardType(dataType);
        limitBoardStatisticsService.validateDateRange(startDate, endDate);
        limitBoardStatisticsService.validateDataType(dataType);
        
        // 查询数据
        List<LimitBoardStatisticsResponse> response = limitBoardStatisticsService
                .getLimitBoardStatisticsRange(startDate, endDate, dataType);
        
        return AjaxResult.success("查询成功", response);
    }

    // ==================== 质量分析接口 ====================

    /**
     * 获取涨跌停板质量分析
     *
     * @param date     查询日期
     * @param dataType 数据类型
     * @return 质量分析数据
     */
    @GetMapping("/quality/{date}")
    @Operation(summary = "获取涨跌停板质量分析", description = "获取指定日期和类型的涨跌停板质量分析数据")
    public AjaxResult getQualityAnalysis(
            @Parameter(description = "查询日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate date,
            @Parameter(description = "数据类型：LIMIT_UP(涨停板) 或 LIMIT_DOWN(跌停板)", example = "LIMIT_UP")
            @RequestParam @NotNull String dataType) {
        
        log.info("获取涨跌停板质量分析，日期: {}，类型: {}", date, dataType);
        
        // 参数验证
        ExceptionUtils.checkNotNull(date, "查询日期");
        ExceptionUtils.checkNotBlank(dataType, "数据类型");
        ExceptionUtils.checkLimitBoardType(dataType);
        limitBoardAnalysisService.validateAnalysisParams(date, dataType);
        
        // 查询数据
        LimitBoardQualityResponse response = limitBoardAnalysisService.getQualityAnalysis(date, dataType);
        
        return AjaxResult.success("查询成功", response);
    }

    // ==================== 涨跌停对比分析接口 ====================

    /**
     * 获取涨跌停对比分析
     *
     * @param date 查询日期
     * @return 涨跌停对比分析数据
     */
    @GetMapping("/comparison/{date}")
    @Operation(summary = "获取涨跌停对比分析", description = "获取指定日期的涨停板和跌停板对比分析数据")
    public AjaxResult getLimitBoardComparison(
            @Parameter(description = "查询日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate date) {
        
        log.info("获取涨跌停对比分析，日期: {}", date);
        
        // 参数验证
        ExceptionUtils.checkNotNull(date, "查询日期");
        limitBoardAnalysisService.validateAnalysisParams(date, null);
        
        // 查询数据
        LimitBoardComparisonResponse response = limitBoardAnalysisService.getLimitBoardComparison(date);
        
        return AjaxResult.success("查询成功", response);
    }

    /**
     * 获取日期范围内的涨跌停对比分析
     *
     * @param startDate 开始日期
     * @param endDate   结束日期
     * @return 涨跌停对比分析数据列表
     */
    @GetMapping("/comparison/range")
    @Operation(summary = "获取范围涨跌停对比分析", description = "获取指定日期范围内的涨停板和跌停板对比分析数据")
    public AjaxResult getLimitBoardComparisonRange(
            @Parameter(description = "开始日期，格式：yyyy-MM-dd", example = "2025-01-01")
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate startDate,
            @Parameter(description = "结束日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate endDate) {
        
        log.info("获取涨跌停对比分析范围，开始日期: {}，结束日期: {}", startDate, endDate);
        
        // 参数验证
        ExceptionUtils.checkNotNull(startDate, "开始日期");
        ExceptionUtils.checkNotNull(endDate, "结束日期");
        ExceptionUtils.checkDateRange(startDate, endDate);
        limitBoardStatisticsService.validateDateRange(startDate, endDate);
        
        // 查询数据
        List<LimitBoardComparisonResponse> response = limitBoardAnalysisService
                .getLimitBoardComparisonRange(startDate, endDate);
        
        return AjaxResult.success("查询成功", response);
    }
   
 // ==================== 行业分析接口 ====================

    /**
     * 获取行业分布统计
     *
     * @param date     查询日期
     * @param dataType 数据类型（LIMIT_UP-涨停板，LIMIT_DOWN-跌停板，ALL-全部）
     * @return 行业分布统计数据
     */
    @GetMapping("/industry/{date}")
    @Operation(summary = "获取行业分布统计", description = "获取指定日期和类型的行业涨跌停分布统计数据")
    public AjaxResult getIndustryDistribution(
            @Parameter(description = "查询日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate date,
            @Parameter(description = "数据类型：LIMIT_UP(涨停板)、LIMIT_DOWN(跌停板) 或 ALL(全部)", example = "LIMIT_UP")
            @RequestParam(defaultValue = "LIMIT_UP") String dataType) {
        
        log.info("获取行业分布统计，日期: {}，类型: {}", date, dataType);
        
        // 参数验证
        ExceptionUtils.checkNotNull(date, "查询日期");
        if (!"ALL".equalsIgnoreCase(dataType)) {
            ExceptionUtils.checkLimitBoardType(dataType);
        }
        limitBoardAnalysisService.validateAnalysisParams(date, dataType);
        
        // 查询数据
        List<IndustryDistribution> response = limitBoardAnalysisService.getIndustryDistribution(date, dataType);
        
        return AjaxResult.success("查询成功", response);
    }

    /**
     * 获取行业趋势分析
     *
     * @param date 查询日期
     * @return 行业趋势分析数据
     */
    @GetMapping("/industry/trend/{date}")
    @Operation(summary = "获取行业趋势分析", description = "获取指定日期的行业涨跌停趋势分析数据")
    public AjaxResult getIndustryTrendAnalysis(
            @Parameter(description = "查询日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate date) {
        
        log.info("获取行业趋势分析，日期: {}", date);
        
        // 参数验证
        ExceptionUtils.checkNotNull(date, "查询日期");
        limitBoardAnalysisService.validateAnalysisParams(date, null);
        
        // 查询数据
        IndustryTrendResponse response = limitBoardAnalysisService.getIndustryTrendAnalysis(date);
        
        return AjaxResult.success("查询成功", response);
    }

    // ==================== 跌停板反弹分析接口 ====================

    /**
     * 获取跌停板反弹分析
     *
     * @param date 查询日期
     * @return 跌停板反弹分析数据
     */
    @GetMapping("/rebound/{date}")
    @Operation(summary = "获取跌停板反弹分析", description = "获取指定日期的跌停板次日反弹分析数据")
    public AjaxResult getLimitDownReboundAnalysis(
            @Parameter(description = "查询日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate date) {
        
        log.info("获取跌停板反弹分析，日期: {}", date);
        
        // 参数验证
        ExceptionUtils.checkNotNull(date, "查询日期");
        limitBoardAnalysisService.validateAnalysisParams(date, "LIMIT_DOWN");
        
        // 查询数据
        LimitDownReboundResponse response = limitBoardAnalysisService.getLimitDownReboundAnalysis(date);
        
        return AjaxResult.success("查询成功", response);
    }

    /**
     * 获取跌停板按连跌停数反弹分析
     *
     * @param date 查询日期
     * @return 跌停板按连跌停数反弹分析数据
     */
    @GetMapping("/rebound/consecutive/{date}")
    @Operation(summary = "获取跌停板按连跌停数反弹分析", description = "获取指定日期按不同连跌停数的反弹分析数据")
    public AjaxResult getLimitDownReboundByConsecutive(
            @Parameter(description = "查询日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate date) {
        
        log.info("获取跌停板按连跌停数反弹分析，日期: {}", date);
        
        // 参数验证
        ExceptionUtils.checkNotNull(date, "查询日期");
        limitBoardAnalysisService.validateAnalysisParams(date, "LIMIT_DOWN");
        
        // 查询数据
        LimitDownReboundResponse response = limitBoardAnalysisService.getLimitDownReboundByConsecutive(date);
        
        return AjaxResult.success("查询成功", response);
    }

    /**
     * 获取跌停板按行业反弹分析
     *
     * @param date 查询日期
     * @return 跌停板按行业反弹分析数据
     */
    @GetMapping("/rebound/industry/{date}")
    @Operation(summary = "获取跌停板按行业反弹分析", description = "获取指定日期按不同行业的跌停板反弹分析数据")
    public AjaxResult getLimitDownReboundByIndustry(
            @Parameter(description = "查询日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate date) {
        
        log.info("获取跌停板按行业反弹分析，日期: {}", date);
        
        // 参数验证
        ExceptionUtils.checkNotNull(date, "查询日期");
        limitBoardAnalysisService.validateAnalysisParams(date, "LIMIT_DOWN");
        
        // 查询数据
        LimitDownReboundResponse response = limitBoardAnalysisService.getLimitDownReboundByIndustry(date);
        
        return AjaxResult.success("查询成功", response);
    }

    /**
     * 获取跌停板按市盈率反弹分析
     *
     * @param date 查询日期
     * @return 跌停板按市盈率反弹分析数据
     */
    @GetMapping("/rebound/pe/{date}")
    @Operation(summary = "获取跌停板按市盈率反弹分析", description = "获取指定日期按不同市盈率区间的跌停板反弹分析数据")
    public AjaxResult getLimitDownReboundByPe(
            @Parameter(description = "查询日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate date) {
        
        log.info("获取跌停板按市盈率反弹分析，日期: {}", date);
        
        // 参数验证
        ExceptionUtils.checkNotNull(date, "查询日期");
        limitBoardAnalysisService.validateAnalysisParams(date, "LIMIT_DOWN");
        
        // 查询数据
        LimitDownReboundResponse response = limitBoardAnalysisService.getLimitDownReboundByPe(date);
        
        return AjaxResult.success("查询成功", response);
    }

    // ==================== 连板成功率分析接口 ====================

    /**
     * 获取连板成功率分析
     *
     * @param startDate 开始日期
     * @param endDate   结束日期
     * @param dataType  数据类型
     * @return 连板成功率分析数据
     */
    @GetMapping("/continuous-success-rate")
    @Operation(summary = "获取连板成功率分析", description = "获取指定日期范围内的连板成功率分析数据")
    public AjaxResult getContinuousLimitSuccessRate(
            @Parameter(description = "开始日期，格式：yyyy-MM-dd", example = "2025-01-01")
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate startDate,
            @Parameter(description = "结束日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate endDate,
            @Parameter(description = "数据类型：LIMIT_UP(涨停板) 或 LIMIT_DOWN(跌停板)", example = "LIMIT_UP")
            @RequestParam @NotNull String dataType) {
        
        log.info("获取连板成功率分析，开始日期: {}，结束日期: {}，类型: {}", startDate, endDate, dataType);
        
        // 参数验证
        ExceptionUtils.checkNotNull(startDate, "开始日期");
        ExceptionUtils.checkNotNull(endDate, "结束日期");
        ExceptionUtils.checkNotBlank(dataType, "数据类型");
        ExceptionUtils.checkDateRange(startDate, endDate);
        ExceptionUtils.checkLimitBoardType(dataType);
        limitBoardStatisticsService.validateDateRange(startDate, endDate);
        limitBoardStatisticsService.validateDataType(dataType);
        
        // 查询数据
        ContinuousLimitSuccessRateResponse response = limitBoardAnalysisService
                .getContinuousLimitSuccessRate(startDate, endDate, dataType);
        
        return AjaxResult.success("查询成功", response);
    }

    // ==================== 市场情绪分析接口 ====================

    /**
     * 获取市场情绪指标
     *
     * @param date 查询日期
     * @return 市场情绪指标数据
     */
    @GetMapping("/sentiment/{date}")
    @Operation(summary = "获取市场情绪指标", description = "获取指定日期的市场情绪指标数据")
    public AjaxResult getSentimentIndicator(
            @Parameter(description = "查询日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate date) {
        
        log.info("获取市场情绪指标，日期: {}", date);
        
        // 参数验证
        ExceptionUtils.checkNotNull(date, "查询日期");
        marketSentimentService.validateSentimentParams(date, null);
        
        // 查询数据
        SentimentIndicatorResponse response = marketSentimentService.getSentimentIndicator(date);
        
        return AjaxResult.success("查询成功", response);
    }

    /**
     * 获取市场情绪趋势
     *
     * @param startDate 开始日期
     * @param endDate   结束日期
     * @return 市场情绪趋势数据
     */
    @GetMapping("/sentiment/trend")
    @Operation(summary = "获取市场情绪趋势", description = "获取指定日期范围内的市场情绪趋势数据")
    public AjaxResult getSentimentTrend(
            @Parameter(description = "开始日期，格式：yyyy-MM-dd", example = "2025-01-01")
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate startDate,
            @Parameter(description = "结束日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate endDate) {
        
        log.info("获取市场情绪趋势，开始日期: {}，结束日期: {}", startDate, endDate);
        
        // 参数验证
        ExceptionUtils.checkNotNull(startDate, "开始日期");
        ExceptionUtils.checkNotNull(endDate, "结束日期");
        ExceptionUtils.checkDateRange(startDate, endDate);
        limitBoardStatisticsService.validateDateRange(startDate, endDate);
        
        // 查询数据
        SentimentTrendResponse response = marketSentimentService.getSentimentTrend(startDate, endDate);
        
        return AjaxResult.success("查询成功", response);
    }

    // ==================== 历史对比分析接口 ====================

    /**
     * 获取历史对比分析
     *
     * @param targetDate 目标日期
     * @param days       历史对比天数
     * @return 历史对比分析数据
     */
    @GetMapping("/historical-compare/{targetDate}")
    @Operation(summary = "获取历史对比分析", description = "获取指定日期与历史数据的对比分析")
    public AjaxResult getHistoricalComparison(
            @Parameter(description = "目标日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate targetDate,
            @Parameter(description = "历史对比天数，默认30天", example = "30")
            @RequestParam(defaultValue = "30") @Min(7) @Max(365) Integer days) {
        
        log.info("获取历史对比分析，目标日期: {}，对比天数: {}", targetDate, days);
        
        // 参数验证
        ExceptionUtils.checkNotNull(targetDate, "目标日期");
        ExceptionUtils.checkRange(days, 7, 365, "对比天数");
        marketSentimentService.validateSentimentParams(targetDate, days);
        
        // 查询数据
        PercentileAnalysisResponse response = marketSentimentService.getHistoricalComparison(targetDate, days);
        
        return AjaxResult.success("查询成功", response);
    }

    /**
     * 获取分位数分析
     *
     * @param targetDate 目标日期
     * @param days       历史天数
     * @return 分位数分析数据
     */
    @GetMapping("/percentile/{targetDate}")
    @Operation(summary = "获取分位数分析", description = "获取指定日期各项指标在历史数据中的分位数位置")
    public AjaxResult getPercentileAnalysis(
            @Parameter(description = "目标日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate targetDate,
            @Parameter(description = "历史天数，默认60天", example = "60")
            @RequestParam(defaultValue = "60") @Min(7) @Max(365) Integer days) {
        
        log.info("获取分位数分析，目标日期: {}，历史天数: {}", targetDate, days);
        
        // 参数验证
        ExceptionUtils.checkNotNull(targetDate, "目标日期");
        ExceptionUtils.checkRange(days, 7, 365, "历史天数");
        marketSentimentService.validateSentimentParams(targetDate, days);
        
        // 查询数据
        PercentileAnalysisResponse response = marketSentimentService.getPercentileAnalysis(targetDate, days);
        
        return AjaxResult.success("查询成功", response);
    }

    // ==================== 缓存管理接口 ====================

    /**
     * 刷新指定日期的统计缓存
     *
     * @param date 数据日期
     * @return 刷新结果
     */
    @PostMapping("/cache/refresh/{date}")
    @Operation(summary = "刷新统计缓存", description = "刷新指定日期的所有统计分析缓存数据")
    public AjaxResult refreshStatisticsCache(
            @Parameter(description = "数据日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate date) {
        
        log.info("刷新统计缓存，日期: {}", date);
        
        // 参数验证
        ExceptionUtils.checkNotNull(date, "数据日期");
        
        // 刷新各类缓存
        boolean basicRefreshed = limitBoardStatisticsService.refreshBasicStatisticsCache(date);
        boolean limitUpRefreshed = limitBoardStatisticsService.refreshLimitBoardStatisticsCache(date, "LIMIT_UP");
        boolean limitDownRefreshed = limitBoardStatisticsService.refreshLimitBoardStatisticsCache(date, "LIMIT_DOWN");
        boolean analysisRefreshed = limitBoardAnalysisService.refreshAnalysisCache(date);
        boolean sentimentRefreshed = marketSentimentService.refreshSentimentCache(date);
        
        // 统计刷新结果
        int refreshedCount = 0;
        if (basicRefreshed) refreshedCount++;
        if (limitUpRefreshed) refreshedCount++;
        if (limitDownRefreshed) refreshedCount++;
        if (analysisRefreshed) refreshedCount++;
        if (sentimentRefreshed) refreshedCount++;
        
        return AjaxResult.success("缓存刷新完成", 
                String.format("成功刷新 %d 个缓存模块", refreshedCount));
    }

    /**
     * 清除指定日期的统计缓存
     *
     * @param date 数据日期
     * @return 清除结果
     */
    @DeleteMapping("/cache/clear/{date}")
    @Operation(summary = "清除统计缓存", description = "清除指定日期的所有统计分析缓存数据")
    public AjaxResult clearStatisticsCache(
            @Parameter(description = "数据日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate date) {
        
        log.info("清除统计缓存，日期: {}", date);
        
        // 参数验证
        ExceptionUtils.checkNotNull(date, "数据日期");
        
        // 清除各类缓存
        long statisticsClearedCount = limitBoardStatisticsService.clearStatisticsCache(date);
        long analysisClearedCount = limitBoardAnalysisService.clearAnalysisCache(date);
        long sentimentClearedCount = marketSentimentService.clearSentimentCache(date);
        
        long totalClearedCount = statisticsClearedCount + analysisClearedCount + sentimentClearedCount;
        
        return AjaxResult.success("缓存清除完成", 
                String.format("成功清除 %d 个缓存项", totalClearedCount));
    }

    /**
     * 预热统计缓存
     *
     * @param startDate 开始日期
     * @param endDate   结束日期
     * @return 预热结果
     */
    @PostMapping("/cache/warmup")
    @Operation(summary = "预热统计缓存", description = "预热指定日期范围内的统计分析缓存数据")
    public AjaxResult warmupStatisticsCache(
            @Parameter(description = "开始日期，格式：yyyy-MM-dd", example = "2025-01-01")
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate startDate,
            @Parameter(description = "结束日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate endDate) {
        
        log.info("预热统计缓存，开始日期: {}，结束日期: {}", startDate, endDate);
        
        // 参数验证
        ExceptionUtils.checkNotNull(startDate, "开始日期");
        ExceptionUtils.checkNotNull(endDate, "结束日期");
        ExceptionUtils.checkDateRange(startDate, endDate);
        limitBoardStatisticsService.validateDateRange(startDate, endDate);
        
        // 预热情绪分析缓存
        int warmedUpCount = marketSentimentService.warmupSentimentCache(startDate, endDate);
        
        return AjaxResult.success("缓存预热完成", 
                String.format("成功预热 %d 条数据", warmedUpCount));
    }

    // ==================== 数据可用性检查接口 ====================

    /**
     * 检查数据可用性
     *
     * @param date 查询日期
     * @return 数据可用性信息
     */
    @GetMapping("/data/availability/{date}")
    @Operation(summary = "检查数据可用性", description = "检查指定日期的涨跌停板数据可用性")
    public AjaxResult checkDataAvailability(
            @Parameter(description = "查询日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate date) {
        
        log.info("检查数据可用性，日期: {}", date);
        
        // 参数验证
        ExceptionUtils.checkNotNull(date, "查询日期");
        
        // 检查数据可用性
        boolean hasData = limitBoardStatisticsService.hasDataForDate(date);
        boolean hasLimitUpData = limitBoardStatisticsService.hasDataForDateAndType(date, "LIMIT_UP");
        boolean hasLimitDownData = limitBoardStatisticsService.hasDataForDateAndType(date, "LIMIT_DOWN");
        boolean hasSufficientLimitUpData = limitBoardAnalysisService.hasSufficientDataForAnalysis(date, "LIMIT_UP");
        boolean hasSufficientLimitDownData = limitBoardAnalysisService.hasSufficientDataForAnalysis(date, "LIMIT_DOWN");
        
        // 构建响应数据
        return AjaxResult.success("数据可用性检查完成")
                .put("hasData", hasData)
                .put("hasLimitUpData", hasLimitUpData)
                .put("hasLimitDownData", hasLimitDownData)
                .put("hasSufficientLimitUpData", hasSufficientLimitUpData)
                .put("hasSufficientLimitDownData", hasSufficientLimitDownData)
                .put("dataIntegrity", marketSentimentService.checkDataIntegrity(date));
    }

    /**
     * 获取最新数据日期
     *
     * @return 最新数据日期信息
     */
    @GetMapping("/data/latest")
    @Operation(summary = "获取最新数据日期", description = "获取系统中最新的涨跌停板数据日期")
    public AjaxResult getLatestDataDate() {
        
        log.info("获取最新数据日期");
        
        // 获取最新数据日期
        LocalDate latestDate = limitBoardStatisticsService.getLatestDataDate();
        LocalDate latestLimitUpDate = limitBoardStatisticsService.getLatestDataDate("LIMIT_UP");
        LocalDate latestLimitDownDate = limitBoardStatisticsService.getLatestDataDate("LIMIT_DOWN");
        
        // 构建响应数据
        return AjaxResult.success("获取最新数据日期成功")
                .put("latestDate", latestDate)
                .put("latestLimitUpDate", latestLimitUpDate)
                .put("latestLimitDownDate", latestLimitDownDate);
    }

    // ==================== 异常检测和预警接口 ====================

    /**
     * 检测市场异常情况
     *
     * @param date 检测日期
     * @return 异常检测结果
     */
    @GetMapping("/anomaly/detect/{date}")
    @Operation(summary = "检测市场异常", description = "检测指定日期的市场异常情况")
    public AjaxResult detectMarketAnomalies(
            @Parameter(description = "检测日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate date) {
        
        log.info("检测市场异常，日期: {}", date);
        
        // 参数验证
        ExceptionUtils.checkNotNull(date, "检测日期");
        marketSentimentService.validateSentimentParams(date, null);
        
        // 检测异常
        List<String> anomalies = marketSentimentService.detectMarketAnomalies(date);
        List<String> warnings = marketSentimentService.generateMarketWarnings(date);
        String sentimentExtreme = marketSentimentService.detectSentimentExtreme(date);
        Integer riskLevel = marketSentimentService.calculateMarketRiskLevel(date);
        
        // 构建响应数据
        return AjaxResult.success("异常检测完成")
                .put("anomalies", anomalies)
                .put("warnings", warnings)
                .put("sentimentExtreme", sentimentExtreme)
                .put("riskLevel", riskLevel);
    }

    /**
     * 获取市场风险评估
     *
     * @param date 评估日期
     * @return 市场风险评估结果
     */
    @GetMapping("/risk/assessment/{date}")
    @Operation(summary = "获取市场风险评估", description = "获取指定日期的市场风险评估结果")
    public AjaxResult getMarketRiskAssessment(
            @Parameter(description = "评估日期，格式：yyyy-MM-dd", example = "2025-01-15")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") @NotNull LocalDate date) {
        
        log.info("获取市场风险评估，日期: {}", date);
        
        // 参数验证
        ExceptionUtils.checkNotNull(date, "评估日期");
        marketSentimentService.validateSentimentParams(date, null);
        
        // 风险评估
        Integer riskLevel = marketSentimentService.calculateMarketRiskLevel(date);
        String sentimentLevel = marketSentimentService.getSentimentLevel(date);
        Double sentimentScore = marketSentimentService.calculateSentimentScore(date);
        String trendAnalysis = marketSentimentService.analyzeSentimentTrend(date, 5);
        Double momentum = marketSentimentService.calculateSentimentMomentum(date, 3);
        String prediction = marketSentimentService.predictShortTermSentiment(date);
        
        // 构建响应数据
        return AjaxResult.success("市场风险评估完成")
                .put("riskLevel", riskLevel)
                .put("sentimentLevel", sentimentLevel)
                .put("sentimentScore", sentimentScore)
                .put("trendAnalysis", trendAnalysis)
                .put("momentum", momentum)
                .put("prediction", prediction);
    }

    // ==================== 系统配置和状态接口 ====================

    /**
     * 获取系统配置信息
     *
     * @return 系统配置信息
     */
    @GetMapping("/system/config")
    @Operation(summary = "获取系统配置", description = "获取涨跌停板统计分析系统的配置信息")
    public AjaxResult getSystemConfig() {
        
        log.info("获取系统配置信息");
        
        // 获取配置信息
        String sentimentConfig = marketSentimentService.getSentimentAnalysisConfig();
        
        // 构建响应数据
        return AjaxResult.success("获取系统配置成功")
                .put("sentimentAnalysisConfig", sentimentConfig)
                .put("version", "1.0.0")
                .put("buildDate", "2025-09-01");
    }

    /**
     * 健康检查
     *
     * @return 系统健康状态
     */
    @GetMapping("/health")
    @Operation(summary = "健康检查", description = "检查涨跌停板统计分析系统的健康状态")
    public AjaxResult healthCheck() {
        
        log.info("执行健康检查");
        
        try {
            // 检查最新数据日期
            LocalDate latestDate = limitBoardStatisticsService.getLatestDataDate();
            boolean hasRecentData = latestDate != null && 
                    latestDate.isAfter(LocalDate.now().minusDays(7));
            
            // 构建健康状态
            String status = hasRecentData ? "健康" : "警告";
            String message = hasRecentData ? "系统运行正常" : "数据更新可能存在延迟";
            
            return AjaxResult.success("健康检查完成")
                    .put("status", status)
                    .put("message", message)
                    .put("latestDataDate", latestDate)
                    .put("checkTime", LocalDate.now());
                    
        } catch (Exception e) {
            log.error("健康检查失败", e);
            return AjaxResult.error("健康检查失败: " + e.getMessage());
        }
    }

   // ==================== 批量查询和复杂查询接口 ====================

    /**
     * 批量查询涨跌停板统计数据
     *
     * @param request 查询请求参数
     * @return 批量查询结果
     */
    @PostMapping("/batch/query")
    @Operation(summary = "批量查询统计数据", description = "根据复杂查询条件批量查询涨跌停板统计数据")
    public AjaxResult batchQuery(@RequestBody @Validated LimitBoardQueryRequest request) {
        
        log.info("批量查询统计数据，请求参数: {}", request);
        
        // 参数验证
        request.validateDateRange();
        request.validatePeRange();
        request.validateSealFundsRange();
        
        try {
            // 根据查询类型执行不同的查询逻辑
            if (request.getStartDate() != null && request.getEndDate() != null) {
                // 范围查询
                if ("ALL".equalsIgnoreCase(request.getDataType())) {
                    // 查询基础统计数据
                    List<BasicStatisticsResponse> response = limitBoardStatisticsService
                            .getBasicStatisticsRange(request.getStartDate(), request.getEndDate());
                    return AjaxResult.success("批量查询成功", response);
                } else {
                    // 查询指定类型的详细统计数据
                    List<LimitBoardStatisticsResponse> response = limitBoardStatisticsService
                            .getLimitBoardStatisticsRange(request.getStartDate(), request.getEndDate(), 
                                    request.getEffectiveDataType());
                    return AjaxResult.success("批量查询成功", response);
                }
            } else if (request.getDate() != null) {
                // 单日查询
                if ("ALL".equalsIgnoreCase(request.getDataType())) {
                    // 查询基础统计数据
                    BasicStatisticsResponse response = limitBoardStatisticsService
                            .getBasicStatistics(request.getDate());
                    return AjaxResult.success("查询成功", response);
                } else {
                    // 查询指定类型的详细统计数据
                    LimitBoardStatisticsResponse response = limitBoardStatisticsService
                            .getLimitBoardStatistics(request.getDate(), request.getEffectiveDataType());
                    return AjaxResult.success("查询成功", response);
                }
            } else {
                return AjaxResult.error("查询参数不完整，请提供查询日期或日期范围");
            }
            
        } catch (Exception e) {
            log.error("批量查询失败", e);
            return AjaxResult.error("批量查询失败: " + e.getMessage());
        }
    }

    /**
     * 综合分析查询
     *
     * @param request 查询请求参数
     * @return 综合分析结果
     */
    @PostMapping("/comprehensive/analysis")
    @Operation(summary = "综合分析查询", description = "获取指定日期的综合分析数据，包括基础统计、质量分析、情绪指标等")
    public AjaxResult comprehensiveAnalysis(@RequestBody @Validated LimitBoardQueryRequest request) {
        
        log.info("综合分析查询，请求参数: {}", request);
        
        // 参数验证
        ExceptionUtils.checkNotNull(request.getDate(), "查询日期");
        
        try {
            LocalDate date = request.getDate();
            String dataType = request.getEffectiveDataType();
            
            // 获取基础统计数据
            BasicStatisticsResponse basicStats = limitBoardStatisticsService.getBasicStatistics(date);
            
            // 获取详细统计数据
            LimitBoardStatisticsResponse detailStats = null;
            if (!"ALL".equalsIgnoreCase(dataType)) {
                detailStats = limitBoardStatisticsService.getLimitBoardStatistics(date, dataType);
            }
            
            // 获取质量分析数据
            LimitBoardQualityResponse qualityAnalysis = null;
            if (!"ALL".equalsIgnoreCase(dataType)) {
                qualityAnalysis = limitBoardAnalysisService.getQualityAnalysis(date, dataType);
            }
            
            // 获取涨跌停对比数据
            LimitBoardComparisonResponse comparison = limitBoardAnalysisService.getLimitBoardComparison(date);
            
            // 获取市场情绪指标
            SentimentIndicatorResponse sentiment = marketSentimentService.getSentimentIndicator(date);
            
            // 获取行业分布数据
            List<IndustryDistribution> industryDistribution = null;
            if (request.isNeedDistribution()) {
                industryDistribution = limitBoardAnalysisService.getIndustryDistribution(date, dataType);
            }
            
            // 获取跌停板反弹分析（仅当查询跌停板时）
            LimitDownReboundResponse reboundAnalysis = null;
            if ("LIMIT_DOWN".equalsIgnoreCase(dataType)) {
                reboundAnalysis = limitBoardAnalysisService.getLimitDownReboundAnalysis(date);
            }
            
            // 构建综合分析结果
            return AjaxResult.success("综合分析查询成功")
                    .put("basicStatistics", basicStats)
                    .put("detailStatistics", detailStats)
                    .put("qualityAnalysis", qualityAnalysis)
                    .put("comparison", comparison)
                    .put("sentiment", sentiment)
                    .put("industryDistribution", industryDistribution)
                    .put("reboundAnalysis", reboundAnalysis);
                    
        } catch (Exception e) {
            log.error("综合分析查询失败", e);
            return AjaxResult.error("综合分析查询失败: " + e.getMessage());
        }
    }

    /**
     * 导出统计数据
     *
     * @param request 导出请求参数
     * @return 导出结果
     */
    @PostMapping("/export")
    @Operation(summary = "导出统计数据", description = "导出指定条件的涨跌停板统计数据为JSON格式")
    public AjaxResult exportStatisticsData(@RequestBody @Validated LimitBoardQueryRequest request) {
        
        log.info("导出统计数据，请求参数: {}", request);
        
        // 参数验证
        request.validateDateRange();
        
        try {
            // 根据请求参数构建导出数据
            Object exportData;
            
            if (request.getStartDate() != null && request.getEndDate() != null) {
                // 范围导出
                if ("ALL".equalsIgnoreCase(request.getDataType())) {
                    exportData = limitBoardStatisticsService
                            .getBasicStatisticsRange(request.getStartDate(), request.getEndDate());
                } else {
                    exportData = limitBoardStatisticsService
                            .getLimitBoardStatisticsRange(request.getStartDate(), request.getEndDate(), 
                                    request.getEffectiveDataType());
                }
            } else if (request.getDate() != null) {
                // 单日导出
                if ("ALL".equalsIgnoreCase(request.getDataType())) {
                    exportData = limitBoardStatisticsService.getBasicStatistics(request.getDate());
                } else {
                    exportData = limitBoardStatisticsService
                            .getLimitBoardStatistics(request.getDate(), request.getEffectiveDataType());
                }
            } else {
                return AjaxResult.error("导出参数不完整，请提供查询日期或日期范围");
            }
            
            // 构建导出信息
            String exportInfo = String.format("导出时间: %s, 数据类型: %s, 记录数: %s", 
                    LocalDate.now(), 
                    request.getEffectiveDataType(),
                    exportData instanceof List ? ((List<?>) exportData).size() : 1);
            
            return AjaxResult.success("数据导出成功")
                    .put("exportData", exportData)
                    .put("exportInfo", exportInfo)
                    .put("exportFormat", "JSON");
                    
        } catch (Exception e) {
            log.error("导出统计数据失败", e);
            return AjaxResult.error("导出统计数据失败: " + e.getMessage());
        }
    }
}