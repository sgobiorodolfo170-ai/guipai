package com.gsxi.trading.tradeinsight.service.impl;

import com.gsxi.trading.tradeinsight.dto.internal.BasicStatisticsDTO;
import com.gsxi.trading.tradeinsight.dto.internal.LimitBoardStatisticsDTO;
import com.gsxi.trading.tradeinsight.dto.response.BasicStatisticsResponse;
import com.gsxi.trading.tradeinsight.dto.response.LimitBoardStatisticsResponse;
import com.gsxi.trading.tradeinsight.dolphindb.StockLimitPoolDolphinDBRepository;
import com.gsxi.trading.tradeinsight.exception.BizException;
import com.gsxi.trading.tradeinsight.service.LimitBoardStatisticsService;
import com.gsxi.trading.tradeinsight.util.cache.LimitBoardCacheUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/1/1
 * @description 涨跌停板统计分析主服务实现类
 * 实现基础统计数据查询和缓存逻辑，提供统一的涨跌停板详细统计功能
 */
@Slf4j
@Service
public class LimitBoardStatisticsServiceImpl implements LimitBoardStatisticsService {

    @Autowired
    private StockLimitPoolDolphinDBRepository stockLimitPoolDolphinDBRepository;

    @Autowired
    private LimitBoardCacheUtil cacheUtil;

    /**
     * 支持的数据类型
     */
    private static final String LIMIT_UP_TYPE = "LIMIT_UP";
    private static final String LIMIT_DOWN_TYPE = "LIMIT_DOWN";

    /**
     * 最大查询天数限制
     */
    private static final int MAX_QUERY_DAYS = 365;

    // ==================== 基础统计数据查询 ====================

    @Override
    public BasicStatisticsResponse getBasicStatistics(LocalDate date) {
        log.debug("开始查询基础统计数据: date={}", date);
        
        // 参数验证
        validateQueryDate(date);
        
        try {
            // 尝试从缓存获取
            BasicStatisticsDTO cachedData = cacheUtil.getBasicStatistics(date, BasicStatisticsDTO.class);
            if (cachedData != null && cachedData.isValid()) {
                log.debug("从缓存获取基础统计数据成功: date={}", date);
                return convertToBasicStatisticsResponse(cachedData);
            }
            
            // 从数据库查询
            BasicStatisticsDTO statisticsData = stockLimitPoolDolphinDBRepository.getBasicStatistics(date);
            
            if (statisticsData == null || !statisticsData.isValid()) {
                log.info("指定日期无基础统计数据: date={}", date);
                return createEmptyBasicStatisticsResponse(date);
            }
            
            // 数据转换
            BasicStatisticsDTO convertedData = statisticsData.convertUnits();
            
            // 设置缓存
            cacheUtil.setBasicStatistics(date, convertedData);
            
            log.debug("查询基础统计数据成功: date={}", date);
            return convertToBasicStatisticsResponse(convertedData);
            
        } catch (Exception e) {
            log.error("查询基础统计数据失败: date={}, error={}", date, e.getMessage(), e);
            throw new BizException(500,"查询基础统计数据失败: " + e.getMessage());
        }
    }

    @Override
    public List<BasicStatisticsResponse> getBasicStatisticsRange(LocalDate startDate, LocalDate endDate) {
        log.debug("开始查询基础统计数据范围: startDate={}, endDate={}", startDate, endDate);
        
        // 参数验证
        validateDateRange(startDate, endDate);
        
        try {
            // 从数据库查询
            List<BasicStatisticsDTO> statisticsDataList = stockLimitPoolDolphinDBRepository.getBasicStatisticsRange(startDate, endDate);
            
            if (statisticsDataList == null || statisticsDataList.isEmpty()) {
                log.info("指定日期范围无基础统计数据: startDate={}, endDate={}", startDate, endDate);
                return new ArrayList<>();
            }
            
            // 数据转换和缓存
            List<BasicStatisticsResponse> responseList = statisticsDataList.stream()
                    .filter(data -> data != null && data.isValid())
                    .map(data -> {
                        BasicStatisticsDTO convertedData = data.convertUnits();
                        // 设置缓存
                        cacheUtil.setBasicStatistics(convertedData.getTradeDate(), convertedData);
                        return convertToBasicStatisticsResponse(convertedData);
                    })
                    .collect(Collectors.toList());
            
            log.debug("查询基础统计数据范围成功: startDate={}, endDate={}, count={}", 
                    startDate, endDate, responseList.size());
            return responseList;
            
        } catch (Exception e) {
            log.error("查询基础统计数据范围失败: startDate={}, endDate={}, error={}", 
                    startDate, endDate, e.getMessage(), e);
            throw new BizException(500,"查询基础统计数据范围失败: " + e.getMessage());
        }
    }

