package com.gsxi.trading.tradeinsight.common.enums;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/1/1
 * @description 涨跌停板统计分析缓存键常量定义
 * 定义涨跌停板相关功能的所有缓存键前缀和过期时间常量
 */
public class LimitBoardCacheConstant {

    // ==================== 缓存键前缀定义 ====================

    /**
     * 涨跌停板统计缓存键前缀
     */
    public static final String LIMIT_BOARD_STATISTICS_PREFIX = "limit:board:statistics:";

    /**
     * 基础统计数据缓存键前缀
     */
    public static final String BASIC_STATISTICS_PREFIX = "limit:board:basic:";

    /**
     * 涨跌停板详细统计缓存键前缀
     */
    public static final String BOARD_STATISTICS_PREFIX = "limit:board:detail:";

    /**
     * 连板分析缓存键前缀
     */
    public static final String CONTINUOUS_ANALYSIS_PREFIX = "limit:board:continuous:";

    /**
     * 连板分布缓存键前缀
     */
    public static final String CONTINUOUS_DISTRIBUTION_PREFIX = "limit:board:continuous:distribution:";

    /**
     * 连板成功率缓存键前缀
     */
    public static final String CONTINUOUS_SUCCESS_RATE_PREFIX = "limit:board:continuous:success:";

    /**
     * 时间分布分析缓存键前缀
     */
    public static final String TIME_DISTRIBUTION_PREFIX = "limit:board:time:distribution:";

    /**
     * 行业分布分析缓存键前缀
     */
    public static final String INDUSTRY_DISTRIBUTION_PREFIX = "limit:board:industry:distribution:";

    /**
     * 行业对比分析缓存键前缀
     */
    public static final String INDUSTRY_COMPARISON_PREFIX = "limit:board:industry:comparison:";

    /**
     * 质量分析缓存键前缀
     */
    public static final String QUALITY_ANALYSIS_PREFIX = "limit:board:quality:";

    /**
     * 封单强度分布缓存键前缀
     */
    public static final String SEAL_STRENGTH_DISTRIBUTION_PREFIX = "limit:board:seal:strength:";

    /**
     * 市盈率分布缓存键前缀（仅跌停板）
     */
    public static final String PE_DISTRIBUTION_PREFIX = "limit:board:pe:distribution:";

    /**
     * 跌停板反弹分析缓存键前缀
     */
    public static final String REBOUND_ANALYSIS_PREFIX = "limit:board:rebound:";

    /**
     * 跌停板按连板数反弹分析缓存键前缀
     */
    public static final String REBOUND_BY_CONTINUOUS_PREFIX = "limit:board:rebound:continuous:";

    /**
     * 跌停板按行业反弹分析缓存键前缀
     */
    public static final String REBOUND_BY_INDUSTRY_PREFIX = "limit:board:rebound:industry:";

    /**
     * 跌停板按市盈率反弹分析缓存键前缀
     */
    public static final String REBOUND_BY_PE_PREFIX = "limit:board:rebound:pe:";

    /**
     * 涨跌停对比分析缓存键前缀
     */
    public static final String BOARD_COMPARISON_PREFIX = "limit:board:comparison:";

    /**
     * 市场情绪指标缓存键前缀
     */
    public static final String SENTIMENT_INDICATOR_PREFIX = "limit:board:sentiment:indicator:";

    /**
     * 市场情绪趋势缓存键前缀
     */
    public static final String SENTIMENT_TREND_PREFIX = "limit:board:sentiment:trend:";

    /**
     * 历史数据对比缓存键前缀
     */
    public static final String HISTORICAL_DATA_PREFIX = "limit:board:historical:";

    /**
     * 分位数分析缓存键前缀
     */
    public static final String PERCENTILE_ANALYSIS_PREFIX = "limit:board:percentile:";

    /**
     * 昨日涨跌停今日表现缓存键前缀
     */
    public static final String YESTERDAY_PERFORMANCE_PREFIX = "limit:board:yesterday:performance:";

    // ==================== 缓存过期时间定义（秒） ====================

    /**
     * 当日实时数据缓存过期时间（5分钟）
     * 用于当日的实时统计数据
     */
    public static final long REALTIME_EXPIRE_SECONDS = 5 * 60;

    /**
     * 当日汇总数据缓存过期时间（30分钟）
     * 用于当日的汇总统计数据
     */
    public static final long DAILY_SUMMARY_EXPIRE_SECONDS = 30 * 60;

