package com.gsxi.trading.tradeinsight.exception;

import lombok.Getter;

/**
 * 涨跌停板统计分析异常类
 *
 * @author gsxi
 * @version 1.0
 * @date 2025/9/1
 * @description 涨跌停板统计分析功能专用异常类，继承自BizException
 */
@Getter
public class LimitBoardStatisticsException extends BizException {

    @java.io.Serial
    private static final long serialVersionUID = 1L;

    /**
     * 异常发生的模块
     */
    private final String module;

    /**
     * 异常发生的操作
     */
    private final String operation;

    /**
     * 异常详细信息
     */
    private final String details;

    /**
     * 构造函数 - 使用错误码枚举
     *
     * @param errorCode 错误码枚举
     */
    public LimitBoardStatisticsException(LimitBoardStatisticsErrorCode errorCode) {
        super(errorCode.getErrorCode(), errorCode.getErrorMessage());
        this.module = "LimitBoardStatistics";
        this.operation = "Unknown";
        this.details = null;
    }

    /**
     * 构造函数 - 使用错误码枚举和详细信息
     *
     * @param errorCode 错误码枚举
     * @param details   详细信息
     */
    public LimitBoardStatisticsException(LimitBoardStatisticsErrorCode errorCode, String details) {
        super(errorCode.getErrorCode(), errorCode.getErrorMessage());
        this.module = "LimitBoardStatistics";
        this.operation = "Unknown";
        this.details = details;
    }

    /**
     * 构造函数 - 使用错误码枚举、模块和操作信息
     *
     * @param errorCode 错误码枚举
     * @param module    模块名称
     * @param operation 操作名称
     */
    public LimitBoardStatisticsException(LimitBoardStatisticsErrorCode errorCode, String module, String operation) {
        super(errorCode.getErrorCode(), errorCode.getErrorMessage());
        this.module = module;
        this.operation = operation;
        this.details = null;
    }

    /**
     * 构造函数 - 完整参数
     *
     * @param errorCode 错误码枚举
     * @param module    模块名称
     * @param operation 操作名称
     * @param details   详细信息
     */
    public LimitBoardStatisticsException(LimitBoardStatisticsErrorCode errorCode, String module, String operation, String details) {
        super(errorCode.getErrorCode(), errorCode.getErrorMessage());
        this.module = module;
        this.operation = operation;
        this.details = details;
    }

    /**
     * 构造函数 - 使用错误码枚举和原始异常
     *
     * @param errorCode 错误码枚举
     * @param cause     原始异常
     */
    public LimitBoardStatisticsException(LimitBoardStatisticsErrorCode errorCode, Throwable cause) {
        super(errorCode.getErrorCode(), errorCode.getErrorMessage());
        this.module = "LimitBoardStatistics";
        this.operation = "Unknown";
        this.details = cause != null ? cause.getMessage() : null;
        this.initCause(cause);
    }

    /**
     * 构造函数 - 完整参数包含原始异常
     *
     * @param errorCode 错误码枚举
     * @param module    模块名称
     * @param operation 操作名称
     * @param details   详细信息
     * @param cause     原始异常
     */
    public LimitBoardStatisticsException(LimitBoardStatisticsErrorCode errorCode, String module, String operation, String details, Throwable cause) {
        super(errorCode.getErrorCode(), errorCode.getErrorMessage());
        this.module = module;
        this.operation = operation;
        this.details = details;
        this.initCause(cause);
    }

    /**
     * 获取完整的错误信息
     *
     * @return 完整的错误信息
     */
    public String getFullErrorMessage() {
        StringBuilder sb = new StringBuilder();
        sb.append("[").append(module).append("]");
        sb.append("[").append(operation).append("]");
        sb.append(" ").append(getErrorMessage());
        
        if (details != null && !details.trim().isEmpty()) {
            sb.append(" - ").append(details);
        }
        
        return sb.toString();
    }

    @Override
    public String toString() {
        return "LimitBoardStatisticsException{" +
                "errorCode=" + getErrorCode() +
                ", errorMessage='" + getErrorMessage() + '\'' +
                ", module='" + module + '\'' +
                ", operation='" + operation + '\'' +
                ", details='" + details + '\'' +
                '}';
    }
}