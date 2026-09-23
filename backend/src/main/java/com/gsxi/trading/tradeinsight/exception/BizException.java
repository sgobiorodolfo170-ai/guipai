package com.gsxi.trading.tradeinsight.exception;

import lombok.Getter;
import lombok.Setter;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/15
 * @description 业务异常
 */
@Getter
@Setter
public class BizException extends RuntimeException {
    // 异常码
    private Integer errorCode;
    // 错误信息
    private String errorMessage;

    public BizException(BaseExceptionInterface baseExceptionInterface) {
        this.errorCode = baseExceptionInterface.getErrorCode();
        this.errorMessage = baseExceptionInterface.getErrorMessage();
    }

    public BizException(Integer errorCode, String errorMessage) {
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
    }
    public BizException( String errorMessage) {
        this.errorCode = 500;
        this.errorMessage = errorMessage;
    }
}