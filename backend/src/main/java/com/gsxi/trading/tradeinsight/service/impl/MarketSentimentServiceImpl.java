package com.gsxi.trading.tradeinsight.service.impl;

import com.gsxi.trading.tradeinsight.dto.internal.PercentileDataDTO;
import com.gsxi.trading.tradeinsight.dto.internal.SentimentIndicatorDTO;
import com.gsxi.trading.tradeinsight.dto.internal.SentimentTrendDTO;
import com.gsxi.trading.tradeinsight.dto.response.PercentileAnalysisResponse;
import com.gsxi.trading.tradeinsight.dto.response.SentimentIndicatorResponse;
import com.gsxi.trading.tradeinsight.dto.response.SentimentTrendResponse;
import com.gsxi.trading.tradeinsight.exception.BizException;
import com.gsxi.trading.tradeinsight.dolphindb.StockLimitPoolDolphinDBRepository;
import com.gsxi.trading.tradeinsight.service.LimitBoardStatisticsService;
import com.gsxi.trading.tradeinsight.service.MarketSentimentService;
import com.gsxi.trading.tradeinsight.util.cache.LimitBoardCacheUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/1/1
 * @description 市场情绪分析服务实现类
 * 实现市场情绪指标计算，实现历史对比分析功能，添加异常检测和预警机制
 */
@Slf4j
@Service
public class MarketSentimentServiceImpl implements MarketSentimentService {

    @Autowired
    private StockLimitPoolDolphinDBRepository stockLimitPoolDolphinDBRepository;

    @Autowired
    private LimitBoardCacheUtil cacheUtil;

    @Autowired
    private LimitBoardStatisticsService statisticsService;

    /**
     * 情绪评分权重配置
     */
    private static final BigDecimal RATIO_WEIGHT = new BigDecimal("0.30");      // 涨跌停比权重30%
    private static final BigDecimal CONTINUOUS_WEIGHT = new BigDecimal("0.25"); // 连板率权重25%
    private static final BigDecimal BLAST_WEIGHT = new BigDecimal("0.20");      // 炸板率权重20%
    private static final BigDecimal EARLY_WEIGHT = new BigDecimal("0.15");      // 早盘涨停率权重15%
    private static final BigDecimal FUND_WEIGHT = new BigDecimal("0.10");       // 资金强度权重10%

    /**
     * 异常检测阈值
     */
    private static final BigDecimal EXTREME_RATIO_HIGH = new BigDecimal("5.0");  // 涨跌停比极高阈值
    private static final BigDecimal EXTREME_RATIO_LOW = new BigDecimal("0.2");   // 涨跌停比极低阈值
    private static final BigDecimal HIGH_BLAST_RATE = new BigDecimal("50.0");    // 高炸板率阈值
    private static final BigDecimal LOW_EARLY_RATE = new BigDecimal("20.0");     // 低早盘涨停率阈值

    /**
     * 历史对比默认天数
     */
    private static final int DEFAULT_HISTORY_DAYS = 60;
    private static final int MAX_HISTORY_DAYS = 365;
    private static final int MIN_HISTORY_DAYS = 10;

//==================== 市场情绪指标计算 ====================

    @Override
    public SentimentIndicatorResponse getSentimentIndicator(LocalDate date) {
        log.debug("开始查询市场情绪指标: date={}", date);

        validateSentimentParams(date, null);

        try {
            // 尝试从缓存获取
            SentimentIndicatorDTO cachedData =
                    cacheUtil.getSentimentIndicator(date, SentimentIndicatorDTO.class);
            if (cachedData != null && cachedData.isValid()) {
                log.debug("从缓存获取市场情绪指标成功: date={}", date);
                return convertToSentimentIndicatorResponse(cachedData);
            }

            // 从数据库查询
            SentimentIndicatorDTO sentimentData =
                    stockLimitPoolDolphinDBRepository.getSentimentIndicator(date);

            if (sentimentData == null || !sentimentData.isValid()) {
                log.info("指定日期无市场情绪指标数据: date={}", date);
                return createEmptySentimentIndicatorResponse(date);
            }

            // 数据转换
            SentimentIndicatorDTO convertedData = sentimentData.convertUnits();

            // 计算综合评分和等级
            BigDecimal sentimentScore = convertedData.calculateSentimentScore();
            String sentimentLevel = convertedData.getSentimentLevel();

            // 设置缓存
            cacheUtil.setSentimentIndicator(date, convertedData);

            log.debug("查询市场情绪指标成功: date={}, score={}, level={}",
                    date, sentimentScore, sentimentLevel);
            return convertToSentimentIndicatorResponse(convertedData);

        } catch (Exception e) {
            log.error("查询市场情绪指标失败: date={}, error={}", date, e.getMessage(), e);
            throw new BizException(500,"查询市场情绪指标失败: " + e.getMessage());
        }
    }

