package com.gsxi.trading.tradeinsight.util.cache;

import com.gsxi.trading.tradeinsight.common.enums.LimitBoardCacheConstant;
import com.gsxi.trading.tradeinsight.util.CacheExpireTimeUtil;
import com.gsxi.trading.tradeinsight.util.StockTimeUtil;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/1/1
 * @description 涨跌停板统计分析缓存策略类
 * 提供智能的缓存过期时间计算和缓存键管理策略
 */
public class LimitBoardCacheStrategy {

    /**
     * 日期格式化器
     */
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * 当前交易日判断的时间分界点（小时）
     */
    private static final int TRADING_DAY_CUTOFF_HOUR = 15;

    // ==================== 缓存过期时间策略 ====================

    /**
     * 获取基础统计数据的缓存过期时间
     * 
     * @param date 查询日期
     * @return 过期时间（秒）
     */
    public static long getBasicStatisticsExpireTime(LocalDate date) {
        if (isCurrentTradingDay(date)) {
            // 当日数据使用实时缓存策略
            return CacheExpireTimeUtil.calculateExpireTime(
                    LimitBoardCacheConstant.REALTIME_EXPIRE_SECONDS, 
                    TimeUnit.SECONDS
            );
        } else {
            // 历史数据使用长期缓存
            return LimitBoardCacheConstant.HISTORICAL_EXPIRE_SECONDS;
        }
    }

    /**
     * 获取涨跌停板详细统计的缓存过期时间
     * 
     * @param date 查询日期
     * @return 过期时间（秒）
     */
    public static long getBoardStatisticsExpireTime(LocalDate date) {
        if (isCurrentTradingDay(date)) {
            // 当日数据使用汇总缓存策略
            return CacheExpireTimeUtil.calculateExpireTime(
                    LimitBoardCacheConstant.DAILY_SUMMARY_EXPIRE_SECONDS, 
                    TimeUnit.SECONDS
            );
        } else {
            // 历史数据使用长期缓存
            return LimitBoardCacheConstant.HISTORICAL_EXPIRE_SECONDS;
        }
    }

    /**
     * 获取连板分析数据的缓存过期时间
     * 
     * @param date 查询日期
     * @return 过期时间（秒）
     */
    public static long getContinuousAnalysisExpireTime(LocalDate date) {
        if (isCurrentTradingDay(date)) {
            // 当日数据使用汇总缓存策略
            return CacheExpireTimeUtil.calculateExpireTime(
                    LimitBoardCacheConstant.DAILY_SUMMARY_EXPIRE_SECONDS, 
                    TimeUnit.SECONDS
            );
        } else {
            // 历史数据使用长期缓存
            return LimitBoardCacheConstant.LONG_TERM_EXPIRE_SECONDS;
        }
    }

    /**
     * 获取连板成功率分析的缓存过期时间
     * 
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @return 过期时间（秒）
     */
    public static long getContinuousSuccessRateExpireTime(LocalDate startDate, LocalDate endDate) {
        if (isCurrentTradingDay(endDate)) {
            // 包含当日数据的分析使用复杂计算缓存策略
            return CacheExpireTimeUtil.calculateExpireTime(
                    LimitBoardCacheConstant.COMPLEX_CALCULATION_EXPIRE_SECONDS, 
                    TimeUnit.SECONDS
            );
        } else {
            // 纯历史数据分析使用长期缓存
            return LimitBoardCacheConstant.LONG_TERM_EXPIRE_SECONDS;
        }
    }

    /**
     * 获取质量分析数据的缓存过期时间
     * 
     * @param date 查询日期
     * @return 过期时间（秒）
     */
    public static long getQualityAnalysisExpireTime(LocalDate date) {
        if (isCurrentTradingDay(date)) {
            // 当日数据使用汇总缓存策略
            return CacheExpireTimeUtil.calculateExpireTime(
                    LimitBoardCacheConstant.DAILY_SUMMARY_EXPIRE_SECONDS, 
                    TimeUnit.SECONDS
            );
        } else {
            // 历史数据使用长期缓存
            return LimitBoardCacheConstant.LONG_TERM_EXPIRE_SECONDS;
        }
    }

