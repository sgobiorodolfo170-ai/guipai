package com.gsxi.trading.tradeinsight.service.impl;

import com.gsxi.trading.tradeinsight.dto.internal.*;
import com.gsxi.trading.tradeinsight.dto.response.*;
import com.gsxi.trading.tradeinsight.exception.BizException;
import com.gsxi.trading.tradeinsight.dolphindb.StockLimitPoolDolphinDBRepository;
import com.gsxi.trading.tradeinsight.service.LimitBoardAnalysisService;
import com.gsxi.trading.tradeinsight.service.LimitBoardStatisticsService;
import com.gsxi.trading.tradeinsight.util.cache.LimitBoardCacheUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/1/1
 * @description 涨跌停板分析服务实现类
 * 实现统一的质量分析功能，支持涨停和跌停，实现行业分析和趋势计算，实现跌停板反弹分析功能
 */
@Slf4j
@Service
public class LimitBoardAnalysisServiceImpl implements LimitBoardAnalysisService {

    @Autowired
    private StockLimitPoolDolphinDBRepository stockLimitPoolDolphinDBRepository;

    @Autowired
    private LimitBoardCacheUtil cacheUtil;

    @Autowired
    private LimitBoardStatisticsService statisticsService;

    /**
     * 支持的数据类型
     */
    private static final String LIMIT_UP_TYPE = "LIMIT_UP";
    private static final String LIMIT_DOWN_TYPE = "LIMIT_DOWN";

    /**
     * 最小分析数据量
     */
    private static final int MIN_ANALYSIS_COUNT = 5;

    // ==================== 连板分析功能 ====================

    @Override
    public List<ContinuousLimitDistribution> getContinuousLimitDistribution(LocalDate date, String dataType) {
        log.debug("开始查询连板分布统计: date={}, dataType={}", date, dataType);
        
        validateAnalysisParams(date, dataType);
        
        try {
            // 尝试从缓存获取
            List<ContinuousLimitDistributionDTO> cachedData = 
                    cacheUtil.getContinuousDistribution(date, dataType, ContinuousLimitDistributionDTO.class);
            if (!CollectionUtils.isEmpty(cachedData)) {
                log.debug("从缓存获取连板分布数据成功: date={}, dataType={}", date, dataType);
                return convertToContinuousLimitDistributionList(cachedData);
            }
            
            // 从数据库查询
            List<ContinuousLimitDistributionDTO> distributionData = 
                    stockLimitPoolDolphinDBRepository.getContinuousLimitDistribution(date, dataType);
            
            if (CollectionUtils.isEmpty(distributionData)) {
                log.info("指定日期和类型无连板分布数据: date={}, dataType={}", date, dataType);
                return new ArrayList<>();
            }
            
            // 数据转换
            List<ContinuousLimitDistributionDTO> convertedData = distributionData.stream()
                    .map(ContinuousLimitDistributionDTO::convertUnits)
                    .filter(data -> data != null && data.isValid())
                    .collect(Collectors.toList());
            
            // 设置缓存
            cacheUtil.setContinuousDistribution(date, dataType, convertedData);
            
            log.debug("查询连板分布统计成功: date={}, dataType={}, count={}", 
                    date, dataType, convertedData.size());
            return convertToContinuousLimitDistributionList(convertedData);
            
        } catch (Exception e) {
            log.error("查询连板分布统计失败: date={}, dataType={}, error={}", 
                    date, dataType, e.getMessage(), e);
            throw new BizException("查询连板分布统计失败: " + e.getMessage());
        }
    }