    @Override
    public SentimentTrendResponse getSentimentTrend(LocalDate startDate, LocalDate endDate) {
        log.debug("开始查询市场情绪趋势: startDate={}, endDate={}", startDate, endDate);

        statisticsService.validateDateRange(startDate, endDate);

        try {
            // 尝试从缓存获取
            List<SentimentTrendDTO> cachedData =
                    cacheUtil.getTrendAnalysis(startDate, endDate, SentimentTrendDTO.class);
            if (!CollectionUtils.isEmpty(cachedData)) {
                log.debug("从缓存获取市场情绪趋势成功: startDate={}, endDate={}", startDate, endDate);
                return convertToSentimentTrendResponse(cachedData, startDate, endDate);
            }

            // 从数据库查询
            List<SentimentTrendDTO> trendDataList =
                    stockLimitPoolDolphinDBRepository.getSentimentTrend(startDate, endDate);

            if (CollectionUtils.isEmpty(trendDataList)) {
                log.info("指定日期范围无市场情绪趋势数据: startDate={}, endDate={}", startDate, endDate);
                return createEmptySentimentTrendResponse(startDate, endDate);
            }

            // 数据转换
            List<SentimentTrendDTO> convertedDataList = trendDataList.stream()
                    .map(SentimentTrendDTO::convertUnits)
                    .filter(data -> data != null && data.isValid())
                    .collect(Collectors.toList());

            // 设置缓存
            cacheUtil.setTrendAnalysis(startDate, endDate, convertedDataList);

            log.debug("查询市场情绪趋势成功: startDate={}, endDate={}, count={}",
                    startDate, endDate, convertedDataList.size());
            return convertToSentimentTrendResponse(convertedDataList, startDate, endDate);

        } catch (Exception e) {
            log.error("查询市场情绪趋势失败: startDate={}, endDate={}, error={}",
                    startDate, endDate, e.getMessage(), e);
            throw new BizException(500,"查询市场情绪趋势失败: " + e.getMessage());
        }
    }

    @Override
    public Double calculateSentimentScore(LocalDate date) {
        try {
            SentimentIndicatorResponse indicator = getSentimentIndicator(date);
            if (indicator == null) {
                return 0.0;
            }

            // 计算各项指标得分
            double ratioScore = calculateRatioScore(indicator.getLimitUpDownRatio());
            double continuousScore = calculateContinuousScore(indicator.getContinuousLimitRate());
            double blastScore = calculateBlastScore(indicator.getBlastRate());
            double earlyScore = calculateEarlyScore(indicator.getEarlyLimitUpRate());
            double fundScore = calculateFundScore(indicator.getAvgSealFunds());

            // 加权计算综合得分
            double totalScore = ratioScore * RATIO_WEIGHT.doubleValue() +
                    continuousScore * CONTINUOUS_WEIGHT.doubleValue() +
                    blastScore * BLAST_WEIGHT.doubleValue() +
                    earlyScore * EARLY_WEIGHT.doubleValue() +
                    fundScore * FUND_WEIGHT.doubleValue();

            return Math.round(totalScore * 100.0) / 100.0;

        } catch (Exception e) {
            log.error("计算情绪评分失败: date={}, error={}", date, e.getMessage(), e);
            return 0.0;
        }
    }

    @Override
    public String getSentimentLevel(LocalDate date) {
        try {
            Double score = calculateSentimentScore(date);

            if (score >= 80.0) {
                return "极度乐观";
            } else if (score >= 60.0) {
                return "乐观";
            } else if (score >= 40.0) {
                return "中性";
            } else if (score >= 20.0) {
                return "悲观";
            } else {
                return "极度悲观";
            }

        } catch (Exception e) {
            log.error("获取情绪等级失败: date={}, error={}", date, e.getMessage(), e);
            return "未知";
        }
    }
    // ==================== 历史对比分析功能 ====================

    @Override
    public PercentileAnalysisResponse getHistoricalComparison(LocalDate targetDate, int days) {
        return getPercentileAnalysis(targetDate, days);
    }