    /**
     * 获取跌停板反弹分析的缓存过期时间
     * 
     * @param date 查询日期
     * @return 过期时间（秒）
     */
    public static long getReboundAnalysisExpireTime(LocalDate date) {
        // 反弹分析需要次日数据，使用复杂计算缓存策略
        return LimitBoardCacheConstant.COMPLEX_CALCULATION_EXPIRE_SECONDS;
    }

    /**
     * 获取市场情绪指标的缓存过期时间
     * 
     * @param date 查询日期
     * @return 过期时间（秒）
     */
    public static long getSentimentIndicatorExpireTime(LocalDate date) {
        if (isCurrentTradingDay(date)) {
            // 当日情绪指标使用实时缓存策略
            return CacheExpireTimeUtil.calculateExpireTime(
                    LimitBoardCacheConstant.REALTIME_EXPIRE_SECONDS, 
                    TimeUnit.SECONDS
            );
        } else {
            // 历史情绪指标使用历史缓存
            return LimitBoardCacheConstant.HISTORICAL_EXPIRE_SECONDS;
        }
    }

    /**
     * 获取趋势分析数据的缓存过期时间
     * 
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @return 过期时间（秒）
     */
    public static long getTrendAnalysisExpireTime(LocalDate startDate, LocalDate endDate) {
        if (isCurrentTradingDay(endDate)) {
            // 包含当日数据的趋势分析使用趋势缓存策略
            return CacheExpireTimeUtil.calculateExpireTime(
                    LimitBoardCacheConstant.TREND_ANALYSIS_EXPIRE_SECONDS, 
                    TimeUnit.SECONDS
            );
        } else {
            // 纯历史数据趋势分析使用长期缓存
            return LimitBoardCacheConstant.LONG_TERM_EXPIRE_SECONDS;
        }
    }

    /**
     * 获取分位数分析的缓存过期时间
     * 
     * @param targetDate 目标日期
     * @param days 历史天数
     * @return 过期时间（秒）
     */
    public static long getPercentileAnalysisExpireTime(LocalDate targetDate, int days) {
        // 分位数分析是复杂计算，使用复杂计算缓存策略
        return LimitBoardCacheConstant.COMPLEX_CALCULATION_EXPIRE_SECONDS;
    }

    // ==================== 缓存键管理策略 ====================

    /**
     * 格式化日期为缓存键格式
     * 
     * @param date 日期
     * @return 格式化后的日期字符串
     */
    public static String formatDateForCache(LocalDate date) {
        return date.format(DATE_FORMATTER);
    }

    /**
     * 构建带数据类型的缓存键
     * 
     * @param baseKey 基础缓存键
     * @param dataType 数据类型（LIMIT_UP/LIMIT_DOWN）
     * @return 完整的缓存键
     */
    public static String buildKeyWithDataType(String baseKey, String dataType) {
        String cacheDataType = convertDataType(dataType);
        return baseKey + LimitBoardCacheConstant.KEY_SEPARATOR + cacheDataType;
    }

    /**
     * 构建日期范围缓存键
     * 
     * @param baseKey 基础缓存键
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @return 完整的缓存键
     */
    public static String buildDateRangeKey(String baseKey, LocalDate startDate, LocalDate endDate) {
        return baseKey + formatDateForCache(startDate) + 
               LimitBoardCacheConstant.PARAM_SEPARATOR + 
               formatDateForCache(endDate);
    }

    /**
     * 构建带参数的缓存键
     * 
     * @param baseKey 基础缓存键
     * @param params 参数数组
     * @return 完整的缓存键
     */
    public static String buildKeyWithParams(String baseKey, Object... params) {
        StringBuilder keyBuilder = new StringBuilder(baseKey);
        for (Object param : params) {
            keyBuilder.append(LimitBoardCacheConstant.PARAM_SEPARATOR).append(param);
        }
        return keyBuilder.toString();
    }

    // ==================== 缓存失效策略 ====================

    /**
     * 判断是否需要清除相关缓存
     * 当数据更新时，需要清除相关的缓存
     * 
     * @param date 数据日期
     * @return 是否需要清除缓存
     */
    public static boolean shouldClearCache(LocalDate date) {
        // 当日数据更新时需要清除缓存
        return isCurrentTradingDay(date);
    }

