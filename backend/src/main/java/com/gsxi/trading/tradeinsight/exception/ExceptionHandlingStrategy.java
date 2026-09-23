package com.gsxi.trading.tradeinsight.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * 异常处理策略类
 *
 * @author gsxi
 * @version 1.0
 * @date 2025/9/1
 * @description 提供异常处理、重试机制和降级策略
 */
@Component
@Slf4j
public class ExceptionHandlingStrategy {

    /**
     * 默认重试次数
     */
    private static final int DEFAULT_RETRY_COUNT = 3;

    /**
     * 默认重试间隔（毫秒）
     */
    private static final long DEFAULT_RETRY_INTERVAL = 1000L;

    /**
     * 执行带重试机制的操作
     *
     * @param operation   要执行的操作
     * @param retryCount  重试次数
     * @param retryInterval 重试间隔（毫秒）
     * @param operationName 操作名称（用于日志）
     * @param <T>         返回类型
     * @return 操作结果
     * @throws LimitBoardStatisticsException 当所有重试都失败时抛出异常
     */
    public <T> T executeWithRetry(Supplier<T> operation, int retryCount, long retryInterval, String operationName) {
        Exception lastException = null;
        
        for (int attempt = 1; attempt <= retryCount; attempt++) {
            try {
                log.debug("执行操作 [{}]，第 {} 次尝试", operationName, attempt);
                return operation.get();
            } catch (Exception e) {
                lastException = e;
                log.warn("操作 [{}] 第 {} 次尝试失败: {}", operationName, attempt, e.getMessage());
                
                // 如果不是最后一次尝试，则等待后重试
                if (attempt < retryCount) {
                    try {
                        TimeUnit.MILLISECONDS.sleep(retryInterval);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new LimitBoardStatisticsException(
                                LimitBoardStatisticsErrorCode.OPERATION_FAILED,
                                "ExceptionHandling",
                                operationName,
                                "重试过程被中断"
                        );
                    }
                }
            }
        }
        
        // 所有重试都失败，抛出异常
        log.error("操作 [{}] 经过 {} 次重试后仍然失败", operationName, retryCount);
        throw new LimitBoardStatisticsException(
                LimitBoardStatisticsErrorCode.OPERATION_FAILED,
                "ExceptionHandling",
                operationName,
                String.format("经过 %d 次重试后仍然失败: %s", retryCount, lastException != null ? lastException.getMessage() : "未知错误")
        );
    }

    /**
     * 执行带重试机制的操作（使用默认参数）
     *
     * @param operation     要执行的操作
     * @param operationName 操作名称
     * @param <T>           返回类型
     * @return 操作结果
     */
    public <T> T executeWithRetry(Supplier<T> operation, String operationName) {
        return executeWithRetry(operation, DEFAULT_RETRY_COUNT, DEFAULT_RETRY_INTERVAL, operationName);
    }

    /**
     * 执行带降级机制的操作
     *
     * @param primaryOperation   主要操作
     * @param fallbackOperation  降级操作
     * @param operationName      操作名称
     * @param <T>                返回类型
     * @return 操作结果
     */
    public <T> T executeWithFallback(Supplier<T> primaryOperation, Supplier<T> fallbackOperation, String operationName) {
        try {
            log.debug("执行主要操作 [{}]", operationName);
            return primaryOperation.get();
        } catch (Exception e) {
            log.warn("主要操作 [{}] 失败，执行降级操作: {}", operationName, e.getMessage());
            try {
                return fallbackOperation.get();
            } catch (Exception fallbackException) {
                log.error("降级操作 [{}] 也失败了: {}", operationName, fallbackException.getMessage());
                throw new LimitBoardStatisticsException(
                        LimitBoardStatisticsErrorCode.OPERATION_FAILED,
                        "ExceptionHandling",
                        operationName,
                        String.format("主要操作和降级操作都失败: 主要异常=%s, 降级异常=%s", 
                                e.getMessage(), fallbackException.getMessage())
                );
            }
        }
    }

    /**
     * 执行带重试和降级机制的操作
     *
     * @param primaryOperation   主要操作
     * @param fallbackOperation  降级操作
     * @param retryCount         重试次数
     * @param retryInterval      重试间隔
     * @param operationName      操作名称
     * @param <T>                返回类型
     * @return 操作结果
     */
    public <T> T executeWithRetryAndFallback(Supplier<T> primaryOperation, Supplier<T> fallbackOperation, 
                                           int retryCount, long retryInterval, String operationName) {
        try {
            return executeWithRetry(primaryOperation, retryCount, retryInterval, operationName);
        } catch (Exception e) {
            log.warn("主要操作 [{}] 经过重试后仍然失败，执行降级操作: {}", operationName, e.getMessage());
            try {
                return fallbackOperation.get();
            } catch (Exception fallbackException) {
                log.error("降级操作 [{}] 也失败了: {}", operationName, fallbackException.getMessage());
                throw new LimitBoardStatisticsException(
                        LimitBoardStatisticsErrorCode.OPERATION_FAILED,
                        "ExceptionHandling",
                        operationName,
                        String.format("主要操作重试和降级操作都失败: 主要异常=%s, 降级异常=%s", 
                                e.getMessage(), fallbackException.getMessage())
                );
            }
        }
    }

    /**
     * 安全执行操作，捕获所有异常并转换为统一的异常类型
     *
     * @param operation     要执行的操作
     * @param operationName 操作名称
     * @param <T>           返回类型
     * @return 操作结果
     * @throws LimitBoardStatisticsException 统一的异常类型
     */
    public <T> T safeExecute(Supplier<T> operation, String operationName) {
        try {
            return operation.get();
        } catch (LimitBoardStatisticsException e) {
            // 已经是我们的异常类型，直接抛出
            throw e;
        } catch (Exception e) {
            log.error("操作 [{}] 执行失败: {}", operationName, e.getMessage(), e);
            
            // 根据异常类型转换为相应的业务异常
            if (e instanceof java.sql.SQLException || e.getCause() instanceof java.sql.SQLException) {
                throw DataQueryException.sqlExecutionError(operationName, e);
            } else if (e instanceof java.util.concurrent.TimeoutException) {
                throw DataQueryException.timeout(operationName);
            } else if (e instanceof IllegalArgumentException) {
                throw BusinessValidationException.requiredFieldMissing(e.getMessage());
            } else {
                throw new LimitBoardStatisticsException(
                        LimitBoardStatisticsErrorCode.SYSTEM_ERROR,
                        "ExceptionHandling",
                        operationName,
                        e.getMessage(),
                        e
                );
            }
        }
    }

    /**
     * 判断异常是否可以重试
     *
     * @param exception 异常
     * @return 是否可以重试
     */
    public boolean isRetryableException(Exception exception) {
        // 网络相关异常可以重试
        if (exception instanceof java.net.SocketTimeoutException ||
            exception instanceof java.net.ConnectException ||
            exception instanceof java.util.concurrent.TimeoutException) {
            return true;
        }
        
        // 数据库连接异常可以重试
        if (exception instanceof java.sql.SQLException) {
            String sqlState = ((java.sql.SQLException) exception).getSQLState();
            // 连接异常的SQL状态码
            return "08000".equals(sqlState) || "08001".equals(sqlState) || "08003".equals(sqlState);
        }
        
        // 缓存连接异常可以重试
        if (exception.getMessage() != null && 
            (exception.getMessage().contains("Connection refused") ||
             exception.getMessage().contains("Connection timeout"))) {
            return true;
        }
        
        return false;
    }
}