    @Override
    public ContinuousLimitSuccessRateResponse getContinuousLimitSuccessRate(
            LocalDate startDate, LocalDate endDate, String dataType) {
        log.debug("开始查询连板成功率分析: startDate={}, endDate={}, dataType={}", 
                startDate, endDate, dataType);
        
        statisticsService.validateDateRange(startDate, endDate);
        validateAnalysisParams(startDate, dataType);
        
        try {
            // 尝试从缓存获取
            List<ContinuousLimitSuccessRateDTO> cachedData = 
                    cacheUtil.getContinuousSuccessRate(startDate, endDate, dataType, ContinuousLimitSuccessRateDTO.class);
            if (!CollectionUtils.isEmpty(cachedData)) {
                log.debug("从缓存获取连板成功率数据成功: startDate={}, endDate={}, dataType={}", 
                        startDate, endDate, dataType);
                return convertToContinuousLimitSuccessRateResponse(cachedData, startDate, endDate, dataType);
            }
            
            // 从数据库查询
            List<ContinuousLimitSuccessRateDTO> successRateData = 
                    stockLimitPoolDolphinDBRepository.getContinuousLimitSuccessRate(startDate, endDate, dataType);
            
            if (CollectionUtils.isEmpty(successRateData)) {
                log.info("指定日期范围和类型无连板成功率数据: startDate={}, endDate={}, dataType={}", 
                        startDate, endDate, dataType);
                return createEmptyContinuousLimitSuccessRateResponse(startDate, endDate, dataType);
            }
            
            // 数据转换
            List<ContinuousLimitSuccessRateDTO> convertedData = successRateData.stream()
                    .map(ContinuousLimitSuccessRateDTO::convertUnits)
                    .filter(data -> data != null && data.isValid())
                    .collect(Collectors.toList());
            
            // 设置缓存
            cacheUtil.setContinuousSuccessRate(startDate, endDate, dataType, convertedData);
            
            log.debug("查询连板成功率分析成功: startDate={}, endDate={}, dataType={}, count={}", 
                    startDate, endDate, dataType, convertedData.size());
            return convertToContinuousLimitSuccessRateResponse(convertedData, startDate, endDate, dataType);
            
        } catch (Exception e) {
            log.error("查询连板成功率分析失败: startDate={}, endDate={}, dataType={}, error={}", 
                    startDate, endDate, dataType, e.getMessage(), e);
            throw new BizException("查询连板成功率分析失败: " + e.getMessage());
        }
    }

    // ==================== 时间分布分析 ====================

    @Override
    public List<TimeDistribution> getTimeDistribution(LocalDate date, String dataType) {
        log.debug("开始查询时间分布统计: date={}, dataType={}", date, dataType);
        
        validateAnalysisParams(date, dataType);
        
        try {
            // 从数据库查询
            List<TimeDistributionDTO> distributionData = 
                    stockLimitPoolDolphinDBRepository.getTimeDistribution(date, dataType);
            
            if (CollectionUtils.isEmpty(distributionData)) {
                log.info("指定日期和类型无时间分布数据: date={}, dataType={}", date, dataType);
                return new ArrayList<>();
            }
            
            // 数据转换
            List<TimeDistribution> result = distributionData.stream()
                    .map(TimeDistributionDTO::convertUnits)
                    .filter(data -> data != null && data.isValid())
                    .map(this::convertToTimeDistribution)
                    .collect(Collectors.toList());
            
            log.debug("查询时间分布统计成功: date={}, dataType={}, count={}", 
                    date, dataType, result.size());
            return result;
            
        } catch (Exception e) {
            log.error("查询时间分布统计失败: date={}, dataType={}, error={}", 
                    date, dataType, e.getMessage(), e);
            throw new BizException("查询时间分布统计失败: " + e.getMessage());
        }
    }

    // ==================== 行业分析功能 ====================

    @Override
    public List<IndustryDistribution> getIndustryDistribution(LocalDate date, String dataType) {
        log.debug("开始查询行业分布统计: date={}, dataType={}", date, dataType);
        
        validateAnalysisParams(date, dataType);
        
        try {
            // 从数据库查询
            List<IndustryDistributionDTO> distributionData = 
                    stockLimitPoolDolphinDBRepository.getIndustryDistribution(date, dataType);
            
            if (CollectionUtils.isEmpty(distributionData)) {
                log.info("指定日期和类型无行业分布数据: date={}, dataType={}", date, dataType);
                return new ArrayList<>();
            }
            
            // 数据转换
            List<IndustryDistribution> result = distributionData.stream()
                    .map(IndustryDistributionDTO::convertUnits)
                    .filter(data -> data != null && data.isValid())
                    .map(this::convertToIndustryDistribution)
                    .collect(Collectors.toList());
            
            log.debug("查询行业分布统计成功: date={}, dataType={}, count={}", 
                    date, dataType, result.size());
            return result;
            
        } catch (Exception e) {
            log.error("查询行业分布统计失败: date={}, dataType={}, error={}", 
                    date, dataType, e.getMessage(), e);
            throw new BizException("查询行业分布统计失败: " + e.getMessage());
        }
    }

