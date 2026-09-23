package com.gsxi.trading.tradeinsight.util.cache;

import com.gsxi.trading.tradeinsight.common.enums.LimitBoardCacheConstant;
import com.gsxi.trading.tradeinsight.monitor.CacheHitRateMonitor;
import com.gsxi.trading.tradeinsight.util.JsonUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/1/1
 * @description 涨跌停板统计分析缓存工具类
 * 提供统一的缓存操作接口，支持不同类型数据的缓存管理
 */
@Slf4j
@Component
public class LimitBoardCacheUtil {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @Autowired
    private CacheHitRateMonitor cacheHitRateMonitor;

    // ==================== 基础缓存操作 ====================

    /**
     * 设置缓存
     * 
     * @param key 缓存键
     * @param value 缓存值
     * @param expireSeconds 过期时间（秒）
     */
    public void set(String key, Object value, long expireSeconds) {
        try {
            redisTemplate.opsForValue().set(key, value, expireSeconds, TimeUnit.SECONDS);
            cacheHitRateMonitor. recordCacheWrite(key);
            log.debug("设置缓存成功: key={}, expireSeconds={}", key, expireSeconds);
        } catch (Exception e) {
            log.error("设置缓存失败: key={}, error={}", key, e.getMessage(), e);
        }
    }

