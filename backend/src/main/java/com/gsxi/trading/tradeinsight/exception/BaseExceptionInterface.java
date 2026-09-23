package com.gsxi.trading.tradeinsight.exception;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/15
 * @description 通用异常接口
 */
public interface BaseExceptionInterface {
    /**
     * 获取错误码
     *
     * @return 错误码
     */
    Integer getErrorCode();

    /**
     * 获取错误信息
     *
     * @return 错误信息
     */
    String getErrorMessage();
}
