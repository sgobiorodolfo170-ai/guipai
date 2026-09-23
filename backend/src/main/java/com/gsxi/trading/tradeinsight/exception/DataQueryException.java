package com.gsxi.trading.tradeinsight.exception;

/**
 * 数据查询异常类
 *
 * @author gsxi
 * @version 1.0
 * @date 2025/9/1
 * @description 数据查询相关的异常处理类
 */
public class DataQueryException extends LimitBoardStatisticsException {

    @java.io.Serial
    private static final long serialVersionUID = 1L;

    /**
     * 构造函数 - 查询超时
     *
     * @param queryType 查询类型
     */
    public static DataQueryException timeout(String queryType) {
        return new DataQueryException(
                LimitBoardStatisticsErrorCode.QUERY_TIMEOUT,
                "DataQuery",
                queryType,
                "查询执行超时，请稍后重试"
        );
    }

    /**
     * 构造函数 - 数据库连接异常
     *
     * @param cause 原始异常
     */
    public static DataQueryException databaseConnectionError(Throwable cause) {
        return new DataQueryException(
                LimitBoardStatisticsErrorCode.DATABASE_CONNECTION_ERROR,
                "DataQuery",
                "DatabaseConnection",
                "数据库连接失败",
                cause
        );
    }

    /**
     * 构造函数 - SQL执行异常
     *
     * @param sqlMethod SQL方法名
     * @param cause     原始异常
     */
    public static DataQueryException sqlExecutionError(String sqlMethod, Throwable cause) {
        return new DataQueryException(
                LimitBoardStatisticsErrorCode.SQL_EXECUTION_ERROR,
                "DataQuery",
                sqlMethod,
                "SQL执行异常: " + (cause != null ? cause.getMessage() : "未知错误"),
                cause
        );
    }

    /**
     * 构造函数 - 数据格式错误
     *
     * @param fieldName 字段名
     * @param value     错误的值
     */
    public static DataQueryException dataFormatError(String fieldName, Object value) {
        return new DataQueryException(
                LimitBoardStatisticsErrorCode.DATA_FORMAT_ERROR,
                "DataQuery",
                "DataFormat",
                String.format("字段 %s 的值 %s 格式不正确", fieldName, value)
        );
    }

    /**
     * 构造函数 - 查询结果为空
     *
     * @param queryType 查询类型
     * @param condition 查询条件
     */
    public static DataQueryException queryResultEmpty(String queryType, String condition) {
        return new DataQueryException(
                LimitBoardStatisticsErrorCode.QUERY_RESULT_EMPTY,
                "DataQuery",
                queryType,
                String.format("查询条件: %s", condition)
        );
    }

    /**
     * 私有构造函数
     */
    private DataQueryException(LimitBoardStatisticsErrorCode errorCode, String module, String operation, String details) {
        super(errorCode, module, operation, details);
    }

    /**
     * 私有构造函数 - 包含原始异常
     */
    private DataQueryException(LimitBoardStatisticsErrorCode errorCode, String module, String operation, String details, Throwable cause) {
        super(errorCode, module, operation, details, cause);
    }
}