    /**
     * 获取需要清除的缓存键模式列表
     * 
     * @param date 数据日期
     * @return 缓存键模式列表
     */
    public static String[] getCachePatternsToClear(LocalDate date) {
        String dateStr = formatDateForCache(date);
        return new String[]{
            LimitBoardCacheConstant.BASIC_STATISTICS_PREFIX + dateStr,
            LimitBoardCacheConstant.BOARD_STATISTICS_PREFIX + dateStr + "*",
            LimitBoardCacheConstant.CONTINUOUS_DISTRIBUTION_PREFIX + dateStr + "*",
            LimitBoardCacheConstant.TIME_DISTRIBUTION_PREFIX + dateStr + "*",
            LimitBoardCacheConstant.INDUSTRY_DISTRIBUTION_PREFIX + dateStr + "*",
            LimitBoardCacheConstant.INDUSTRY_COMPARISON_PREFIX + dateStr,
            LimitBoardCacheConstant.QUALITY_ANALYSIS_PREFIX + dateStr + "*",
            LimitBoardCacheConstant.SEAL_STRENGTH_DISTRIBUTION_PREFIX + dateStr + "*",
            LimitBoardCacheConstant.PE_DISTRIBUTION_PREFIX + dateStr,
            LimitBoardCacheConstant.REBOUND_ANALYSIS_PREFIX + dateStr,
            LimitBoardCacheConstant.BOARD_COMPARISON_PREFIX + dateStr,
            LimitBoardCacheConstant.SENTIMENT_INDICATOR_PREFIX + dateStr
        };
    }

    // ==================== 辅助方法 ====================

    /**
     * 判断是否为当前交易日
     * 
     * @param date 查询日期
     * @return 是否为当前交易日
     */
    private static boolean isCurrentTradingDay(LocalDate date) {
        LocalDate today = LocalDate.now();
        
        // 如果是今天
        if (date.equals(today)) {
            return true;
        }
        
        // 如果是昨天且当前时间在交易时间之前（可能还在处理昨天的数据）
        if (date.equals(today.minusDays(1))) {
            return java.time.LocalTime.now().getHour() < TRADING_DAY_CUTOFF_HOUR;
        }
        
        return false;
    }

    /**
     * 转换数据类型为缓存标识
     * 
     * @param dataType 原始数据类型（LIMIT_UP/LIMIT_DOWN）
     * @return 缓存数据类型标识（up/down）
     */
    private static String convertDataType(String dataType) {
        if ("LIMIT_UP".equals(dataType)) {
            return LimitBoardCacheConstant.LIMIT_UP_TYPE;
        } else if ("LIMIT_DOWN".equals(dataType)) {
            return LimitBoardCacheConstant.LIMIT_DOWN_TYPE;
        } else {
            return LimitBoardCacheConstant.COMBINED_TYPE;
        }
    }

    /**
     * 判断是否为交易时间
     * 
     * @return 是否为交易时间
     */
    public static boolean isTradingTime() {
        return StockTimeUtil.isInTradingTime();
    }

    /**
     * 判断是否为盘后时间
     * 
     * @return 是否为盘后时间
     */
    public static boolean isAfterMarket() {
        return StockTimeUtil.isAfterTradingTime();
    }

    /**
     * 根据当前时间智能选择缓存策略
     * 
     * @param date 数据日期
     * @return 缓存过期时间（秒）
     */
    public static long getSmartExpireTime(LocalDate date) {
        if (isCurrentTradingDay(date)) {
            if (isTradingTime()) {
                // 交易时间内使用短期缓存
                return LimitBoardCacheConstant.REALTIME_EXPIRE_SECONDS;
            } else if (isAfterMarket()) {
                // 盘后时间使用中期缓存
                return LimitBoardCacheConstant.DAILY_SUMMARY_EXPIRE_SECONDS;
            } else {
                // 非交易时间使用长期缓存
                return LimitBoardCacheConstant.HISTORICAL_EXPIRE_SECONDS;
            }
        } else {
            // 历史数据使用长期缓存
            return LimitBoardCacheConstant.LONG_TERM_EXPIRE_SECONDS;
        }
    }
}