    /**
     * 获取缓存
     * 
     * @param key 缓存键
     * @param clazz 返回值类型
     * @param <T> 泛型类型
     * @return 缓存值，不存在返回null
     */
    public <T> T get(String key, Class<T> clazz) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value == null) {
                cacheHitRateMonitor.recordCacheMiss(key);
                log.debug("缓存不存在: key={}", key);
                return null;
            }
            
            cacheHitRateMonitor.recordCacheHit(key);
            
            if (clazz.isInstance(value)) {
                return clazz.cast(value);
            } else if (value instanceof String) {
                return JsonUtil.parseObject((String) value, clazz);
            } else {
                return JsonUtil.parseObject(JsonUtil.toJsonString(value), clazz);
            }
        } catch (Exception e) {
            log.error("获取缓存失败: key={}, error={}", key, e.getMessage(), e);
            return null;
        }
    }

    /**
     * 获取缓存列表
     * 
     * @param key 缓存键
     * @param clazz 列表元素类型
     * @param <T> 泛型类型
     * @return 缓存列表，不存在返回null
     */
    public <T> List<T> getList(String key, Class<T> clazz) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value == null) {
                cacheHitRateMonitor.recordCacheMiss(key);
                log.debug("缓存不存在: key={}", key);
                return null;
            }
            
            cacheHitRateMonitor.recordCacheHit(key);
            
            if (value instanceof String) {
                return JsonUtil.parseArray((String) value, clazz);
            } else {
                return JsonUtil.parseArray(JsonUtil.toJsonString(value), clazz);
            }
        } catch (Exception e) {
            log.error("获取缓存列表失败: key={}, error={}", key, e.getMessage(), e);
            return null;
        }
    }

    /**
     * 删除缓存
     * 
     * @param key 缓存键
     * @return 是否删除成功
     */
    public boolean delete(String key) {
        try {
            Boolean result = redisTemplate.delete(key);
            if (Boolean.TRUE.equals(result)) {
                cacheHitRateMonitor.recordCacheDelete(key);
            }
            log.debug("删除缓存: key={}, result={}", key, result);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("删除缓存失败: key={}, error={}", key, e.getMessage(), e);
            return false;
        }
    }

    /**
     * 批量删除缓存（支持通配符）
     * 
     * @param pattern 缓存键模式
     * @return 删除的数量
     */
    public long deleteByPattern(String pattern) {
        try {
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                Long result = redisTemplate.delete(keys);
                log.debug("批量删除缓存: pattern={}, count={}", pattern, result);
                return result != null ? result : 0;
            }
            return 0;
        } catch (Exception e) {
            log.error("批量删除缓存失败: pattern={}, error={}", pattern, e.getMessage(), e);
            return 0;
        }
    }

    /**
     * 判断缓存是否存在
     * 
     * @param key 缓存键
     * @return 是否存在
     */
    public boolean exists(String key) {
        try {
            Boolean result = redisTemplate.hasKey(key);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("判断缓存存在失败: key={}, error={}", key, e.getMessage(), e);
            return false;
        }
    }

    /**
     * 获取缓存剩余过期时间
     * 
     * @param key 缓存键
     * @return 剩余过期时间（秒），-1表示永不过期，-2表示不存在
     */
    public long getExpire(String key) {
        try {
            Long expire = redisTemplate.getExpire(key, TimeUnit.SECONDS);
            return expire != null ? expire : -2;
        } catch (Exception e) {
            log.error("获取缓存过期时间失败: key={}, error={}", key, e.getMessage(), e);
            return -2;
        }
    }

    // ==================== 涨跌停板统计专用缓存方法 ====================

    /**
     * 设置基础统计数据缓存
     * 
     * @param date 日期
     * @param data 统计数据
     */
    public void setBasicStatistics(LocalDate date, Object data) {
        String key = LimitBoardCacheConstant.buildBasicStatisticsKey(
                LimitBoardCacheStrategy.formatDateForCache(date));
        long expireTime = LimitBoardCacheStrategy.getBasicStatisticsExpireTime(date);
        set(key, data, expireTime);
    }

    /**
     * 获取基础统计数据缓存
     * 
     * @param date 日期
     * @param clazz 返回值类型
     * @param <T> 泛型类型
     * @return 统计数据
     */
    public <T> T getBasicStatistics(LocalDate date, Class<T> clazz) {
        String key = LimitBoardCacheConstant.buildBasicStatisticsKey(
                LimitBoardCacheStrategy.formatDateForCache(date));
        return get(key, clazz);
    }

    /**
     * 设置涨跌停板详细统计缓存
     * 
     * @param date 日期
     * @param dataType 数据类型
     * @param data 统计数据
     */
    public void setBoardStatistics(LocalDate date, String dataType, Object data) {
        String key = LimitBoardCacheConstant.buildBoardStatisticsKey(
                LimitBoardCacheStrategy.formatDateForCache(date), 
                convertDataType(dataType));
        long expireTime = LimitBoardCacheStrategy.getBoardStatisticsExpireTime(date);
        set(key, data, expireTime);
    }

    /**
     * 获取涨跌停板详细统计缓存
     * 
     * @param date 日期
     * @param dataType 数据类型
     * @param clazz 返回值类型
     * @param <T> 泛型类型
     * @return 统计数据
     */
    public <T> T getBoardStatistics(LocalDate date, String dataType, Class<T> clazz) {
        String key = LimitBoardCacheConstant.buildBoardStatisticsKey(
                LimitBoardCacheStrategy.formatDateForCache(date), 
                convertDataType(dataType));
        return get(key, clazz);
    }

    /**
     * 设置连板分布缓存
     * 
     * @param date 日期
     * @param dataType 数据类型
     * @param data 分布数据
     */
    public void setContinuousDistribution(LocalDate date, String dataType, Object data) {
        String key = LimitBoardCacheConstant.buildContinuousDistributionKey(
                LimitBoardCacheStrategy.formatDateForCache(date), 
                convertDataType(dataType));
        long expireTime = LimitBoardCacheStrategy.getContinuousAnalysisExpireTime(date);
        set(key, data, expireTime);
    }

    /**
     * 获取连板分布缓存
     * 
     * @param date 日期
     * @param dataType 数据类型
     * @param clazz 列表元素类型
     * @param <T> 泛型类型
     * @return 分布数据列表
     */
    public <T> List<T> getContinuousDistribution(LocalDate date, String dataType, Class<T> clazz) {
        String key = LimitBoardCacheConstant.buildContinuousDistributionKey(
                LimitBoardCacheStrategy.formatDateForCache(date), 
                convertDataType(dataType));
        return getList(key, clazz);
    }

    /**
     * 设置连板成功率缓存
     * 
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @param dataType 数据类型
     * @param data 成功率数据
     */
    public void setContinuousSuccessRate(LocalDate startDate, LocalDate endDate, String dataType, Object data) {
        String key = LimitBoardCacheConstant.buildContinuousSuccessRateKey(
                LimitBoardCacheStrategy.formatDateForCache(startDate),
                LimitBoardCacheStrategy.formatDateForCache(endDate),
                convertDataType(dataType));
        long expireTime = LimitBoardCacheStrategy.getContinuousSuccessRateExpireTime(startDate, endDate);
        set(key, data, expireTime);
    }

    /**
     * 获取连板成功率缓存
     * 
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @param dataType 数据类型
     * @param clazz 列表元素类型
     * @param <T> 泛型类型
     * @return 成功率数据列表
     */
    public <T> List<T> getContinuousSuccessRate(LocalDate startDate, LocalDate endDate, String dataType, Class<T> clazz) {
        String key = LimitBoardCacheConstant.buildContinuousSuccessRateKey(
                LimitBoardCacheStrategy.formatDateForCache(startDate),
                LimitBoardCacheStrategy.formatDateForCache(endDate),
                convertDataType(dataType));
        return getList(key, clazz);
    }

    /**
     * 设置质量分析缓存
     * 
     * @param date 日期
     * @param dataType 数据类型
     * @param data 质量分析数据
     */
    public void setQualityAnalysis(LocalDate date, String dataType, Object data) {
        String key = LimitBoardCacheConstant.buildQualityAnalysisKey(
                LimitBoardCacheStrategy.formatDateForCache(date), 
                convertDataType(dataType));
        long expireTime = LimitBoardCacheStrategy.getQualityAnalysisExpireTime(date);
        set(key, data, expireTime);
    }

    /**
     * 获取质量分析缓存
     * 
     * @param date 日期
     * @param dataType 数据类型
     * @param clazz 返回值类型
     * @param <T> 泛型类型
     * @return 质量分析数据
     */
    public <T> T getQualityAnalysis(LocalDate date, String dataType, Class<T> clazz) {
        String key = LimitBoardCacheConstant.buildQualityAnalysisKey(
                LimitBoardCacheStrategy.formatDateForCache(date), 
                convertDataType(dataType));
        return get(key, clazz);
    }

    /**
     * 设置市场情绪指标缓存
     * 
     * @param date 日期
     * @param data 情绪指标数据
     */
    public void setSentimentIndicator(LocalDate date, Object data) {
        String key = LimitBoardCacheConstant.buildSentimentIndicatorKey(
                LimitBoardCacheStrategy.formatDateForCache(date));
        long expireTime = LimitBoardCacheStrategy.getSentimentIndicatorExpireTime(date);
        set(key, data, expireTime);
    }

    /**
     * 获取市场情绪指标缓存
     * 
     * @param date 日期
     * @param clazz 返回值类型
     * @param <T> 泛型类型
     * @return 情绪指标数据
     */
    public <T> T getSentimentIndicator(LocalDate date, Class<T> clazz) {
        String key = LimitBoardCacheConstant.buildSentimentIndicatorKey(
                LimitBoardCacheStrategy.formatDateForCache(date));
        return get(key, clazz);
    }

    /**
     * 设置趋势分析缓存
     * 
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @param data 趋势数据
     */
    public void setTrendAnalysis(LocalDate startDate, LocalDate endDate, Object data) {
        String key = LimitBoardCacheConstant.buildSentimentTrendKey(
                LimitBoardCacheStrategy.formatDateForCache(startDate),
                LimitBoardCacheStrategy.formatDateForCache(endDate));
        long expireTime = LimitBoardCacheStrategy.getTrendAnalysisExpireTime(startDate, endDate);
        set(key, data, expireTime);
    }

    /**
     * 获取趋势分析缓存
     * 
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @param clazz 列表元素类型
     * @param <T> 泛型类型
     * @return 趋势数据列表
     */
    public <T> List<T> getTrendAnalysis(LocalDate startDate, LocalDate endDate, Class<T> clazz) {
        String key = LimitBoardCacheConstant.buildSentimentTrendKey(
                LimitBoardCacheStrategy.formatDateForCache(startDate),
                LimitBoardCacheStrategy.formatDateForCache(endDate));
        return getList(key, clazz);
    }

    // ==================== 缓存清理方法 ====================

    /**
     * 清除指定日期的所有相关缓存
     * 
     * @param date 日期
     * @return 清除的缓存数量
     */
    public long clearDateRelatedCache(LocalDate date) {
        if (!LimitBoardCacheStrategy.shouldClearCache(date)) {
            log.debug("无需清除缓存: date={}", date);
            return 0;
        }

        String[] patterns = LimitBoardCacheStrategy.getCachePatternsToClear(date);
        long totalCleared = 0;
        
        for (String pattern : patterns) {
            long cleared = deleteByPattern(pattern);
            totalCleared += cleared;
        }
        
        log.info("清除日期相关缓存完成: date={}, totalCleared={}", date, totalCleared);
        return totalCleared;
    }

    /**
     * 清除所有涨跌停板统计缓存
     * 
     * @return 清除的缓存数量
     */
    public long clearAllLimitBoardCache() {
        long totalCleared = 0;
        
        // 清除所有涨跌停板相关的缓存
        String[] prefixes = {
            LimitBoardCacheConstant.BASIC_STATISTICS_PREFIX,
            LimitBoardCacheConstant.BOARD_STATISTICS_PREFIX,
            LimitBoardCacheConstant.CONTINUOUS_DISTRIBUTION_PREFIX,
            LimitBoardCacheConstant.CONTINUOUS_SUCCESS_RATE_PREFIX,
            LimitBoardCacheConstant.TIME_DISTRIBUTION_PREFIX,
            LimitBoardCacheConstant.INDUSTRY_DISTRIBUTION_PREFIX,
            LimitBoardCacheConstant.INDUSTRY_COMPARISON_PREFIX,
            LimitBoardCacheConstant.QUALITY_ANALYSIS_PREFIX,
            LimitBoardCacheConstant.SEAL_STRENGTH_DISTRIBUTION_PREFIX,
            LimitBoardCacheConstant.PE_DISTRIBUTION_PREFIX,
            LimitBoardCacheConstant.REBOUND_ANALYSIS_PREFIX,
            LimitBoardCacheConstant.BOARD_COMPARISON_PREFIX,
            LimitBoardCacheConstant.SENTIMENT_INDICATOR_PREFIX,
            LimitBoardCacheConstant.SENTIMENT_TREND_PREFIX,
            LimitBoardCacheConstant.HISTORICAL_DATA_PREFIX,
            LimitBoardCacheConstant.PERCENTILE_ANALYSIS_PREFIX,
            LimitBoardCacheConstant.YESTERDAY_PERFORMANCE_PREFIX
        };
        
        for (String prefix : prefixes) {
            long cleared = deleteByPattern(prefix + "*");
            totalCleared += cleared;
        }
        
        log.info("清除所有涨跌停板缓存完成: totalCleared={}", totalCleared);
        return totalCleared;
    }

    // ==================== 辅助方法 ====================

    /**
     * 转换数据类型为缓存标识
     * 
     * @param dataType 原始数据类型（LIMIT_UP/LIMIT_DOWN）
     * @return 缓存数据类型标识（up/down）
     */
    private String convertDataType(String dataType) {
        if ("LIMIT_UP".equals(dataType)) {
            return LimitBoardCacheConstant.LIMIT_UP_TYPE;
        } else if ("LIMIT_DOWN".equals(dataType)) {
            return LimitBoardCacheConstant.LIMIT_DOWN_TYPE;
        } else {
            return LimitBoardCacheConstant.COMBINED_TYPE;
        }
    }

    // ==================== 缓存统计方法 ====================

    /**
     * 获取缓存命中率统计
     * 
     * @param keyPattern 缓存键模式
     * @return 缓存统计信息
     */
    public CacheStatistics getCacheStatistics(String keyPattern) {
        try {
            Set<String> keys = redisTemplate.keys(keyPattern);
            int totalKeys = keys != null ? keys.size() : 0;
            
            int expiredKeys = 0;
            int validKeys = 0;
            
            if (keys != null) {
                for (String key : keys) {
                    long expire = getExpire(key);
                    if (expire == -2) {
                        expiredKeys++;
                    } else {
                        validKeys++;
                    }
                }
            }
            
            return new CacheStatistics(totalKeys, validKeys, expiredKeys);
        } catch (Exception e) {
            log.error("获取缓存统计失败: pattern={}, error={}", keyPattern, e.getMessage(), e);
            return new CacheStatistics(0, 0, 0);
        }
    }

    /**
     * 缓存统计信息
     */
    public static class CacheStatistics {
        private final int totalKeys;
        private final int validKeys;
        private final int expiredKeys;

        public CacheStatistics(int totalKeys, int validKeys, int expiredKeys) {
            this.totalKeys = totalKeys;
            this.validKeys = validKeys;
            this.expiredKeys = expiredKeys;
        }

        public int getTotalKeys() { return totalKeys; }
        public int getValidKeys() { return validKeys; }
        public int getExpiredKeys() { return expiredKeys; }
        
        public double getHitRate() {
            return totalKeys > 0 ? (double) validKeys / totalKeys : 0.0;
        }

        @Override
        public String toString() {
            return String.format("CacheStatistics{total=%d, valid=%d, expired=%d, hitRate=%.2f%%}", 
                    totalKeys, validKeys, expiredKeys, getHitRate() * 100);
        }
    }
}