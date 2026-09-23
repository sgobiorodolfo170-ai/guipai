package com.gsxi.trading.tradeinsight.common.enums;

import com.gsxi.trading.tradeinsight.exception.BaseExceptionInterface;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/15
 * @description 响应异常码
 */
@Getter
@AllArgsConstructor
public enum ResponseCodeEnum implements BaseExceptionInterface {
    // ----------- 通用异常状态码 -----------
    SYSTEM_ERROR(1001, "系统异常"),

    // ----------- 业务异常状态码 -----------
    PRODUCT_NOT_FOUND(2001, "商品不存在"),
    ;

    // 异常码
    private Integer errorCode;
    // 错误信息
    private String errorMessage;
}