    @Override
    public IndustryTrendResponse getIndustryTrendAnalysis(LocalDate date) {
        log.debug("开始查询行业趋势分析: date={}", date);
        
        statisticsService.validateQueryDate(date);
        
        try {
            // 从数据库查询
            List<IndustryComparisonDTO> comparisonData = 
                    stockLimitPoolDolphinDBRepository.getIndustryComparisonAnalysis(date);
            
            if (CollectionUtils.isEmpty(comparisonData)) {
                log.info("指定日期无行业对比数据: date={}", date);
                return createEmptyIndustryTrendResponse(date);
            }
            
            // 数据转换
            List<IndustryComparisonDTO> convertedData = comparisonData.stream()
                    .map(IndustryComparisonDTO::convertUnits)
                    .filter(data -> data != null && data.isValid())
                    .collect(Collectors.toList());
            
            log.debug("查询行业趋势分析成功: date={}, count={}", date, convertedData.size());
            return convertToIndustryTrendResponse(convertedData, date);
            
        } catch (Exception e) {
            log.error("查询行业趋势分析失败: date={}, error={}", date, e.getMessage(), e);
            throw new BizException("查询行业趋势分析失败: " + e.getMessage());
        }
    }

    // ==================== 质量分析功能 ====================

    @Override
    public LimitBoardQualityResponse getQualityAnalysis(LocalDate date, String dataType) {
        log.debug("开始查询质量分析: date={}, dataType={}", date, dataType);
        
        validateAnalysisParams(date, dataType);
        
        try {
            // 尝试从缓存获取
            LimitBoardQualityDTO cachedData = 
                    cacheUtil.getQualityAnalysis(date, dataType, LimitBoardQualityDTO.class);
            if (cachedData != null && cachedData.isValid()) {
                log.debug("从缓存获取质量分析数据成功: date={}, dataType={}", date, dataType);
                return convertToLimitBoardQualityResponse(cachedData);
            }
            
            // 从数据库查询
            LimitBoardQualityDTO qualityData = 
                    stockLimitPoolDolphinDBRepository.getQualityStatistics(date, dataType);
            
            if (qualityData == null || !qualityData.isValid()) {
                log.info("指定日期和类型无质量分析数据: date={}, dataType={}", date, dataType);
                return createEmptyLimitBoardQualityResponse(date, dataType);
            }
            
            // 数据转换
            LimitBoardQualityDTO convertedData = qualityData.convertUnits();
            
            // 设置缓存
            cacheUtil.setQualityAnalysis(date, dataType, convertedData);
            
            log.debug("查询质量分析成功: date={}, dataType={}", date, dataType);
            return convertToLimitBoardQualityResponse(convertedData);
            
        } catch (Exception e) {
            log.error("查询质量分析失败: date={}, dataType={}, error={}", 
                    date, dataType, e.getMessage(), e);
            throw new BizException("查询质量分析失败: " + e.getMessage());
        }
    }

    // ==================== 跌停板反弹分析 ====================

    @Override
    public LimitDownReboundResponse getLimitDownReboundAnalysis(LocalDate date) {
        log.debug("开始查询跌停板反弹分析: date={}", date);
        
        statisticsService.validateQueryDate(date);
        
        try {
            // 从数据库查询
            LimitDownReboundDTO reboundData = 
                    stockLimitPoolDolphinDBRepository.getLimitDownReboundAnalysis(date);
            
            if (reboundData == null || !reboundData.isValid()) {
                log.info("指定日期无跌停板反弹数据: date={}", date);
                return createEmptyLimitDownReboundResponse(date);
            }
            
            // 数据转换
            LimitDownReboundDTO convertedData = reboundData.convertUnits();
            
            log.debug("查询跌停板反弹分析成功: date={}", date);
            return convertToLimitDownReboundResponse(convertedData);
            
        } catch (Exception e) {
            log.error("查询跌停板反弹分析失败: date={}, error={}", date, e.getMessage(), e);
            throw new BizException("查询跌停板反弹分析失败: " + e.getMessage());
        }
    }

