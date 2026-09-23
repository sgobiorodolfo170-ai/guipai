package com.gsxi.trading.tradeinsight.task;

import com.gsxi.trading.tradeinsight.config.PerformanceMonitorConfig;
import com.gsxi.trading.tradeinsight.monitor.CacheHitRateMonitor;
import com.gsxi.trading.tradeinsight.monitor.QueryPerformanceMonitor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 性能监控定时任务
 * 
 * @author TradeInsight Team
 * @version 1.0
 * @date 2024-12-19
 * @description 定期执行性能监控相关任务，如统计汇总、告警检查等
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "tradeinsight.performance.monitor", name = "enabled", havingValue = "true", matchIfMissing = true)
public class PerformanceMonitorTask {

    private final QueryPerformanceMonitor queryPerformanceMonitor;
    private final CacheHitRateMonitor cacheHitRateMonitor;
    private final PerformanceMonitorConfig config;

    /**
     * 性能统计汇总任务
     * 每小时执行一次，汇总性能统计数据
     */
    @Scheduled(cron = "0 0 * * * ?")
    public void performanceStatsSummary() {
        if (!config.isEnabled()) {
            return;
        }

        try {
            log.info("开始执行性能统计汇总任务");

            // 汇总查询性能统计
            summarizeQueryPerformance();

            // 汇总缓存命中率统计
            summarizeCachePerformance();

            log.info("性能统计汇总任务执行完成");
        } catch (Exception e) {
            log.error("性能统计汇总任务执行失败", e);
        }
    }

    /**
     * 性能告警检查任务
     * 每15分钟执行一次，检查是否有性能异常需要告警
     */
    @Scheduled(cron = "0 */15 * * * ?")
    public void performanceAlertCheck() {
        if (!config.isEnabled() || !config.isAlertEnabled()) {
            return;
        }

        try {
            log.debug("开始执行性能告警检查任务");

            // 检查慢查询告警
            checkSlowQueryAlert();

            // 检查缓存命中率告警
            checkCacheHitRateAlert();

            log.debug("性能告警检查任务执行完成");
        } catch (Exception e) {
            log.error("性能告警检查任务执行失败", e);
        }
    }

    /**
     * 性能统计数据清理任务
     * 每6小时执行一次，清理过期的性能统计数据
     */
    @Scheduled(cron = "0 0 */6 * * ?")
    public void performanceStatsCleanup() {
        if (!config.isEnabled()) {
            return;
        }

        try {
            log.info("开始执行性能统计数据清理任务");

            // 检查统计数据是否超过保留时间
            LocalDateTime cutoffTime = LocalDateTime.now().minusHours(config.getStatsRetentionHours());

            // 清理查询性能统计（这里简化处理，实际可能需要更复杂的清理逻辑）
            Map<String, QueryPerformanceMonitor.QueryStats> queryStats = queryPerformanceMonitor.getAllQueryStats();
            int queryStatsCount = queryStats.size();

            if (queryStatsCount > config.getMaxStatsEntries()) {
                log.warn("查询性能统计条目过多: {}, 建议清理", queryStatsCount);
            }

            // 清理缓存统计
            Map<String, CacheHitRateMonitor.CacheStats> cacheStats = cacheHitRateMonitor.getAllCacheStats();
            int cacheStatsCount = cacheStats.size();

            if (cacheStatsCount > config.getMaxStatsEntries()) {
                log.warn("缓存统计条目过多: {}, 建议清理", cacheStatsCount);
            }

            log.info("性能统计数据清理任务执行完成");
        } catch (Exception e) {
            log.error("性能统计数据清理任务执行失败", e);
        }
    }

    /**
     * 汇总查询性能统计
     */
    private void summarizeQueryPerformance() {
        Map<String, QueryPerformanceMonitor.QueryStats> allStats = queryPerformanceMonitor.getAllQueryStats();

        if (allStats.isEmpty()) {
            log.debug("暂无查询性能统计数据");
            return;
        }

        long totalExecutions = allStats.values().stream()
                .mapToLong(QueryPerformanceMonitor.QueryStats::getTotalExecutions)
                .sum();

        double avgExecutionTime = allStats.values().stream()
                .mapToDouble(QueryPerformanceMonitor.QueryStats::getAverageExecutionTime)
                .average()
                .orElse(0.0);

        long totalSlowQueries = allStats.values().stream()
                .mapToLong(QueryPerformanceMonitor.QueryStats::getSlowQueryCount)
                .sum();

        double slowQueryRate = totalExecutions > 0 ? (double) totalSlowQueries / totalExecutions : 0.0;

        log.info("查询性能统计汇总 - 总执行次数: {}, 平均执行时间: {:.2f}ms, 慢查询数: {}, 慢查询率: {:.2f}%",
                totalExecutions, avgExecutionTime, totalSlowQueries, slowQueryRate * 100);

        // 输出Top 5慢查询
        allStats.entrySet().stream()
                .filter(entry -> entry.getValue().getSlowQueryCount() > 0)
                .sorted((e1, e2) -> Double.compare(e2.getValue().getAverageExecutionTime(), e1.getValue().getAverageExecutionTime()))
                .limit(5)
                .forEach(entry -> {
                    QueryPerformanceMonitor.QueryStats stats = entry.getValue();
                    log.info("慢查询Top - 方法: {}, 平均时间: {:.2f}ms, 慢查询次数: {}",
                            entry.getKey(), stats.getAverageExecutionTime(), stats.getSlowQueryCount());
                });
    }