    @Override
    public PercentileAnalysisResponse getPercentileAnalysis(LocalDate targetDate, int days) {
        log.debug("开始查询分位数分析: targetDate={}, days={}", targetDate, days);

        validateSentimentParams(targetDate, days);

        try {
            // 从数据库查询
            PercentileDataDTO percentileData =
                    stockLimitPoolDolphinDBRepository.getPercentileData(targetDate, days);

            if (percentileData == null || !percentileData.isValid()) {
                log.info("指定日期和天数无分位数分析数据: targetDate={}, days={}", targetDate, days);
                return createEmptyPercentileAnalysisResponse(targetDate, days);
            }

            // 数据转换
            PercentileDataDTO convertedData = percentileData.convertUnits();

            log.debug("查询分位数分析成功: targetDate={}, days={}", targetDate, days);
            return convertToPercentileAnalysisResponse(convertedData);

        } catch (Exception e) {
            log.error("查询分位数分析失败: targetDate={}, days={}, error={}",
                    targetDate, days, e.getMessage(), e);
            throw new BizException("查询分位数分析失败: " + e.getMessage());
        }
    }

    @Override
    public Integer getHistoricalRank(LocalDate targetDate, int days, String indicator) {
        try {
            PercentileAnalysisResponse analysis = getPercentileAnalysis(targetDate, days);
            if (analysis == null) {
                return null;
            }

            BigDecimal percentile = getIndicatorPercentile(analysis, indicator);
            if (percentile == null) {
                return null;
            }

            // 将分位数转换为排名（分位数越高，排名越靠前）
            int rank = (int) Math.ceil((100.0 - percentile.doubleValue()) * days / 100.0);
            return Math.max(1, Math.min(rank, days));

        } catch (Exception e) {
            log.error("获取历史排名失败: targetDate={}, days={}, indicator={}, error={}",
                    targetDate, days, indicator, e.getMessage(), e);
            return null;
        }
    }

    @Override
    public String getExtremeValueDescription(LocalDate targetDate, int days) {
        try {
            PercentileAnalysisResponse analysis = getPercentileAnalysis(targetDate, days);
            if (analysis == null) {
                return "无数据";
            }

            // 检查涨停股数量分位数
            BigDecimal limitUpPercentile = analysis.getLimitUpCountPercentile();
            if (limitUpPercentile != null) {
                if (limitUpPercentile.compareTo(new BigDecimal("95")) >= 0) {
                    return "涨停股数量处于历史高位";
                } else if (limitUpPercentile.compareTo(new BigDecimal("5")) <= 0) {
                    return "涨停股数量处于历史低位";
                }
            }

            // 检查涨跌停比分位数
            BigDecimal ratioPercentile = analysis.getLimitUpDownRatioPercentile();
            if (ratioPercentile != null) {
                if (ratioPercentile.compareTo(new BigDecimal("95")) >= 0) {
                    return "涨跌停比处于历史高位";
                } else if (ratioPercentile.compareTo(new BigDecimal("5")) <= 0) {
                    return "涨跌停比处于历史低位";
                }
            }

            return "各项指标处于正常范围";

        } catch (Exception e) {
            log.error("获取极值描述失败: targetDate={}, days={}, error={}",
                    targetDate, days, e.getMessage(), e);
            return "分析失败";
        }
    }
    // ==================== 异常检测和预警机制 ====================

    @Override
    public List<String> detectMarketAnomalies(LocalDate date) {
        log.debug("开始检测市场异常: date={}", date);

        List<String> anomalies = new ArrayList<>();

        try {
            SentimentIndicatorResponse indicator = getSentimentIndicator(date);
            if (indicator == null) {
                anomalies.add("无法获取市场数据");
                return anomalies;
            }

            // 检测涨跌停比异常
            if (indicator.getLimitUpDownRatio() != null) {
                if (indicator.getLimitUpDownRatio().compareTo(EXTREME_RATIO_HIGH) >= 0) {
                    anomalies.add("涨跌停比异常偏高：" + indicator.getLimitUpDownRatio());
                } else if (indicator.getLimitUpDownRatio().compareTo(EXTREME_RATIO_LOW) <= 0) {
                    anomalies.add("涨跌停比异常偏低：" + indicator.getLimitUpDownRatio());
                }
            }

            // 检测炸板率异常
            if (indicator.getBlastRate() != null &&
                    indicator.getBlastRate().compareTo(HIGH_BLAST_RATE) >= 0) {
                anomalies.add("炸板率异常偏高：" + indicator.getBlastRate() + "%");
            }

            // 检测早盘涨停率异常
            if (indicator.getEarlyLimitUpRate() != null &&
                    indicator.getEarlyLimitUpRate().compareTo(LOW_EARLY_RATE) <= 0) {
                anomalies.add("早盘涨停率异常偏低：" + indicator.getEarlyLimitUpRate() + "%");
            }

            // 检测资金异常
            if (indicator.getTotalSealFunds() != null &&
                    indicator.getTotalSealFunds().compareTo(BigDecimal.ZERO) == 0) {
                anomalies.add("总封单资金为零，市场可能异常");
            }

            log.debug("市场异常检测完成: date={}, anomalies={}", date, anomalies.size());
            return anomalies;

        } catch (Exception e) {
            log.error("检测市场异常失败: date={}, error={}", date, e.getMessage(), e);
            anomalies.add("异常检测失败：" + e.getMessage());
            return anomalies;
        }
    }

