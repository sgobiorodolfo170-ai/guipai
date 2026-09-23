package com.gsxi.trading.tradeinsight.exception;

/**
 * 缓存操作异常类
 *
 * @author gsxi
 * @version 1.0
 * @date 2025/9/1
 * @description 缓存操作相关的异常处理类
 */
public class CacheOperationException extends LimitBoardStatisticsException {

    @java.io.Serial
    private static final long serialVersionUID = 1L;

    /**
     * 构造函数 - 缓存连接异常
     *
     * @param cause 原始异常
     */
    public static CacheOperationException connectionError(Throwable cause) {
        return new CacheOperationException(
                LimitBoardStatisticsErrorCode.CACHE_CONNECTION_ERROR,
                "Cache",
                "Connection",
                "Redis缓存连接失败",
                cause
        );
    }

    /**
     * 构造函数 - 缓存操作失败
     *
     * @param operation 操作类型 (get/set/delete等)
     * @param cacheKey  缓存键
     * @param cause     原始异常
     */
    public static CacheOperationException operationFailed(String operation, String cacheKey, Throwable cause) {
        return new CacheOperationException(
                LimitBoardStatisticsErrorCode.CACHE_OPERATION_ERROR,
                "Cache",
                operation,
                String.format("缓存键: %s", cacheKey),
                cause
        );
    }

    /**
     * 构造函数 - 缓存键无效
     *
     * @param cacheKey 无效的缓存键
     */
    public static CacheOperationException invalidKey(String cacheKey) {
        return new CacheOperationException(
                LimitBoardStatisticsErrorCode.CACHE_KEY_INVALID,
                "Cache",
                "KeyValidation",
                String.format("无效的缓存键: %s", cacheKey)
        );
    }

    /**
     * 构造函数 - 缓存序列化异常
     *
     * @param objectType 对象类型
     * @param cause      原始异常
     */
    public static CacheOperationException serializationError(String objectType, Throwable cause) {
        return new CacheOperationException(
                LimitBoardStatisticsErrorCode.CACHE_SERIALIZATION_ERROR,
                "Cache",
                "Serialization",
                String.format("对象类型: %s", objectType),
                cause
        );
    }

    /**
     * 构造函数 - 缓存反序列化异常
     *
     * @param objectType 对象类型
     * @param cause      原始异常
     */
    public static CacheOperationException deserializationError(String objectType, Throwable cause) {
        return new CacheOperationException(
                LimitBoardStatisticsErrorCode.CACHE_DESERIALIZATION_ERROR,
                "Cache",
                "Deserialization",
                String.format("对象类型: %s", objectType),
                cause
        );
    }

    /**
     * 私有构造函数
     */
    private CacheOperationException(LimitBoardStatisticsErrorCode errorCode, String module, String operation, String details) {
        super(errorCode, module, operation, details);
    }

    /**
     * 私有构造函数 - 包含原始异常
     */
    private CacheOperationException(LimitBoardStatisticsErrorCode errorCode, String module, String operation, String details, Throwable cause) {
        super(errorCode, module, operation, details, cause);
    }
}