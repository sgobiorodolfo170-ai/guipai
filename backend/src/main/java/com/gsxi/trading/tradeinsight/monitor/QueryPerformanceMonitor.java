package com.gsxi.trading.tradeinsight.monitor;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;

/**
 * 查询性能监控器
 * 
 * @author TradeInsight Team
 * @version 1.0
 * @date 2024-12-19
 * @description 监控数据库查询性能，记录查询时间、频率等指标
 */
@Slf4j
@Component
public class QueryPerformanceMonitor {

    /**
     * 查询统计信息
     */
    private final ConcurrentHashMap<String, QueryStats> queryStatsMap = new ConcurrentHashMap<>();
    
    /**
     * 慢查询阈值（毫秒）
     */
    private static final long SLOW_QUERY_THRESHOLD = 1000L;
    
    /**
     * 记录查询开始
     * 
     * @param queryName 查询名称
     * @return 查询上下文
     */
    public QueryContext startQuery(String queryName) {
        return new QueryContext(queryName, System.currentTimeMillis());
    }
    
    /**
     * 记录查询结束
     * 
     * @param context 查询上下文
     */
    public void endQuery(QueryContext context) {
        long duration = System.currentTimeMillis() - context.getStartTime();
        String queryName = context.getQueryName();
        
        // 更新统计信息
        QueryStats stats = queryStatsMap.computeIfAbsent(queryName, k -> new QueryStats());
        stats.addExecution(duration);
        
        // 记录慢查询
        if (duration > SLOW_QUERY_THRESHOLD) {
            log.warn("慢查询检测: {} 执行时间: {}ms", queryName, duration);
        }
        
        // 记录查询日志
        log.debug("查询性能: {} 执行时间: {}ms", queryName, duration);
    }
    
    /**
     * 获取查询统计信息
     * 
     * @param queryName 查询名称
     * @return 统计信息
     */
    public QueryStats getQueryStats(String queryName) {
        return queryStatsMap.get(queryName);
    }
    
    /**
     * 获取所有查询统计信息
     * 
     * @return 所有统计信息
     */
    public ConcurrentHashMap<String, QueryStats> getAllQueryStats() {
        return new ConcurrentHashMap<>(queryStatsMap);
    }
    
    /**
     * 清空统计信息
     */
    public void clearStats() {
        queryStatsMap.clear();
        log.info("查询性能统计信息已清空");
    }
    
    /**
     * 查询上下文
     */
    public static class QueryContext {
        private final String queryName;
        private final long startTime;
        
        public QueryContext(String queryName, long startTime) {
            this.queryName = queryName;
            this.startTime = startTime;
        }

        public String getQueryName() {
            return queryName;
        }

        public long getStartTime() {
            return startTime;
        }
    }
    
    /**
     * 查询统计信息
     */
    public static class QueryStats {
        private final LongAdder totalExecutions = new LongAdder();
        private final LongAdder totalDuration = new LongAdder();
        private final AtomicLong maxDuration = new AtomicLong(0);
        private final AtomicLong minDuration = new AtomicLong(Long.MAX_VALUE);
        private final LongAdder slowQueryCount = new LongAdder();
        /**
         * -- GETTER --
         *  获取最后执行时间
         */
        @Getter
        private volatile LocalDateTime lastExecutionTime;
        
        /**
         * 添加执行记录
         * 
         * @param duration 执行时间（毫秒）
         */
        public void addExecution(long duration) {
            totalExecutions.increment();
            totalDuration.add(duration);
            lastExecutionTime = LocalDateTime.now();
            
            // 更新最大执行时间
            maxDuration.updateAndGet(current -> Math.max(current, duration));
            
            // 更新最小执行时间
            minDuration.updateAndGet(current -> Math.min(current, duration));
            
            // 统计慢查询
            if (duration > SLOW_QUERY_THRESHOLD) {
                slowQueryCount.increment();
            }
        }
        
        /**
         * 获取总执行次数
         */
        public long getTotalExecutions() {
            return totalExecutions.sum();
        }
        
        /**
         * 获取平均执行时间
         */
        public double getAverageExecutionTime() {
            long executions = totalExecutions.sum();
            return executions > 0 ? (double) totalDuration.sum() / executions : 0.0;
        }
        
        /**
         * 获取最大执行时间
         */
        public long getMaxExecutionTime() {
            return maxDuration.get();
        }
        
        /**
         * 获取最小执行时间
         */
        public long getMinExecutionTime() {
            long min = minDuration.get();
            return min == Long.MAX_VALUE ? 0 : min;
        }
        
        /**
         * 获取慢查询次数
         */
        public long getSlowQueryCount() {
            return slowQueryCount.sum();
        }
        
        /**
         * 获取慢查询比例
         */
        public double getSlowQueryRate() {
            long executions = totalExecutions.sum();
            return executions > 0 ? (double) slowQueryCount.sum() / executions : 0.0;
        }

        /**
         * 获取总执行时间
         */
        public long getTotalDuration() {
            return totalDuration.sum();
        }
    }
}