    @Override
    public List<String> generateMarketWarnings(LocalDate date) {
        log.debug("开始生成市场预警: date={}", date);

        List<String> warnings = new ArrayList<>();

        try {
            // 获取当前情绪指标
            SentimentIndicatorResponse indicator = getSentimentIndicator(date);
            if (indicator == null) {
                warnings.add("无法获取市场数据，请谨慎操作");
                return warnings;
            }

            // 获取情绪等级
            String sentimentLevel = getSentimentLevel(date);

            // 根据情绪等级生成预警
            switch (sentimentLevel) {
                case "极度乐观":
                    warnings.add("市场情绪极度乐观，注意高位风险");
                    warnings.add("建议关注炸板率和资金分化情况");
                    break;
                case "极度悲观":
                    warnings.add("市场情绪极度悲观，可能存在超跌机会");
                    warnings.add("建议关注跌停板反弹和低估值机会");
                    break;
                case "乐观":
                    warnings.add("市场情绪乐观，注意追高风险");
                    break;
                case "悲观":
                    warnings.add("市场情绪悲观，注意止损风险");
                    break;
            }

            // 检测异常情况并生成预警
            List<String> anomalies = detectMarketAnomalies(date);
            if (!anomalies.isEmpty()) {
                warnings.add("检测到市场异常，建议谨慎操作");
                warnings.addAll(anomalies);
            }

            // 历史对比预警
            try {
                String extremeDesc = getExtremeValueDescription(date, DEFAULT_HISTORY_DAYS);
                if (!"各项指标处于正常范围".equals(extremeDesc)) {
                    warnings.add("历史对比：" + extremeDesc);
                }
            } catch (Exception e) {
                log.warn("历史对比预警生成失败: {}", e.getMessage());
            }

            log.debug("市场预警生成完成: date={}, warnings={}", date, warnings.size());
            return warnings;

        } catch (Exception e) {
            log.error("生成市场预警失败: date={}, error={}", date, e.getMessage(), e);
            warnings.add("预警生成失败：" + e.getMessage());
            return warnings;
        }
    }

    @Override
    public String detectSentimentExtreme(LocalDate date) {
        try {
            Double score = calculateSentimentScore(date);

            if (score >= 90.0) {
                return "情绪极度亢奋";
            } else if (score >= 80.0) {
                return "情绪高度乐观";
            } else if (score <= 10.0) {
                return "情绪极度低迷";
            } else if (score <= 20.0) {
                return "情绪高度悲观";
            } else {
                return "情绪正常范围";
            }

        } catch (Exception e) {
            log.error("检测情绪极值失败: date={}, error={}", date, e.getMessage(), e);
            return "检测失败";
        }
    }

    @Override
    public Integer calculateMarketRiskLevel(LocalDate date) {
        try {
            SentimentIndicatorResponse indicator = getSentimentIndicator(date);
            if (indicator == null) {
                return 3; // 默认中等风险
            }

            int riskScore = 0;

            // 涨跌停比风险评估
            if (indicator.getLimitUpDownRatio() != null) {
                if (indicator.getLimitUpDownRatio().compareTo(new BigDecimal("5")) >= 0) {
                    riskScore += 2; // 极高涨跌停比，高风险
                } else if (indicator.getLimitUpDownRatio().compareTo(new BigDecimal("0.2")) <= 0) {
                    riskScore += 2; // 极低涨跌停比，高风险
                } else if (indicator.getLimitUpDownRatio().compareTo(new BigDecimal("3")) >= 0 ||
                        indicator.getLimitUpDownRatio().compareTo(new BigDecimal("0.33")) <= 0) {
                    riskScore += 1; // 较高或较低涨跌停比，中等风险
                }
            }

            // 炸板率风险评估
            if (indicator.getBlastRate() != null) {
                if (indicator.getBlastRate().compareTo(new BigDecimal("60")) >= 0) {
                    riskScore += 2; // 高炸板率，高风险
                } else if (indicator.getBlastRate().compareTo(new BigDecimal("40")) >= 0) {
                    riskScore += 1; // 中等炸板率，中等风险
                }
            }

            // 连板率风险评估
            if (indicator.getContinuousLimitRate() != null) {
                if (indicator.getContinuousLimitRate().compareTo(new BigDecimal("10")) <= 0) {
                    riskScore += 1; // 低连板率，增加风险
                }
            }

            // 将风险评分转换为1-5级
            if (riskScore >= 4) {
                return 5; // 极高风险
            } else if (riskScore >= 3) {
                return 4; // 高风险
            } else if (riskScore >= 2) {
                return 3; // 中等风险
            } else if (riskScore >= 1) {
                return 2; // 低风险
            } else {
                return 1; // 极低风险
            }

        } catch (Exception e) {
            log.error("计算市场风险等级失败: date={}, error={}", date, e.getMessage(), e);
            return 3; // 默认中等风险
        }
    }