    @Override
    public LimitDownReboundResponse getLimitDownReboundByConsecutive(LocalDate date) {
        log.debug("开始查询跌停板按连跌停数反弹分析: date={}", date);
        
        statisticsService.validateQueryDate(date);
        
        try {
            // 从数据库查询
            List<LimitDownReboundDTO> reboundDataList = 
                    stockLimitPoolDolphinDBRepository.getLimitDownReboundByConsecutive(date);
            
            if (CollectionUtils.isEmpty(reboundDataList)) {
                log.info("指定日期无跌停板按连跌停数反弹数据: date={}", date);
                return createEmptyLimitDownReboundResponse(date);
            }
            
            // 数据转换和聚合
            LimitDownReboundResponse response = aggregateLimitDownReboundData(reboundDataList, date);
            
            log.debug("查询跌停板按连跌停数反弹分析成功: date={}, count={}", 
                    date, reboundDataList.size());
            return response;
            
        } catch (Exception e) {
            log.error("查询跌停板按连跌停数反弹分析失败: date={}, error={}", date, e.getMessage(), e);
            throw new BizException("查询跌停板按连跌停数反弹分析失败: " + e.getMessage());
        }
    }

    @Override
    public LimitDownReboundResponse getLimitDownReboundByIndustry(LocalDate date) {
        log.debug("开始查询跌停板按行业反弹分析: date={}", date);
        
        statisticsService.validateQueryDate(date);
        
        try {
            // 从数据库查询
            List<LimitDownReboundDTO> reboundDataList = 
                    stockLimitPoolDolphinDBRepository.getLimitDownReboundByIndustry(date);
            
            if (CollectionUtils.isEmpty(reboundDataList)) {
                log.info("指定日期无跌停板按行业反弹数据: date={}", date);
                return createEmptyLimitDownReboundResponse(date);
            }
            
            // 数据转换和聚合
            LimitDownReboundResponse response = aggregateLimitDownReboundData(reboundDataList, date);
            
            log.debug("查询跌停板按行业反弹分析成功: date={}, count={}", 
                    date, reboundDataList.size());
            return response;
            
        } catch (Exception e) {
            log.error("查询跌停板按行业反弹分析失败: date={}, error={}", date, e.getMessage(), e);
            throw new BizException("查询跌停板按行业反弹分析失败: " + e.getMessage());
        }
    }

    @Override
    public LimitDownReboundResponse getLimitDownReboundByPe(LocalDate date) {
        log.debug("开始查询跌停板按市盈率反弹分析: date={}", date);
        
        statisticsService.validateQueryDate(date);
        
        try {
            // 从数据库查询
            List<LimitDownReboundDTO> reboundDataList = 
                    stockLimitPoolDolphinDBRepository.getLimitDownReboundByPe(date);
            
            if (CollectionUtils.isEmpty(reboundDataList)) {
                log.info("指定日期无跌停板按市盈率反弹数据: date={}", date);
                return createEmptyLimitDownReboundResponse(date);
            }
            
            // 数据转换和聚合
            LimitDownReboundResponse response = aggregateLimitDownReboundData(reboundDataList, date);
            
            log.debug("查询跌停板按市盈率反弹分析成功: date={}, count={}", 
                    date, reboundDataList.size());
            return response;
            
        } catch (Exception e) {
            log.error("查询跌停板按市盈率反弹分析失败: date={}, error={}", date, e.getMessage(), e);
            throw new BizException("查询跌停板按市盈率反弹分析失败: " + e.getMessage());
        }
    }

    // ==================== 涨跌停对比分析 ====================

    @Override
    public LimitBoardComparisonResponse getLimitBoardComparison(LocalDate date) {
        log.debug("开始查询涨跌停对比分析: date={}", date);
        
        statisticsService.validateQueryDate(date);
        
        try {
            // 从数据库查询
            LimitBoardComparisonDTO comparisonData = 
                    stockLimitPoolDolphinDBRepository.getLimitBoardComparison(date);
            
            if (comparisonData == null || !comparisonData.isValid()) {
                log.info("指定日期无涨跌停对比数据: date={}", date);
                return createEmptyLimitBoardComparisonResponse(date);
            }
            
            // 数据转换
            LimitBoardComparisonDTO convertedData = comparisonData.convertUnits();
            
            log.debug("查询涨跌停对比分析成功: date={}", date);
            return convertToLimitBoardComparisonResponse(convertedData);
            
        } catch (Exception e) {
            log.error("查询涨跌停对比分析失败: date={}, error={}", date, e.getMessage(), e);
            throw new BizException("查询涨跌停对比分析失败: " + e.getMessage());
        }
    }