    /**
     * 汇总缓存性能统计
     */
    private void summarizeCachePerformance() {
        Map<String, CacheHitRateMonitor.CacheStats> allStats = cacheHitRateMonitor.getAllCacheStats();

        if (allStats.isEmpty()) {
            log.debug("暂无缓存性能统计数据");
            return;
        }

        long totalHits = allStats.values().stream()
                .mapToLong(CacheHitRateMonitor.CacheStats::getHitCount)
                .sum();

        long totalMisses = allStats.values().stream()
                .mapToLong(CacheHitRateMonitor.CacheStats::getMissCount)
                .sum();

        long totalAccess = totalHits + totalMisses;
        double overallHitRate = totalAccess > 0 ? (double) totalHits / totalAccess : 0.0;

        long totalWrites = allStats.values().stream()
                .mapToLong(CacheHitRateMonitor.CacheStats::getWriteCount)
                .sum();

        log.info("缓存性能统计汇总 - 总访问次数: {}, 命中次数: {}, 未命中次数: {}, 命中率: {:.2f}%, 写入次数: {}",
                totalAccess, totalHits, totalMisses, overallHitRate * 100, totalWrites);

        // 输出命中率较低的缓存类型
        allStats.entrySet().stream()
                .filter(entry -> entry.getValue().getTotalAccess() > 10) // 至少有10次访问
                .filter(entry -> entry.getValue().getHitRate() < config.getLowCacheHitRateThreshold())
                .sorted((e1, e2) -> Double.compare(e1.getValue().getHitRate(), e2.getValue().getHitRate()))
                .forEach(entry -> {
                    CacheHitRateMonitor.CacheStats stats = entry.getValue();
                    log.warn("低命中率缓存 - 类型: {}, 命中率: {:.2f}%, 访问次数: {}",
                            entry.getKey(), stats.getHitRate() * 100, stats.getTotalAccess());
                });
    }

    /**
     * 检查慢查询告警
     */
    private void checkSlowQueryAlert() {
        Map<String, QueryPerformanceMonitor.QueryStats> allStats = queryPerformanceMonitor.getAllQueryStats();

        for (Map.Entry<String, QueryPerformanceMonitor.QueryStats> entry : allStats.entrySet()) {
            QueryPerformanceMonitor.QueryStats stats = entry.getValue();

            // 检查是否有新的慢查询
            if (stats.getSlowQueryCount() > 0 && stats.getAverageExecutionTime() > config.getSlowQueryThreshold()) {
                log.warn("慢查询告警 - 方法: {}, 平均执行时间: {:.2f}ms, 慢查询次数: {}",
                        entry.getKey(), stats.getAverageExecutionTime(), stats.getSlowQueryCount());

                // 这里可以发送邮件或其他告警通知
                sendSlowQueryAlert(entry.getKey(), stats);
            }
        }
    }

    /**
     * 检查缓存命中率告警
     */
    private void checkCacheHitRateAlert() {
        Map<String, CacheHitRateMonitor.CacheStats> allStats = cacheHitRateMonitor.getAllCacheStats();

        for (Map.Entry<String, CacheHitRateMonitor.CacheStats> entry : allStats.entrySet()) {
            CacheHitRateMonitor.CacheStats stats = entry.getValue();

            // 检查命中率是否过低（需要有足够的访问量才有意义）
            if (stats.getTotalAccess() > 50 && stats.getHitRate() < config.getLowCacheHitRateThreshold()) {
                log.warn("缓存命中率过低告警 - 类型: {}, 命中率: {:.2f}%, 访问次数: {}",
                        entry.getKey(), stats.getHitRate() * 100, stats.getTotalAccess());

                // 这里可以发送邮件或其他告警通知
                sendCacheHitRateAlert(entry.getKey(), stats);
            }
        }
    }

    /**
     * 发送慢查询告警
     *
     * @param queryName 查询方法名
     * @param stats 统计信息
     */
    private void sendSlowQueryAlert(String queryName, QueryPerformanceMonitor.QueryStats stats) {
        // 这里可以实现邮件发送、短信通知等告警机制
        log.info("发送慢查询告警通知: queryName={}, avgTime={:.2f}ms", queryName, stats.getAverageExecutionTime());
    }

    /**
     * 发送缓存命中率告警
     *
     * @param cacheType 缓存类型
     * @param stats 统计信息
     */
    private void sendCacheHitRateAlert(String cacheType, CacheHitRateMonitor.CacheStats stats) {
        // 这里可以实现邮件发送、短信通知等告警机制
        log.info("发送缓存命中率告警通知: cacheType={}, hitRate={:.2f}%", cacheType, stats.getHitRate() * 100);
    }
}