    // ==================== 趋势分析和预测 ====================

    @Override
    public String analyzeSentimentTrend(LocalDate endDate, int days) {
        try {
            LocalDate startDate = endDate.minusDays(days - 1);
            SentimentTrendResponse trend = getSentimentTrend(startDate, endDate);

            if (trend == null || CollectionUtils.isEmpty(trend.getTrendData())) {
                return "数据不足";
            }

            List<SentimentTrendResponse.SentimentTrendData> trendData = trend.getTrendData();
            if (trendData.size() < 3) {
                return "数据不足";
            }

            // 计算情绪评分趋势
            List<Double> scores = trendData.stream()
                    .map(data -> {
                        // 简化的情绪评分计算
                        double ratioScore = data.getLimitUpDownRatio() != null ?
                                Math.min(data.getLimitUpDownRatio().doubleValue() * 20, 100) : 50;
                        return ratioScore;
                    })
                    .collect(Collectors.toList());

            // 分析趋势
            int upCount = 0;
            int downCount = 0;

            for (int i = 1; i < scores.size(); i++) {
                if (scores.get(i) > scores.get(i - 1)) {
                    upCount++;
                } else if (scores.get(i) < scores.get(i - 1)) {
                    downCount++;
                }
            }

            double upRatio = (double) upCount / (scores.size() - 1);
            double downRatio = (double) downCount / (scores.size() - 1);

            if (upRatio >= 0.7) {
                return "强上升趋势";
            } else if (upRatio >= 0.6) {
                return "上升趋势";
            } else if (downRatio >= 0.7) {
                return "强下降趋势";
            } else if (downRatio >= 0.6) {
                return "下降趋势";
            } else {
                return "震荡趋势";
            }

        } catch (Exception e) {
            log.error("分析情绪趋势失败: endDate={}, days={}, error={}",
                    endDate, days, e.getMessage(), e);
            return "分析失败";
        }
    }

    @Override
    public Double calculateSentimentMomentum(LocalDate date, int period) {
        try {
            LocalDate startDate = date.minusDays(period);
            SentimentTrendResponse trend = getSentimentTrend(startDate, date);

            if (trend == null || CollectionUtils.isEmpty(trend.getTrendData())) {
                return 0.0;
            }

            List<SentimentTrendResponse.SentimentTrendData> trendData = trend.getTrendData();
            if (trendData.size() < 2) {
                return 0.0;
            }

            // 计算首尾情绪评分
            SentimentTrendResponse.SentimentTrendData firstData = trendData.get(0);
            SentimentTrendResponse.SentimentTrendData lastData = trendData.get(trendData.size() - 1);

            double firstScore = calculateSimpleSentimentScore(firstData);
            double lastScore = calculateSimpleSentimentScore(lastData);

            // 计算动量（变化率）
            double momentum = (lastScore - firstScore) / firstScore * 100;

            return Math.round(momentum * 100.0) / 100.0;

        } catch (Exception e) {
            log.error("计算情绪动量失败: date={}, period={}, error={}",
                    date, period, e.getMessage(), e);
            return 0.0;
        }
    }