    /**
     * 历史数据缓存过期时间（2小时）
     * 用于历史日期的统计数据
     */
    public static final long HISTORICAL_EXPIRE_SECONDS = 2 * 60 * 60;

    /**
     * 趋势分析数据缓存过期时间（1小时）
     * 用于多日期范围的趋势分析数据
     */
    public static final long TREND_ANALYSIS_EXPIRE_SECONDS = 60 * 60;

    /**
     * 复杂计算结果缓存过期时间（4小时）
     * 用于连板成功率、分位数分析等复杂计算结果
     */
    public static final long COMPLEX_CALCULATION_EXPIRE_SECONDS = 4 * 60 * 60;

    /**
     * 长期统计数据缓存过期时间（12小时）
     * 用于不经常变化的长期统计数据
     */
    public static final long LONG_TERM_EXPIRE_SECONDS = 12 * 60 * 60;

    // ==================== 缓存键分隔符 ====================

    /**
     * 缓存键分隔符
     */
    public static final String KEY_SEPARATOR = ":";

    /**
     * 日期格式分隔符
     */
    public static final String DATE_SEPARATOR = "-";

    /**
     * 参数分隔符
     */
    public static final String PARAM_SEPARATOR = "_";

    // ==================== 数据类型标识 ====================

    /**
     * 涨停板数据类型标识
     */
    public static final String LIMIT_UP_TYPE = "up";

    /**
     * 跌停板数据类型标识
     */
    public static final String LIMIT_DOWN_TYPE = "down";

    /**
     * 综合数据类型标识（涨停+跌停）
     */
    public static final String COMBINED_TYPE = "combined";

    // ==================== 缓存键构建方法 ====================

    /**
     * 构建基础统计缓存键
     * 
     * @param date 日期（格式：yyyy-MM-dd）
     * @return 缓存键
     */
    public static String buildBasicStatisticsKey(String date) {
        return BASIC_STATISTICS_PREFIX + date;
    }

    /**
     * 构建涨跌停板详细统计缓存键
     * 
     * @param date 日期（格式：yyyy-MM-dd）
     * @param dataType 数据类型（up/down）
     * @return 缓存键
     */
    public static String buildBoardStatisticsKey(String date, String dataType) {
        return BOARD_STATISTICS_PREFIX + date + KEY_SEPARATOR + dataType;
    }

    /**
     * 构建连板分布缓存键
     * 
     * @param date 日期（格式：yyyy-MM-dd）
     * @param dataType 数据类型（up/down）
     * @return 缓存键
     */
    public static String buildContinuousDistributionKey(String date, String dataType) {
        return CONTINUOUS_DISTRIBUTION_PREFIX + date + KEY_SEPARATOR + dataType;
    }

    /**
     * 构建连板成功率缓存键
     * 
     * @param startDate 开始日期（格式：yyyy-MM-dd）
     * @param endDate 结束日期（格式：yyyy-MM-dd）
     * @param dataType 数据类型（up/down）
     * @return 缓存键
     */
    public static String buildContinuousSuccessRateKey(String startDate, String endDate, String dataType) {
        return CONTINUOUS_SUCCESS_RATE_PREFIX + startDate + PARAM_SEPARATOR + endDate + KEY_SEPARATOR + dataType;
    }

    /**
     * 构建时间分布缓存键
     * 
     * @param date 日期（格式：yyyy-MM-dd）
     * @param dataType 数据类型（up/down）
     * @return 缓存键
     */
    public static String buildTimeDistributionKey(String date, String dataType) {
        return TIME_DISTRIBUTION_PREFIX + date + KEY_SEPARATOR + dataType;
    }

    /**
     * 构建行业分布缓存键
     * 
     * @param date 日期（格式：yyyy-MM-dd）
     * @param dataType 数据类型（up/down）
     * @return 缓存键
     */
    public static String buildIndustryDistributionKey(String date, String dataType) {
        return INDUSTRY_DISTRIBUTION_PREFIX + date + KEY_SEPARATOR + dataType;
    }

    /**
     * 构建行业对比分析缓存键
     * 
     * @param date 日期（格式：yyyy-MM-dd）
     * @return 缓存键
     */
    public static String buildIndustryComparisonKey(String date) {
        return INDUSTRY_COMPARISON_PREFIX + date;
    }

