package com.gsxi.trading.tradeinsight.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 性能监控配置类
 * 
 * @author TradeInsight Team
 * @version 1.0
 * @date 2024-12-19
 * @description 性能监控相关配置参数
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "tradeinsight.performance.monitor")
public class PerformanceMonitorConfig {

    /**
     * 是否启用性能监控
     */
    private boolean enabled = false;

    /**
     * 慢查询阈值（毫秒）
     */
    private long slowQueryThreshold = 1000L;

    /**
     * 慢服务调用阈值（毫秒）
     */
    private long slowServiceThreshold = 2000L;

    /**
     * 缓存命中率低阈值
     */
    private double lowCacheHitRateThreshold = 0.7;

    /**
     * 是否启用查询性能监控
     */
    private boolean queryMonitorEnabled = true;

    /**
     * 是否启用缓存命中率监控
     */
    private boolean cacheMonitorEnabled = true;

    /**
     * 是否启用服务性能监控
     */
    private boolean serviceMonitorEnabled = true;

    /**
     * 性能统计数据保留时间（小时）
     */
    private int statsRetentionHours = 24;

    /**
     * 是否启用性能告警
     */
    private boolean alertEnabled = false;

    /**
     * 告警邮件接收者
     */
    private String alertEmailRecipients;

    /**
     * 性能监控日志级别
     */
    private String logLevel = "DEBUG";

    /**
     * 是否启用详细的性能日志
     */
    private boolean detailedLoggingEnabled = false;

    /**
     * 统计数据清理间隔（小时）
     */
    private int cleanupIntervalHours = 6;

    /**
     * 最大统计条目数
     */
    private int maxStatsEntries = 1000;
}