    @Override
    public String predictShortTermSentiment(LocalDate date) {
        try {
            // 获取当前情绪指标
            SentimentIndicatorResponse currentIndicator = getSentimentIndicator(date);
            if (currentIndicator == null) {
                return "数据不足";
            }

            // 分析近期趋势
            String recentTrend = analyzeSentimentTrend(date, 5);

            // 计算情绪动量
            Double momentum = calculateSentimentMomentum(date, 3);

            // 获取当前情绪等级
            String currentLevel = getSentimentLevel(date);

            // 综合判断
            if ("极度乐观".equals(currentLevel) && momentum > 10) {
                return "看跌"; // 极度乐观且动量向上，可能反转
            } else if ("极度悲观".equals(currentLevel) && momentum < -10) {
                return "看涨"; // 极度悲观且动量向下，可能反转
            } else if (recentTrend.contains("上升") && momentum > 5) {
                return "看涨";
            } else if (recentTrend.contains("下降") && momentum < -5) {
                return "看跌";
            } else {
                return "中性";
            }

        } catch (Exception e) {
            log.error("预测短期情绪失败: date={}, error={}", date, e.getMessage(), e);
            return "预测失败";
        }
    }

    // ==================== 缓存和数据管理 ====================

    @Override
    public boolean refreshSentimentCache(LocalDate date) {
        log.debug("开始刷新情绪分析缓存: date={}", date);

        try {
            // 清除现有缓存
            cacheUtil.clearDateRelatedCache(date);

            // 重新查询并缓存情绪指标
            getSentimentIndicator(date);

            log.debug("刷新情绪分析缓存成功: date={}", date);
            return true;

        } catch (Exception e) {
            log.error("刷新情绪分析缓存失败: date={}, error={}", date, e.getMessage(), e);
            return false;
        }
    }

    @Override
    public long clearSentimentCache(LocalDate date) {
        log.debug("开始清除情绪分析缓存: date={}", date);

        try {
            long clearedCount = cacheUtil.clearDateRelatedCache(date);
            log.debug("清除情绪分析缓存成功: date={}, clearedCount={}", date, clearedCount);
            return clearedCount;
        } catch (Exception e) {
            log.error("清除情绪分析缓存失败: date={}, error={}", date, e.getMessage(), e);
            return 0;
        }
    }

    @Override
    public int warmupSentimentCache(LocalDate startDate, LocalDate endDate) {
        log.debug("开始预热情绪分析缓存: startDate={}, endDate={}", startDate, endDate);

        int successCount = 0;

        try {
            statisticsService.validateDateRange(startDate, endDate);

            LocalDate currentDate = startDate;
            while (!currentDate.isAfter(endDate)) {
                try {
                    getSentimentIndicator(currentDate);
                    successCount++;
                } catch (Exception e) {
                    log.warn("预热缓存失败: date={}, error={}", currentDate, e.getMessage());
                }
                currentDate = currentDate.plusDays(1);
            }

            log.debug("预热情绪分析缓存完成: startDate={}, endDate={}, successCount={}",
                    startDate, endDate, successCount);
            return successCount;

        } catch (Exception e) {
            log.error("预热情绪分析缓存失败: startDate={}, endDate={}, error={}",
                    startDate, endDate, e.getMessage(), e);
            return successCount;
        }
    }

    // ==================== 数据验证和配置 ====================

    @Override
    public void validateSentimentParams(LocalDate date, Integer days) {
        statisticsService.validateQueryDate(date);

        if (days != null) {
            if (days < MIN_HISTORY_DAYS) {
                throw new IllegalArgumentException("历史天数不能少于" + MIN_HISTORY_DAYS + "天");
            }
            if (days > MAX_HISTORY_DAYS) {
                throw new IllegalArgumentException("历史天数不能超过" + MAX_HISTORY_DAYS + "天");
            }
        }
    }

    @Override
    public String checkDataIntegrity(LocalDate date) {
        try {
            StringBuilder report = new StringBuilder();

            // 检查基础数据
            boolean hasData = statisticsService.hasDataForDate(date);
            report.append("基础数据: ").append(hasData ? "正常" : "缺失").append("\n");

            if (hasData) {
                // 检查涨停数据
                boolean hasLimitUp = statisticsService.hasDataForDateAndType(date, "LIMIT_UP");
                report.append("涨停数据: ").append(hasLimitUp ? "正常" : "缺失").append("\n");

                // 检查跌停数据
                boolean hasLimitDown = statisticsService.hasDataForDateAndType(date, "LIMIT_DOWN");
                report.append("跌停数据: ").append(hasLimitDown ? "正常" : "缺失").append("\n");

                // 检查情绪指标
                try {
                    SentimentIndicatorResponse indicator = getSentimentIndicator(date);
                    report.append("情绪指标: ").append(indicator != null ? "正常" : "异常").append("\n");
                } catch (Exception e) {
                    report.append("情绪指标: 计算失败 - ").append(e.getMessage()).append("\n");
                }
            }

            return report.toString();

        } catch (Exception e) {
            log.error("检查数据完整性失败: date={}, error={}", date, e.getMessage(), e);
            return "检查失败: " + e.getMessage();
        }
    }