    // ==================== 涨跌停板详细统计 ====================

    @Override
    public LimitBoardStatisticsResponse getLimitBoardStatistics(LocalDate date, String dataType) {
        log.debug("开始查询涨跌停板详细统计: date={}, dataType={}", date, dataType);
        
        // 参数验证
        validateQueryDate(date);
        validateDataType(dataType);
        
        try {
            // 尝试从缓存获取
            LimitBoardStatisticsDTO cachedData = cacheUtil.getBoardStatistics(date, dataType, LimitBoardStatisticsDTO.class);
            if (cachedData != null && cachedData.isValid()) {
                log.debug("从缓存获取涨跌停板统计数据成功: date={}, dataType={}", date, dataType);
                return convertToLimitBoardStatisticsResponse(cachedData);
            }
            
            // 从数据库查询
            LimitBoardStatisticsDTO statisticsData = stockLimitPoolDolphinDBRepository.getLimitBoardStatistics(date, dataType);
            
            if (statisticsData == null || !statisticsData.isValid()) {
                log.info("指定日期和类型无涨跌停板统计数据: date={}, dataType={}", date, dataType);
                return createEmptyLimitBoardStatisticsResponse(date, dataType);
            }
            
            // 数据转换
            LimitBoardStatisticsDTO convertedData = statisticsData.convertUnits();
            
            // 设置缓存
            cacheUtil.setBoardStatistics(date, dataType, convertedData);
            
            log.debug("查询涨跌停板详细统计成功: date={}, dataType={}", date, dataType);
            return convertToLimitBoardStatisticsResponse(convertedData);
            
        } catch (Exception e) {
            log.error("查询涨跌停板详细统计失败: date={}, dataType={}, error={}", 
                    date, dataType, e.getMessage(), e);
            throw new BizException(500,"查询涨跌停板详细统计失败: " + e.getMessage());
        }
    }

    @Override
    public List<LimitBoardStatisticsResponse> getLimitBoardStatisticsRange(
            LocalDate startDate, LocalDate endDate, String dataType) {
        log.debug("开始查询涨跌停板详细统计范围: startDate={}, endDate={}, dataType={}", 
                startDate, endDate, dataType);
        
        // 参数验证
        validateDateRange(startDate, endDate);
        validateDataType(dataType);
        
        try {
            // 从数据库查询
            List<LimitBoardStatisticsDTO> statisticsDataList = 
                    stockLimitPoolDolphinDBRepository.getLimitBoardStatisticsRange(startDate, endDate, dataType);
            
            if (statisticsDataList == null || statisticsDataList.isEmpty()) {
                log.info("指定日期范围和类型无涨跌停板统计数据: startDate={}, endDate={}, dataType={}", 
                        startDate, endDate, dataType);
                return new ArrayList<>();
            }
            
            // 数据转换和缓存
            List<LimitBoardStatisticsResponse> responseList = statisticsDataList.stream()
                    .filter(data -> data != null && data.isValid())
                    .map(data -> {
                        LimitBoardStatisticsDTO convertedData = data.convertUnits();
                        // 设置缓存
                        cacheUtil.setBoardStatistics(convertedData.getTradeDate(), dataType, convertedData);
                        return convertToLimitBoardStatisticsResponse(convertedData);
                    })
                    .collect(Collectors.toList());
            
            log.debug("查询涨跌停板详细统计范围成功: startDate={}, endDate={}, dataType={}, count={}", 
                    startDate, endDate, dataType, responseList.size());
            return responseList;
            
        } catch (Exception e) {
            log.error("查询涨跌停板详细统计范围失败: startDate={}, endDate={}, dataType={}, error={}", 
                    startDate, endDate, dataType, e.getMessage(), e);
            throw new BizException(500,"查询涨跌停板详细统计范围失败: " + e.getMessage());
        }
    }

    // ==================== 数据验证和异常处理 ====================

    @Override
    public void validateQueryDate(LocalDate date) {
        if (date == null) {
            throw new IllegalArgumentException("查询日期不能为空");
        }
        
        LocalDate today = LocalDate.now();
        if (date.isAfter(today)) {
            throw new IllegalArgumentException("查询日期不能超过当前日期");
        }
        
        // 检查日期是否过于久远（超过10年）
        if (date.isBefore(today.minusYears(10))) {
            throw new IllegalArgumentException("查询日期不能超过10年前");
        }
    }

