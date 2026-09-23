package com.gsxi.trading.tradeinsight.controller;

import com.gsxi.trading.tradeinsight.dto.response.AjaxResult;
import com.gsxi.trading.tradeinsight.monitor.CacheHitRateMonitor;
import com.gsxi.trading.tradeinsight.monitor.QueryPerformanceMonitor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 性能监控控制器
 * 
 * @author TradeInsight Team
 * @version 1.0
 * @date 2024-12-19
 * @description 提供系统性能监控数据的API接口
 */
@Slf4j
@RestController
@RequestMapping("/api/performance-monitor")
@RequiredArgsConstructor
@Tag(name = "性能监控", description = "系统性能监控相关接口")
public class PerformanceMonitorController {

    private final QueryPerformanceMonitor queryPerformanceMonitor;
    private final CacheHitRateMonitor cacheHitRateMonitor;

    /**
     * 获取查询性能统计
     * 
     * @return 查询性能统计数据
     */
    @GetMapping("/query-stats")
    @Operation(summary = "获取查询性能统计", description = "获取数据库查询性能统计信息")
    public AjaxResult getQueryStats() {
        try {
            Map<String, QueryPerformanceMonitor.QueryStats> allStats = queryPerformanceMonitor.getAllQueryStats();
            
            Map<String, Object> result = new HashMap<>();
            result.put("totalQueries", allStats.size());
            result.put("queryStats", allStats);
            
            // 计算总体统计
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
            
            result.put("totalExecutions", totalExecutions);
            result.put("avgExecutionTime", avgExecutionTime);
            result.put("totalSlowQueries", totalSlowQueries);
            result.put("slowQueryRate", totalExecutions > 0 ? (double) totalSlowQueries / totalExecutions : 0.0);
            
            return AjaxResult.success("获取查询性能统计成功", result);
        } catch (Exception e) {
            log.error("获取查询性能统计失败", e);
            return AjaxResult.error("获取查询性能统计失败: " + e.getMessage());
        }
    }