    /**
     * 构建质量分析缓存键
     * 
     * @param date 日期（格式：yyyy-MM-dd）
     * @param dataType 数据类型（up/down）
     * @return 缓存键
     */
    public static String buildQualityAnalysisKey(String date, String dataType) {
        return QUALITY_ANALYSIS_PREFIX + date + KEY_SEPARATOR + dataType;
    }

    /**
     * 构建封单强度分布缓存键
     * 
     * @param date 日期（格式：yyyy-MM-dd）
     * @param dataType 数据类型（up/down）
     * @return 缓存键
     */
    public static String buildSealStrengthDistributionKey(String date, String dataType) {
        return SEAL_STRENGTH_DISTRIBUTION_PREFIX + date + KEY_SEPARATOR + dataType;
    }

    /**
     * 构建市盈率分布缓存键（仅跌停板）
     * 
     * @param date 日期（格式：yyyy-MM-dd）
     * @return 缓存键
     */
    public static String buildPeDistributionKey(String date) {
        return PE_DISTRIBUTION_PREFIX + date;
    }

    /**
     * 构建跌停板反弹分析缓存键
     * 
     * @param date 日期（格式：yyyy-MM-dd）
     * @return 缓存键
     */
    public static String buildReboundAnalysisKey(String date) {
        return REBOUND_ANALYSIS_PREFIX + date;
    }

    /**
     * 构建跌停板按连板数反弹分析缓存键
     * 
     * @param date 日期（格式：yyyy-MM-dd）
     * @return 缓存键
     */
    public static String buildReboundByContinuousKey(String date) {
        return REBOUND_BY_CONTINUOUS_PREFIX + date;
    }

    /**
     * 构建跌停板按行业反弹分析缓存键
     * 
     * @param date 日期（格式：yyyy-MM-dd）
     * @return 缓存键
     */
    public static String buildReboundByIndustryKey(String date) {
        return REBOUND_BY_INDUSTRY_PREFIX + date;
    }

    /**
     * 构建跌停板按市盈率反弹分析缓存键
     * 
     * @param date 日期（格式：yyyy-MM-dd）
     * @return 缓存键
     */
    public static String buildReboundByPeKey(String date) {
        return REBOUND_BY_PE_PREFIX + date;
    }

    /**
     * 构建涨跌停对比分析缓存键
     * 
     * @param date 日期（格式：yyyy-MM-dd）
     * @return 缓存键
     */
    public static String buildBoardComparisonKey(String date) {
        return BOARD_COMPARISON_PREFIX + date;
    }

    /**
     * 构建市场情绪指标缓存键
     * 
     * @param date 日期（格式：yyyy-MM-dd）
     * @return 缓存键
     */
    public static String buildSentimentIndicatorKey(String date) {
        return SENTIMENT_INDICATOR_PREFIX + date;
    }

    /**
     * 构建市场情绪趋势缓存键
     * 
     * @param startDate 开始日期（格式：yyyy-MM-dd）
     * @param endDate 结束日期（格式：yyyy-MM-dd）
     * @return 缓存键
     */
    public static String buildSentimentTrendKey(String startDate, String endDate) {
        return SENTIMENT_TREND_PREFIX + startDate + PARAM_SEPARATOR + endDate;
    }

    /**
     * 构建历史数据对比缓存键
     * 
     * @param startDate 开始日期（格式：yyyy-MM-dd）
     * @param endDate 结束日期（格式：yyyy-MM-dd）
     * @return 缓存键
     */
    public static String buildHistoricalDataKey(String startDate, String endDate) {
        return HISTORICAL_DATA_PREFIX + startDate + PARAM_SEPARATOR + endDate;
    }

    /**
     * 构建分位数分析缓存键
     * 
     * @param targetDate 目标日期（格式：yyyy-MM-dd）
     * @param days 历史天数
     * @return 缓存键
     */
    public static String buildPercentileAnalysisKey(String targetDate, int days) {
        return PERCENTILE_ANALYSIS_PREFIX + targetDate + PARAM_SEPARATOR + days;
    }

    /**
     * 构建昨日涨跌停今日表现缓存键
     * 
     * @param date 今日日期（格式：yyyy-MM-dd）
     * @param dataType 数据类型（up/down）
     * @return 缓存键
     */
    public static String buildYesterdayPerformanceKey(String date, String dataType) {
        return YESTERDAY_PERFORMANCE_PREFIX + date + KEY_SEPARATOR + dataType;
    }
}