    @Override
    public void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("开始日期和结束日期不能为空");
        }
        
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("开始日期不能晚于结束日期");
        }
        
        // 检查查询范围是否过大
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate);
        if (daysBetween > MAX_QUERY_DAYS) {
            throw new IllegalArgumentException("查询日期范围不能超过" + MAX_QUERY_DAYS + "天");
        }
        
        // 验证单个日期
        validateQueryDate(startDate);
        validateQueryDate(endDate);
    }

    @Override
    public void validateDataType(String dataType) {
        if (!StringUtils.hasText(dataType)) {
            throw new IllegalArgumentException("数据类型不能为空");
        }
        
        if (!LIMIT_UP_TYPE.equals(dataType) && !LIMIT_DOWN_TYPE.equals(dataType)) {
            throw new IllegalArgumentException("数据类型必须为LIMIT_UP或LIMIT_DOWN");
        }
    }

    // ==================== 缓存管理 ====================

    @Override
    public boolean refreshBasicStatisticsCache(LocalDate date) {
        log.debug("开始刷新基础统计缓存: date={}", date);
        
        try {
            // 清除现有缓存
            cacheUtil.clearDateRelatedCache(date);
            
            // 重新查询并缓存
            BasicStatisticsDTO statisticsData = stockLimitPoolDolphinDBRepository.getBasicStatistics(date);
            if (statisticsData != null && statisticsData.isValid()) {
                BasicStatisticsDTO convertedData = statisticsData.convertUnits();
                cacheUtil.setBasicStatistics(date, convertedData);
                log.debug("刷新基础统计缓存成功: date={}", date);
                return true;
            }
            
            log.debug("无数据可缓存: date={}", date);
            return false;
            
        } catch (Exception e) {
            log.error("刷新基础统计缓存失败: date={}, error={}", date, e.getMessage(), e);
            return false;
        }
    }

    @Override
    public boolean refreshLimitBoardStatisticsCache(LocalDate date, String dataType) {
        log.debug("开始刷新涨跌停板统计缓存: date={}, dataType={}", date, dataType);
        
        try {
            // 重新查询并缓存
            LimitBoardStatisticsDTO statisticsData = stockLimitPoolDolphinDBRepository.getLimitBoardStatistics(date, dataType);
            if (statisticsData != null && statisticsData.isValid()) {
                LimitBoardStatisticsDTO convertedData = statisticsData.convertUnits();
                cacheUtil.setBoardStatistics(date, dataType, convertedData);
                log.debug("刷新涨跌停板统计缓存成功: date={}, dataType={}", date, dataType);
                return true;
            }
            
            log.debug("无数据可缓存: date={}, dataType={}", date, dataType);
            return false;
            
        } catch (Exception e) {
            log.error("刷新涨跌停板统计缓存失败: date={}, dataType={}, error={}", 
                    date, dataType, e.getMessage(), e);
            return false;
        }
    }

    @Override
    public long clearStatisticsCache(LocalDate date) {
        log.debug("开始清除统计缓存: date={}", date);
        
        try {
            long clearedCount = cacheUtil.clearDateRelatedCache(date);
            log.debug("清除统计缓存成功: date={}, clearedCount={}", date, clearedCount);
            return clearedCount;
        } catch (Exception e) {
            log.error("清除统计缓存失败: date={}, error={}", date, e.getMessage(), e);
            return 0;
        }
    }

    // ==================== 数据可用性检查 ====================

    @Override
    public boolean hasDataForDate(LocalDate date) {
        try {
            int upCount = stockLimitPoolDolphinDBRepository.countByTradeDateAndType(date, LIMIT_UP_TYPE);
            int downCount = stockLimitPoolDolphinDBRepository.countByTradeDateAndType(date, LIMIT_DOWN_TYPE);
            return upCount > 0 || downCount > 0;
        } catch (Exception e) {
            log.error("检查数据可用性失败: date={}, error={}", date, e.getMessage(), e);
            return false;
        }
    }

    @Override
    public boolean hasDataForDateAndType(LocalDate date, String dataType) {
        try {
            validateDataType(dataType);
            int count = stockLimitPoolDolphinDBRepository.countByTradeDateAndType(date, dataType);
            return count > 0;
        } catch (Exception e) {
            log.error("检查数据可用性失败: date={}, dataType={}, error={}", 
                    date, dataType, e.getMessage(), e);
            return false;
        }
    }

    @Override
    public LocalDate getLatestDataDate() {
        // 这里需要根据实际数据库结构实现
        // 暂时返回当前日期的前一天作为示例
        return LocalDate.now().minusDays(1);
    }

    @Override
    public LocalDate getLatestDataDate(String dataType) {
        validateDataType(dataType);
        // 这里需要根据实际数据库结构实现
        // 暂时返回当前日期的前一天作为示例
        return LocalDate.now().minusDays(1);
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 转换基础统计DTO为响应对象
     */
    private BasicStatisticsResponse convertToBasicStatisticsResponse(BasicStatisticsDTO dto) {
        if (dto == null) {
            return null;
        }
        
        return BasicStatisticsResponse.builder()
                .tradeDate(dto.getTradeDate())
                .limitUpCount(dto.getLimitUpCount())
                .limitUpOneWordCount(dto.getLimitUpOneWordCount())
                .limitUpBlastResealCount(dto.getLimitUpBlastResealCount())
                .limitUpMaxContinuous(dto.getLimitUpMaxContinuous())
                .limitUpTotalSealFunds(dto.getLimitUpTotalSealFunds())
                .limitUpAvgSealFunds(dto.getLimitUpAvgSealFunds())
                .limitDownCount(dto.getLimitDownCount())
                .limitDownOneWordCount(dto.getLimitDownOneWordCount())
                .limitDownOpenCount(dto.getLimitDownOpenCount())
                .limitDownMaxContinuous(dto.getLimitDownMaxContinuous())
                .limitDownTotalSealFunds(dto.getLimitDownTotalSealFunds())
                .limitDownAvgSealFunds(dto.getLimitDownAvgSealFunds())
                .totalMarketValue(dto.getTotalMarketValue())
                .yesterdayLimitUpAvgIncrease(dto.getYesterdayLimitUpAvgIncrease())
                .yesterdayLimitDownAvgIncrease(dto.getYesterdayLimitDownAvgIncrease())
                .limitDownContinuousRate(dto.getLimitDownContinuousRate())
                .limitUpContinuousRate(dto.getLimitUpContinuousRate())
                .limitUpDownRatio(dto.getLimitUpDownRatio())
                .build();
    }

    /**
     * 转换涨跌停板统计DTO为响应对象
     */
    private LimitBoardStatisticsResponse convertToLimitBoardStatisticsResponse(LimitBoardStatisticsDTO dto) {
        if (dto == null) {
            return null;
        }
        
        return LimitBoardStatisticsResponse.builder()
                .tradeDate(dto.getTradeDate())
                .dataType(dto.getDataType())
                .totalCount(dto.getTotalCount())
                .oneWordBoardCount(dto.getOneWordBoardCount())
                .maxContinuousLimit(dto.getMaxContinuousLimit())
                .totalSealFunds(dto.getTotalSealFunds())
                .avgSealFunds(dto.getAvgSealFunds())
                .blastAndResealCount(dto.getBlastAndResealCount())
                .openBoardCount(dto.getOpenBoardCount())
                .avgDynamicPe(dto.getAvgDynamicPe())
                .build();
    }

    /**
     * 创建空的基础统计响应对象
     */
    private BasicStatisticsResponse createEmptyBasicStatisticsResponse(LocalDate date) {
        return BasicStatisticsResponse.builder()
                .tradeDate(date)
                .limitUpCount(0)
                .limitUpOneWordCount(0)
                .limitUpBlastResealCount(0)
                .limitUpMaxContinuous(0)
                .limitUpTotalSealFunds(java.math.BigDecimal.ZERO)
                .limitUpAvgSealFunds(java.math.BigDecimal.ZERO)
                .limitDownCount(0)
                .limitDownOneWordCount(0)
                .limitDownOpenCount(0)
                .limitDownMaxContinuous(0)
                .limitDownTotalSealFunds(java.math.BigDecimal.ZERO)
                .limitDownAvgSealFunds(java.math.BigDecimal.ZERO)
                .totalMarketValue(java.math.BigDecimal.ZERO)
                .yesterdayLimitUpAvgIncrease(java.math.BigDecimal.ZERO)
                .yesterdayLimitDownAvgIncrease(java.math.BigDecimal.ZERO)
                .build();
    }

    /**
     * 创建空的涨跌停板统计响应对象
     */
    private LimitBoardStatisticsResponse createEmptyLimitBoardStatisticsResponse(LocalDate date, String dataType) {
        return LimitBoardStatisticsResponse.builder()
                .tradeDate(date)
                .dataType(dataType)
                .totalCount(0)
                .oneWordBoardCount(0)
                .maxContinuousLimit(0)
                .totalSealFunds(java.math.BigDecimal.ZERO)
                .avgSealFunds(java.math.BigDecimal.ZERO)
                .blastAndResealCount(0)
                .openBoardCount(0)
                .avgDynamicPe(java.math.BigDecimal.ZERO)
                .build();
    }
}