    @Override
    public List<LimitBoardComparisonResponse> getLimitBoardComparisonRange(LocalDate startDate, LocalDate endDate) {
        log.debug("开始查询涨跌停对比分析范围: startDate={}, endDate={}", startDate, endDate);
        
        statisticsService.validateDateRange(startDate, endDate);
        
        try {
            // 从数据库查询
            List<LimitBoardComparisonDTO> comparisonDataList = 
                    stockLimitPoolDolphinDBRepository.getLimitBoardComparisonRange(startDate, endDate);
            
            if (CollectionUtils.isEmpty(comparisonDataList)) {
                log.info("指定日期范围无涨跌停对比数据: startDate={}, endDate={}", startDate, endDate);
                return new ArrayList<>();
            }
            
            // 数据转换
            List<LimitBoardComparisonResponse> result = comparisonDataList.stream()
                    .map(LimitBoardComparisonDTO::convertUnits)
                    .filter(data -> data != null && data.isValid())
                    .map(this::convertToLimitBoardComparisonResponse)
                    .collect(Collectors.toList());
            
            log.debug("查询涨跌停对比分析范围成功: startDate={}, endDate={}, count={}", 
                    startDate, endDate, result.size());
            return result;
            
        } catch (Exception e) {
            log.error("查询涨跌停对比分析范围失败: startDate={}, endDate={}, error={}", 
                    startDate, endDate, e.getMessage(), e);
            throw new BizException("查询涨跌停对比分析范围失败: " + e.getMessage());
        }
    }

    // ==================== 缓存管理 ====================

    @Override
    public boolean refreshAnalysisCache(LocalDate date) {
        log.debug("开始刷新分析缓存: date={}", date);
        
        try {
            // 清除相关缓存
            long clearedCount = cacheUtil.clearDateRelatedCache(date);
            log.debug("清除分析缓存: date={}, clearedCount={}", date, clearedCount);
            
            // 预热主要缓存
            boolean success = true;
            
            // 预热涨停板质量分析缓存
            try {
                getQualityAnalysis(date, LIMIT_UP_TYPE);
            } catch (Exception e) {
                log.warn("预热涨停板质量分析缓存失败: date={}, error={}", date, e.getMessage());
                success = false;
            }
            
            // 预热跌停板质量分析缓存
            try {
                getQualityAnalysis(date, LIMIT_DOWN_TYPE);
            } catch (Exception e) {
                log.warn("预热跌停板质量分析缓存失败: date={}, error={}", date, e.getMessage());
                success = false;
            }
            
            log.debug("刷新分析缓存完成: date={}, success={}", date, success);
            return success;
            
        } catch (Exception e) {
            log.error("刷新分析缓存失败: date={}, error={}", date, e.getMessage(), e);
            return false;
        }
    }

    @Override
    public boolean refreshAnalysisCache(LocalDate date, String dataType) {
        log.debug("开始刷新分析缓存: date={}, dataType={}", date, dataType);
        
        try {
            validateAnalysisParams(date, dataType);
            
            // 重新查询并缓存质量分析数据
            getQualityAnalysis(date, dataType);
            
            // 重新查询并缓存连板分布数据
            getContinuousLimitDistribution(date, dataType);
            
            log.debug("刷新分析缓存成功: date={}, dataType={}", date, dataType);
            return true;
            
        } catch (Exception e) {
            log.error("刷新分析缓存失败: date={}, dataType={}, error={}", 
                    date, dataType, e.getMessage(), e);
            return false;
        }
    }

    @Override
    public long clearAnalysisCache(LocalDate date) {
        log.debug("开始清除分析缓存: date={}", date);
        
        try {
            long clearedCount = cacheUtil.clearDateRelatedCache(date);
            log.debug("清除分析缓存成功: date={}, clearedCount={}", date, clearedCount);
            return clearedCount;
        } catch (Exception e) {
            log.error("清除分析缓存失败: date={}, error={}", date, e.getMessage(), e);
            return 0;
        }
    }

    // ==================== 数据验证 ====================