    /**
     * 获取指定查询的性能统计
     * 
     * @param queryName 查询名称
     * @return 查询性能统计数据
     */
    @GetMapping("/query-stats/{queryName}")
    @Operation(summary = "获取指定查询性能统计", description = "获取指定查询方法的性能统计信息")
    public AjaxResult getQueryStatsByName(@PathVariable String queryName) {
        try {
            QueryPerformanceMonitor.QueryStats stats = queryPerformanceMonitor.getQueryStats(queryName);
            
            if (stats == null) {
                return AjaxResult.error("未找到查询统计信息: " + queryName);
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("queryName", queryName);
            result.put("totalExecutions", stats.getTotalExecutions());
            result.put("averageExecutionTime", stats.getAverageExecutionTime());
            result.put("maxExecutionTime", stats.getMaxExecutionTime());
            result.put("minExecutionTime", stats.getMinExecutionTime());
            result.put("slowQueryCount", stats.getSlowQueryCount());
            result.put("slowQueryRate", stats.getSlowQueryRate());
            result.put("lastExecutionTime", stats.getLastExecutionTime());
            result.put("totalDuration", stats.getTotalDuration());
            
            return AjaxResult.success("获取查询性能统计成功", result);
        } catch (Exception e) {
            log.error("获取查询性能统计失败: queryName={}", queryName, e);
            return AjaxResult.error("获取查询性能统计失败: " + e.getMessage());
        }
    }

    /**
     * 获取缓存命中率统计
     * 
     * @return 缓存命中率统计数据
     */
    @GetMapping("/cache-stats")
    @Operation(summary = "获取缓存命中率统计", description = "获取Redis缓存命中率统计信息")
    public AjaxResult getCacheStats() {
        try {
            Map<String, CacheHitRateMonitor.CacheStats> allStats = cacheHitRateMonitor.getAllCacheStats();
            
            Map<String, Object> result = new HashMap<>();
            result.put("totalCacheTypes", allStats.size());
            result.put("cacheStats", allStats);
            
            // 计算总体统计
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
            
            long totalDeletes = allStats.values().stream()
                    .mapToLong(CacheHitRateMonitor.CacheStats::getDeleteCount)
                    .sum();
            
            result.put("totalHits", totalHits);
            result.put("totalMisses", totalMisses);
            result.put("totalAccess", totalAccess);
            result.put("overallHitRate", overallHitRate);
            result.put("totalWrites", totalWrites);
            result.put("totalDeletes", totalDeletes);
            
            return AjaxResult.success("获取缓存命中率统计成功", result);
        } catch (Exception e) {
            log.error("获取缓存命中率统计失败", e);
            return AjaxResult.error("获取缓存命中率统计失败: " + e.getMessage());
        }
    }

    /**
     * 获取指定缓存类型的命中率统计
     * 
     * @param cacheType 缓存类型
     * @return 缓存命中率统计数据
     */
    @GetMapping("/cache-stats/{cacheType}")
    @Operation(summary = "获取指定缓存类型命中率统计", description = "获取指定缓存类型的命中率统计信息")
    public AjaxResult getCacheStatsByType(@PathVariable String cacheType) {
        try {
            CacheHitRateMonitor.CacheStats stats = cacheHitRateMonitor.getCacheStats(cacheType);
            
            if (stats == null) {
                return AjaxResult.error("未找到缓存统计信息: " + cacheType);
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("cacheType", cacheType);
            result.put("hitCount", stats.getHitCount());
            result.put("missCount", stats.getMissCount());
            result.put("totalAccess", stats.getTotalAccess());
            result.put("hitRate", stats.getHitRate());
            result.put("writeCount", stats.getWriteCount());
            result.put("deleteCount", stats.getDeleteCount());
            result.put("lastAccessTime", stats.getLastAccessTime());
            result.put("lastWriteTime", stats.getLastWriteTime());
            
            return AjaxResult.success("获取缓存命中率统计成功", result);
        } catch (Exception e) {
            log.error("获取缓存命中率统计失败: cacheType={}", cacheType, e);
            return AjaxResult.error("获取缓存命中率统计失败: " + e.getMessage());
        }
    }

    /**
     * 获取系统性能概览
     * 
     * @return 系统性能概览数据
     */
    @GetMapping("/overview")
    @Operation(summary = "获取系统性能概览", description = "获取系统整体性能概览信息")
    public AjaxResult getPerformanceOverview() {
        try {
            Map<String, Object> result = new HashMap<>();
            
            // 查询性能概览
            Map<String, QueryPerformanceMonitor.QueryStats> queryStats = queryPerformanceMonitor.getAllQueryStats();
            long totalQueryExecutions = queryStats.values().stream()
                    .mapToLong(QueryPerformanceMonitor.QueryStats::getTotalExecutions)
                    .sum();
            
            double avgQueryTime = queryStats.values().stream()
                    .mapToDouble(QueryPerformanceMonitor.QueryStats::getAverageExecutionTime)
                    .average()
                    .orElse(0.0);
            
            long slowQueries = queryStats.values().stream()
                    .mapToLong(QueryPerformanceMonitor.QueryStats::getSlowQueryCount)
                    .sum();
            
            // 缓存性能概览
            Map<String, CacheHitRateMonitor.CacheStats> cacheStats = cacheHitRateMonitor.getAllCacheStats();
            long totalCacheHits = cacheStats.values().stream()
                    .mapToLong(CacheHitRateMonitor.CacheStats::getHitCount)
                    .sum();
            
            long totalCacheMisses = cacheStats.values().stream()
                    .mapToLong(CacheHitRateMonitor.CacheStats::getMissCount)
                    .sum();
            
            long totalCacheAccess = totalCacheHits + totalCacheMisses;
            double overallCacheHitRate = totalCacheAccess > 0 ? (double) totalCacheHits / totalCacheAccess : 0.0;
            
            // 构建结果
            Map<String, Object> queryOverview = new HashMap<>();
            queryOverview.put("totalExecutions", totalQueryExecutions);
            queryOverview.put("averageExecutionTime", avgQueryTime);
            queryOverview.put("slowQueryCount", slowQueries);
            queryOverview.put("slowQueryRate", totalQueryExecutions > 0 ? (double) slowQueries / totalQueryExecutions : 0.0);
            
            Map<String, Object> cacheOverview = new HashMap<>();
            cacheOverview.put("totalAccess", totalCacheAccess);
            cacheOverview.put("hitCount", totalCacheHits);
            cacheOverview.put("missCount", totalCacheMisses);
            cacheOverview.put("hitRate", overallCacheHitRate);
            
            result.put("queryPerformance", queryOverview);
            result.put("cachePerformance", cacheOverview);
            result.put("timestamp", System.currentTimeMillis());
            
            return AjaxResult.success("获取系统性能概览成功", result);
        } catch (Exception e) {
            log.error("获取系统性能概览失败", e);
            return AjaxResult.error("获取系统性能概览失败: " + e.getMessage());
        }
    }

    /**
     * 清空性能统计数据
     * 
     * @return 操作结果
     */
    @DeleteMapping("/clear-stats")
    @Operation(summary = "清空性能统计数据", description = "清空所有性能监控统计数据")
    public AjaxResult clearStats() {
        try {
            queryPerformanceMonitor.clearStats();
            cacheHitRateMonitor.clearStats();
            
            return AjaxResult.success("清空性能统计数据成功");
        } catch (Exception e) {
            log.error("清空性能统计数据失败", e);
            return AjaxResult.error("清空性能统计数据失败: " + e.getMessage());
        }
    }
}