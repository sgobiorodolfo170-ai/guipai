package com.gsxi.trading.tradeinsight.monitor;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.LongAdder;

/**
 * 缓存命中率监控器
 * 
 * @author TradeInsight Team
 * @version 1.0
 * @date 2024-12-19
 * @description 监控Redis缓存的命中率、访问频率等指标
 */
@Slf4j
@Component
public class CacheHitRateMonitor {

    /**
     * 缓存统计信息
     */
    private final ConcurrentHashMap<String, CacheStats> cacheStatsMap = new ConcurrentHashMap<>();
    
    /**
     * 低命中率阈值
     */
    private static final double LOW_HIT_RATE_THRESHOLD = 0.7;
    
    /**
     * 记录缓存命中
     * 
     * @param cacheKey 缓存键
     */
    public void recordCacheHit(String cacheKey) {
        String cacheType = extractCacheType(cacheKey);
        CacheStats stats = cacheStatsMap.computeIfAbsent(cacheType, k -> new CacheStats());
        stats.recordHit();
        
        log.debug("缓存命中: {}", cacheKey);
    }
    
    /**
     * 记录缓存未命中
     * 
     * @param cacheKey 缓存键
     */
    public void recordCacheMiss(String cacheKey) {
        String cacheType = extractCacheType(cacheKey);
        CacheStats stats = cacheStatsMap.computeIfAbsent(cacheType, k -> new CacheStats());
        stats.recordMiss();
        
        log.debug("缓存未命中: {}", cacheKey);
        
        // 检查命中率是否过低
        if (stats.getHitRate() < LOW_HIT_RATE_THRESHOLD && stats.getTotalAccess() > 100) {
            log.warn("缓存命中率过低: {} 当前命中率: {:.2f}%", 
                cacheType, stats.getHitRate() * 100);
        }
    }
    
    /**
     * 记录缓存写入
     * 
     * @param cacheKey 缓存键
     */
    public void recordCacheWrite(String cacheKey) {
        String cacheType = extractCacheType(cacheKey);
        CacheStats stats = cacheStatsMap.computeIfAbsent(cacheType, k -> new CacheStats());
        stats.recordWrite();
        
        log.debug("缓存写入: {}", cacheKey);
    }
    
    /**
     * 记录缓存删除
     * 
     * @param cacheKey 缓存键
     */
    public void recordCacheDelete(String cacheKey) {
        String cacheType = extractCacheType(cacheKey);
        CacheStats stats = cacheStatsMap.computeIfAbsent(cacheType, k -> new CacheStats());
        stats.recordDelete();
        
        log.debug("缓存删除: {}", cacheKey);
    }
    
    /**
     * 获取缓存统计信息
     * 
     * @param cacheType 缓存类型
     * @return 统计信息
     */
    public CacheStats getCacheStats(String cacheType) {
        return cacheStatsMap.get(cacheType);
    }
    
    /**
     * 获取所有缓存统计信息
     * 
     * @return 所有统计信息
     */
    public ConcurrentHashMap<String, CacheStats> getAllCacheStats() {
        return new ConcurrentHashMap<>(cacheStatsMap);
    }
    
    /**
     * 清空统计信息
     */
    public void clearStats() {
        cacheStatsMap.clear();
        log.info("缓存统计信息已清空");
    }
    
    /**
     * 从缓存键中提取缓存类型
     * 
     * @param cacheKey 缓存键
     * @return 缓存类型
     */
    private String extractCacheType(String cacheKey) {
        if (cacheKey == null || cacheKey.isEmpty()) {
            return "unknown";
        }
        
        // 提取缓存键的前缀作为类型
        int colonIndex = cacheKey.indexOf(':');
        if (colonIndex > 0) {
            return cacheKey.substring(0, colonIndex);
        }
        
        return "default";
    }
    
    /**
     * 缓存统计信息
     */
    public static class CacheStats {
        private final LongAdder hitCount = new LongAdder();
        private final LongAdder missCount = new LongAdder();
        private final LongAdder writeCount = new LongAdder();
        private final LongAdder deleteCount = new LongAdder();
        /**
         * -- GETTER --
         *  获取最后访问时间
         */
        @Getter
        private volatile LocalDateTime lastAccessTime;
        /**
         * -- GETTER --
         *  获取最后写入时间
         */
        @Getter
        private volatile LocalDateTime lastWriteTime;
        
        /**
         * 记录命中
         */
        public void recordHit() {
            hitCount.increment();
            lastAccessTime = LocalDateTime.now();
        }
        
        /**
         * 记录未命中
         */
        public void recordMiss() {
            missCount.increment();
            lastAccessTime = LocalDateTime.now();
        }
        
        /**
         * 记录写入
         */
        public void recordWrite() {
            writeCount.increment();
            lastWriteTime = LocalDateTime.now();
        }
        
        /**
         * 记录删除
         */
        public void recordDelete() {
            deleteCount.increment();
        }
        
        /**
         * 获取命中次数
         */
        public long getHitCount() {
            return hitCount.sum();
        }
        
        /**
         * 获取未命中次数
         */
        public long getMissCount() {
            return missCount.sum();
        }
        
        /**
         * 获取总访问次数
         */
        public long getTotalAccess() {
            return hitCount.sum() + missCount.sum();
        }
        
        /**
         * 获取命中率
         */
        public double getHitRate() {
            long total = getTotalAccess();
            return total > 0 ? (double) hitCount.sum() / total : 0.0;
        }
        
        /**
         * 获取写入次数
         */
        public long getWriteCount() {
            return writeCount.sum();
        }
        
        /**
         * 获取删除次数
         */
        public long getDeleteCount() {
            return deleteCount.sum();
        }

    }
}