    @Override
    public void validateAnalysisParams(LocalDate date, String dataType) {
        statisticsService.validateQueryDate(date);
        if (StringUtils.hasText(dataType)) {
            statisticsService.validateDataType(dataType);
        }
    }

    @Override
    public boolean hasSufficientDataForAnalysis(LocalDate date, String dataType) {
        try {
            validateAnalysisParams(date, dataType);
            
            // 检查数据量是否足够进行分析
            int count = stockLimitPoolDolphinDBRepository.countByTradeDateAndType(date, dataType);
            return count >= MIN_ANALYSIS_COUNT;
            
        } catch (Exception e) {
            log.error("检查分析数据充足性失败: date={}, dataType={}, error={}", 
                    date, dataType, e.getMessage(), e);
            return false;
        }
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 转换连板分布DTO列表为响应对象列表
     */
    private List<ContinuousLimitDistribution> convertToContinuousLimitDistributionList(
            List<ContinuousLimitDistributionDTO> dtoList) {
        return dtoList.stream()
                .map(dto -> ContinuousLimitDistribution.builder()
                        .continuousLimit(dto.getContinuousLimit())
                        .count(dto.getCount())
                        .percentage(dto.getPercentage())
                        .avgSealFunds(dto.getAvgSealFunds())
                        .avgMarketValue(dto.getAvgMarketValue())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 转换连板成功率DTO列表为响应对象
     */
    private ContinuousLimitSuccessRateResponse convertToContinuousLimitSuccessRateResponse(
            List<ContinuousLimitSuccessRateDTO> dtoList, LocalDate startDate, LocalDate endDate, String dataType) {
        
        List<ContinuousLimitSuccessRateResponse.SuccessRateData> successRateDataList = dtoList.stream()
                .map(dto -> ContinuousLimitSuccessRateResponse.SuccessRateData.builder()
                        .continuousLimit(dto.getContinuousLimit())
                        .totalCount(dto.getTotalCount())
                        .successCount(dto.getSuccessCount())
                        .successRate(dto.getSuccessRate())
                        .build())
                .collect(Collectors.toList());
        
        return ContinuousLimitSuccessRateResponse.builder()
                .dataType(dataType)
                .successRateData(successRateDataList)
                .build();
    }

    /**
     * 转换时间分布DTO为响应对象
     */
    private TimeDistribution convertToTimeDistribution(TimeDistributionDTO dto) {
        return TimeDistribution.builder()
                .timeRange(dto.getTimeRange())
                .timeDesc(dto.getTimeDesc())
                .count(dto.getCount())
                .percentage(dto.getPercentage())
                .build();
    }

    /**
     * 转换行业分布DTO为响应对象
     */
    private IndustryDistribution convertToIndustryDistribution(IndustryDistributionDTO dto) {
        return IndustryDistribution.builder()
                .industry(dto.getIndustry())
                .count(dto.getCount())
                .percentage(dto.getPercentage())
                .avgSealFunds(dto.getAvgSealFunds())
                .avgMarketValue(dto.getAvgMarketValue())
                .rank(dto.getRank())
                .build();
    }

    /**
     * 转换行业对比DTO列表为行业趋势响应对象
     */
    private IndustryTrendResponse convertToIndustryTrendResponse(
            List<IndustryComparisonDTO> dtoList, LocalDate date) {
        
        // 创建每日行业数据
        List<IndustryTrendResponse.IndustryTrendData> trendDataList = dtoList.stream()
                .map(dto -> {
                    // 创建单日数据
                    IndustryTrendResponse.DailyIndustryData dailyData = 
                            IndustryTrendResponse.DailyIndustryData.builder()
                                    .tradeDate(date)
                                    .limitUpCount(dto.getLimitUpCount() != null ? dto.getLimitUpCount().intValue() : 0)
                                    .limitDownCount(dto.getLimitDownCount() != null ? dto.getLimitDownCount().intValue() : 0)
                                    .percentage(dto.getNetRatio())
                                    .build();
                    
                    // 计算平均涨停数量（单日数据就是当日数量）
                    BigDecimal avgLimitCount = dto.getLimitUpCount() != null ? 
                            new BigDecimal(dto.getLimitUpCount()) : BigDecimal.ZERO;
                    
                    // 判断趋势方向（基于净比率）
                    String trendDirection = "平稳";
                    if (dto.getNetRatio() != null) {
                        if (dto.getNetRatio().compareTo(BigDecimal.ZERO) > 0) {
                            trendDirection = "上升";
                        } else if (dto.getNetRatio().compareTo(BigDecimal.ZERO) < 0) {
                            trendDirection = "下降";
                        }
                    }
                    
                    return IndustryTrendResponse.IndustryTrendData.builder()
                            .industry(dto.getIndustry())
                            .dailyData(List.of(dailyData))
                            .avgLimitCount(avgLimitCount)
                            .trendDirection(trendDirection)
                            .build();
                })
                .collect(Collectors.toList());
        
        // 提取热点行业轮动分析
        List<String> hotIndustryRotation = dtoList.stream()
                .filter(IndustryComparisonDTO::isHotIndustry)
                .map(IndustryComparisonDTO::getIndustry)
                .collect(Collectors.toList());
        
        return IndustryTrendResponse.builder()
                .startDate(date)
                .endDate(date)
                .dataType("ALL")
                .industryTrends(trendDataList)
                .hotIndustryRotation(hotIndustryRotation)
                .build();
    }

    /**
     * 转换质量分析DTO为响应对象
     */
    private LimitBoardQualityResponse convertToLimitBoardQualityResponse(LimitBoardQualityDTO dto) {
        return LimitBoardQualityResponse.builder()
                .tradeDate(dto.getTradeDate())
                .dataType(dto.getDataType())
                .oneWordBoardRate(dto.getOneWordBoardRate())
                .earlyLimitRate(dto.getEarlyLimitRate())
                .noonLimitRate(dto.getNoonLimitRate())
                .lateLimitRate(dto.getLateLimitRate())
                .avgSealStrength(dto.getAvgSealStrength())
                .strongSealRate(dto.getStrongSealRate())
                .blastCount(dto.getBlastCount())
                .resealCount(dto.getResealCount())
                .avgBlastTimes(dto.getAvgBlastTimes())
                .avgDynamicPe(dto.getAvgDynamicPe())
                .lowPeRate(dto.getLowPeRate())
                .openBoardCount(dto.getOpenBoardCount())
                .avgOpenTimes(dto.getAvgOpenTimes())
                .build();
    }

    /**
     * 转换跌停板反弹DTO为响应对象
     */
    private LimitDownReboundResponse convertToLimitDownReboundResponse(LimitDownReboundDTO dto) {
        BigDecimal reboundRate = dto.calculateReboundRate();
        String reboundStrength = dto.getReboundStrength();
        String avgReboundStrength = dto.getAvgReboundStrength();
        
        return LimitDownReboundResponse.builder()
                .tradeDate(dto.getTradeDate())
                .totalLimitDownCount(dto.getTotalLimitDownCount())
                .reboundCount(dto.getReboundCount())
                .reboundRate(reboundRate)
                .avgReboundIncrease(dto.getAvgReboundIncrease())
                .build();
    }

    /**
     * 转换涨跌停对比DTO为响应对象
     */
    private LimitBoardComparisonResponse convertToLimitBoardComparisonResponse(LimitBoardComparisonDTO dto) {
        BigDecimal limitUpDownRatio = dto.calculateLimitUpDownRatio();
        BigDecimal fundFlowRatio = dto.calculateFundFlowRatio();
        String marketSentiment = dto.getMarketSentiment();
        
        return LimitBoardComparisonResponse.builder()
                .tradeDate(dto.getTradeDate())
                .limitUpCount(dto.getLimitUpCount())
                .limitDownCount(dto.getLimitDownCount())
                .limitUpTotalFunds(dto.getLimitUpTotalFunds())
                .limitDownTotalFunds(dto.getLimitDownTotalFunds())
                .limitUpOneWordRate(dto.getLimitUpOneWordRate())
                .limitDownOneWordRate(dto.getLimitDownOneWordRate())
                .limitUpContinuousRate(dto.getLimitUpContinuousRate())
                .limitDownContinuousRate(dto.getLimitDownContinuousRate())
                .limitUpDownRatio(limitUpDownRatio)
                .fundFlowRatio(fundFlowRatio)
                .build();
    }

    /**
     * 聚合跌停板反弹数据
     */
    private LimitDownReboundResponse aggregateLimitDownReboundData(
            List<LimitDownReboundDTO> reboundDataList, LocalDate date) {
        
        // 计算总体统计
        Integer totalLimitDownCount = Math.toIntExact(reboundDataList.stream()
                .mapToLong(dto -> dto.getTotalLimitDownCount() != null ? dto.getTotalLimitDownCount() : 0)
                .sum());

        Integer totalReboundCount = Math.toIntExact(reboundDataList.stream()
                .mapToLong(dto -> dto.getReboundCount() != null ? dto.getReboundCount() : 0)
                .sum());
        
        BigDecimal avgReboundIncrease = reboundDataList.stream()
                .filter(dto -> dto.getAvgReboundIncrease() != null)
                .map(LimitDownReboundDTO::getAvgReboundIncrease)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(reboundDataList.size()), 2, BigDecimal.ROUND_HALF_UP);
        
        // 创建聚合的DTO
        LimitDownReboundDTO aggregatedDto = LimitDownReboundDTO.builder()
                .tradeDate(date)
                .totalLimitDownCount(totalLimitDownCount)
                .reboundCount(totalReboundCount)
                .avgReboundIncrease(avgReboundIncrease)
                .build();
        
        return convertToLimitDownReboundResponse(aggregatedDto);
    }

    /**
     * 创建空的连板成功率响应对象
     */
    private ContinuousLimitSuccessRateResponse createEmptyContinuousLimitSuccessRateResponse(
            LocalDate startDate, LocalDate endDate, String dataType) {
        return ContinuousLimitSuccessRateResponse.builder()
                .dataType(dataType)
                .successRateData(new ArrayList<>())
                .build();
    }

    /**
     * 创建空的行业趋势响应对象
     */
    private IndustryTrendResponse createEmptyIndustryTrendResponse(LocalDate date) {
        return IndustryTrendResponse.builder()
                .startDate(date)
                .endDate(date)
                .dataType("ALL")
                .industryTrends(new ArrayList<>())
                .hotIndustryRotation(new ArrayList<>())
                .build();
    }

    /**
     * 创建空的质量分析响应对象
     */
    private LimitBoardQualityResponse createEmptyLimitBoardQualityResponse(LocalDate date, String dataType) {
        return LimitBoardQualityResponse.builder()
                .tradeDate(date)
                .dataType(dataType)
                .oneWordBoardRate(BigDecimal.ZERO)
                .earlyLimitRate(BigDecimal.ZERO)
                .noonLimitRate(BigDecimal.ZERO)
                .lateLimitRate(BigDecimal.ZERO)
                .avgSealStrength(BigDecimal.ZERO)
                .strongSealRate(BigDecimal.ZERO)
                .blastCount(0)
                .resealCount(0)
                .avgBlastTimes(BigDecimal.ZERO)
                .avgDynamicPe(BigDecimal.ZERO)
                .lowPeRate(BigDecimal.ZERO)
                .openBoardCount(0)
                .avgOpenTimes(BigDecimal.ZERO)
                .build();
    }

    /**
     * 创建空的跌停板反弹响应对象
     */
    private LimitDownReboundResponse createEmptyLimitDownReboundResponse(LocalDate date) {
        return LimitDownReboundResponse.builder()
                .tradeDate(date)
                .totalLimitDownCount(0)
                .reboundCount(0)
                .reboundRate(BigDecimal.ZERO)
                .avgReboundIncrease(BigDecimal.ZERO)
                .build();
    }

    /**
     * 创建空的涨跌停对比响应对象
     */
    private LimitBoardComparisonResponse createEmptyLimitBoardComparisonResponse(LocalDate date) {
        return LimitBoardComparisonResponse.builder()
                .tradeDate(date)
                .limitUpCount(0)
                .limitDownCount(0)
                .limitUpTotalFunds(BigDecimal.ZERO)
                .limitDownTotalFunds(BigDecimal.ZERO)
                .limitUpOneWordRate(BigDecimal.ZERO)
                .limitDownOneWordRate(BigDecimal.ZERO)
                .limitUpContinuousRate(BigDecimal.ZERO)
                .limitDownContinuousRate(BigDecimal.ZERO)
                .limitUpDownRatio(BigDecimal.ZERO)
                .fundFlowRatio(BigDecimal.ZERO)
                .build();
    }
}