    @Override
    public String getSentimentAnalysisConfig() {
        StringBuilder config = new StringBuilder();
        config.append("市场情绪分析配置:\n");
        config.append("- 涨跌停比权重: ").append(RATIO_WEIGHT).append("\n");
        config.append("- 连板率权重: ").append(CONTINUOUS_WEIGHT).append("\n");
        config.append("- 炸板率权重: ").append(BLAST_WEIGHT).append("\n");
        config.append("- 早盘涨停率权重: ").append(EARLY_WEIGHT).append("\n");
        config.append("- 资金强度权重: ").append(FUND_WEIGHT).append("\n");
        config.append("- 默认历史对比天数: ").append(DEFAULT_HISTORY_DAYS).append("\n");
        config.append("- 最大历史对比天数: ").append(MAX_HISTORY_DAYS).append("\n");
        config.append("- 最小历史对比天数: ").append(MIN_HISTORY_DAYS).append("\n");
        return config.toString();
    }
    // ==================== 私有辅助方法 ====================

    /**
     * 计算涨跌停比评分
     */
    private double calculateRatioScore(BigDecimal ratio) {
        if (ratio == null) {
            return 0.0;
        }

        double ratioValue = ratio.doubleValue();
        if (ratioValue >= 3.0) {
            return 100.0;
        } else if (ratioValue >= 1.0) {
            return ratioValue * 33.33;
        } else {
            return ratioValue * 50.0;
        }
    }

    /**
     * 计算连板率评分
     */
    private double calculateContinuousScore(BigDecimal continuousRate) {
        if (continuousRate == null) {
            return 0.0;
        }

        // 连板率转换为0-100分
        return Math.min(continuousRate.doubleValue() * 2, 100.0);
    }

    /**
     * 计算炸板率评分（炸板率越低分数越高）
     */
    private double calculateBlastScore(BigDecimal blastRate) {
        if (blastRate == null) {
            return 100.0;
        }

        // 炸板率越低越好，满分100减去炸板率的2倍
        return Math.max(100.0 - blastRate.doubleValue() * 2, 0.0);
    }

    /**
     * 计算早盘涨停率评分
     */
    private double calculateEarlyScore(BigDecimal earlyRate) {
        if (earlyRate == null) {
            return 0.0;
        }

        // 早盘涨停率转换为0-100分
        return Math.min(earlyRate.doubleValue() * 2, 100.0);
    }

    /**
     * 计算资金强度评分
     */
    private double calculateFundScore(BigDecimal avgSealFunds) {
        if (avgSealFunds == null) {
            return 0.0;
        }

        double fundValue = avgSealFunds.doubleValue();
        if (fundValue >= 5000.0) {
            return 100.0;
        } else if (fundValue >= 1000.0) {
            return fundValue / 50.0;
        } else {
            return fundValue / 20.0;
        }
    }

    /**
     * 简化的情绪评分计算
     */
    private double calculateSimpleSentimentScore(SentimentTrendResponse.SentimentTrendData data) {
        if (data == null) {
            return 50.0;
        }

        double score = 50.0; // 基础分数

        // 涨跌停比影响
        if (data.getLimitUpDownRatio() != null) {
            double ratio = data.getLimitUpDownRatio().doubleValue();
            if (ratio > 1.0) {
                score += Math.min((ratio - 1.0) * 20, 30);
            } else {
                score -= Math.min((1.0 - ratio) * 30, 40);
            }
        }

        // 连板率影响
        if (data.getContinuousLimitRate() != null) {
            score += Math.min(data.getContinuousLimitRate().doubleValue() * 0.5, 10);
        }

        return Math.max(0.0, Math.min(100.0, score));
    }

    /**
     * 获取指标分位数
     */
    private BigDecimal getIndicatorPercentile(PercentileAnalysisResponse analysis, String indicator) {
        switch (indicator.toLowerCase()) {
            case "limitupcount":
                return analysis.getLimitUpCountPercentile();
            case "limitdowncount":
                return analysis.getLimitDownCountPercentile();
            case "ratio":
            case "limitupdownratio":
                return analysis.getLimitUpDownRatioPercentile();
            case "totalfunds":
            case "totalsealfunds":
                return BigDecimal.ZERO; // TODO: 需要添加总资金分位数字段
            default:
                return null;
        }
    }

