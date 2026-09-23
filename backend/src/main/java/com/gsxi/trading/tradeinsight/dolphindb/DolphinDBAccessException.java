package com.gsxi.trading.tradeinsight.dolphindb;

/**
 * DolphinDB 访问层统一运行时异常。
 *
 * @author gsxi
 */
public class DolphinDBAccessException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public DolphinDBAccessException(String message) {
        super(message);
    }

    public DolphinDBAccessException(String message, Throwable cause) {
        super(message, cause);
    }
}