    /**
     * 转换情绪指标DTO为响应对象
     */
    private SentimentIndicatorResponse convertToSentimentIndicatorResponse(SentimentIndicatorDTO dto) {
        if (dto == null) {
            return null;
        }

        BigDecimal sentimentScore = dto.calculateSentimentScore();
        String sentimentLevel = dto.getSentimentLevel();

        return SentimentIndicatorResponse.builder()
                .tradeDate(dto.getTradeDate())
                .limitUpDownRatio(dto.getLimitUpDownRatio())
                .continuousLimitRate(dto.getContinuousLimitRate())
                .blastRate(dto.getBlastRate())
                .totalSealFunds(dto.getTotalSealFunds())
                .avgSealFunds(dto.getAvgSealFunds())
                .earlyLimitUpRate(dto.getEarlyLimitRate())
                .lateLimitUpRate(dto.getLateLimitRate())
                .sentimentScore(sentimentScore)
                .sentimentLevel(sentimentLevel)
                .build();
    }

    /**
     * 转换情绪趋势DTO列表为响应对象
     */
    private SentimentTrendResponse convertToSentimentTrendResponse(
            List<SentimentTrendDTO> dtoList, LocalDate startDate, LocalDate endDate) {

        List<SentimentTrendResponse.SentimentTrendData> trendDataList = dtoList.stream()
                .map(dto -> {
                    BigDecimal sentimentScore = dto.calculateSentimentScore();
                    String sentimentLevel = dto.getSentimentLevel();

                    return SentimentTrendResponse.SentimentTrendData.builder()
                            .tradeDate(dto.getTradeDate())
                            .limitUpDownRatio(dto.getLimitUpDownRatio())
                            .continuousLimitRate(dto.getContinuousLimitRate())
                            .sentimentScore(sentimentScore)
                            .sentimentLevel(sentimentLevel)
                            .build();
                })
                .collect(Collectors.toList());

        return SentimentTrendResponse.builder()
                .startDate(startDate)
                .endDate(endDate)
                .trendData(trendDataList)
                .build();
    }

    /**
     * 转换分位数DTO为响应对象
     */
    private PercentileAnalysisResponse convertToPercentileAnalysisResponse(PercentileDataDTO dto) {
        if (dto == null) {
            return null;
        }

        return PercentileAnalysisResponse.builder()
                .targetDate(dto.getTargetDate())
                .days(dto.getTotalDays() != null ? dto.getTotalDays().intValue() : 0)
                .currentLimitUpCount(dto.getTargetLimitUpCount() != null ? dto.getTargetLimitUpCount().intValue() : 0)
                .currentLimitDownCount(dto.getTargetLimitDownCount() != null ? dto.getTargetLimitDownCount().intValue() : 0)
                .currentLimitUpDownRatio(dto.getTargetLimitUpDownRatio())
                .limitUpCountPercentile(dto.calculateLimitUpCountPercentile())
                .limitDownCountPercentile(dto.calculateLimitDownCountPercentile())
                .limitUpDownRatioPercentile(dto.calculateRatioPercentile())
                .build();
    }

    /**
     * 创建空的情绪指标响应对象
     */
    private SentimentIndicatorResponse createEmptySentimentIndicatorResponse(LocalDate date) {
        return SentimentIndicatorResponse.builder()
                .tradeDate(date)
                .limitUpDownRatio(BigDecimal.ZERO)
                .continuousLimitRate(BigDecimal.ZERO)
                .blastRate(BigDecimal.ZERO)
                .totalSealFunds(BigDecimal.ZERO)
                .avgSealFunds(BigDecimal.ZERO)
                .earlyLimitUpRate(BigDecimal.ZERO)
                .lateLimitUpRate(BigDecimal.ZERO)
                .sentimentScore(BigDecimal.ZERO)
                .sentimentLevel("无数据")
                .build();
    }

    /**
     * 创建空的情绪趋势响应对象
     */
    private SentimentTrendResponse createEmptySentimentTrendResponse(LocalDate startDate, LocalDate endDate) {
        return SentimentTrendResponse.builder()
                .startDate(startDate)
                .endDate(endDate)
                .trendData(new ArrayList<>())
                .build();
    }

    /**
     * 创建空的分位数分析响应对象
     */
    private PercentileAnalysisResponse createEmptyPercentileAnalysisResponse(LocalDate targetDate, int days) {
        return PercentileAnalysisResponse.builder()
                .targetDate(targetDate)
                .days(days)
                .currentLimitUpCount(0)
                .currentLimitDownCount(0)
                .currentLimitUpDownRatio(BigDecimal.ZERO)
                .limitUpCountPercentile(BigDecimal.ZERO)
                .limitDownCountPercentile(BigDecimal.ZERO)
                .limitUpDownRatioPercentile(BigDecimal.ZERO)
                .build();
    }
}