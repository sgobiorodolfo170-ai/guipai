package com.gsxi.trading.tradeinsight.dto.response;

import com.gsxi.trading.tradeinsight.exception.BaseExceptionInterface;
import com.gsxi.trading.tradeinsight.exception.BizException;

import java.io.Serial;
import java.util.HashMap;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/15
 * @description 响应参数工具类
 */
public class AjaxResult extends HashMap<String, Object> {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 状态码
     */
    public static final String CODE_TAG = "code";

    /**
     * 返回内容
     */
    public static final String MSG_TAG = "msg";

    /**
     * 数据对象
     */
    public static final String DATA_TAG = "data";

    /**
     * 成功状态码
     */
    public static final int SUCCESS = 200;

    /**
     * 失败状态码
     */
    public static final int ERROR = 500;

    /**
     * 初始化一个新创建的 AjaxResult 对象，使其表示一个空消息。
     */
    public AjaxResult() {
    }

    /**
     * 初始化一个新创建的 AjaxResult 对象
     *
     * @param code 状态码
     * @param msg  返回内容
     */
    public AjaxResult(int code, String msg) {
        super.put(CODE_TAG, code);
        super.put(MSG_TAG, msg);
    }

    /**
     * 初始化一个新创建的 AjaxResult 对象
     *
     * @param code 状态码
     * @param msg  返回内容
     * @param data 数据对象
     */
    public AjaxResult(int code, String msg, Object data) {
        super.put(CODE_TAG, code);
        super.put(MSG_TAG, msg);
        if (data != null) {
            super.put(DATA_TAG, data);
        }
    }

    /**
     * 返回成功消息
     *
     * @return 成功消息
     */
    public static AjaxResult success() {
        return AjaxResult.success("操作成功");
    }

    /**
     * 返回成功数据
     *
     * @return 成功消息
     */
    public static AjaxResult success(Object data) {
        return AjaxResult.success("操作成功", data);
    }

    /**
     * 返回成功消息
     *
     * @param msg 返回内容
     * @return 成功消息
     */
    public static AjaxResult success(String msg) {
        return AjaxResult.success(msg, null);
    }

    /**
     * 返回成功消息
     *
     * @param msg  返回内容
     * @param data 数据对象
     * @return 成功消息
     */
    public static AjaxResult success(String msg, Object data) {
        return new AjaxResult(SUCCESS, msg, data);
    }

    /**
     * 返回错误消息
     *
     * @return 错误消息
     */
    public static AjaxResult error() {
        return AjaxResult.error("操作失败");
    }

    /**
     * 返回错误消息
     *
     * @param msg 返回内容
     * @return 错误消息
     */
    public static AjaxResult error(String msg) {
        return AjaxResult.error(msg, null);
    }

    /**
     * 返回错误消息
     *
     * @param msg  返回内容
     * @param data 数据对象
     * @return 错误消息
     */
    public static AjaxResult error(String msg, Object data) {
        return new AjaxResult(ERROR, msg, data);
    }

    /**
     * 返回错误消息
     *
     * @param code 状态码
     * @param msg  返回内容
     * @return 错误消息
     */
    public static AjaxResult error(int code, String msg) {
        return new AjaxResult(code, msg, null);
    }

    /**
     * 方便链式调用
     *
     * @param key   键
     * @param value 值
     * @return 数据对象
     */
    @Override
    public AjaxResult put(String key, Object value) {
        super.put(key, value);
        return this;
    }

    /**
     * 设置状态码
     *
     * @param code 状态码
     * @return AjaxResult
     */
    public AjaxResult code(int code) {
        return this.put(CODE_TAG, code);
    }

    /**
     * 设置返回消息
     *
     * @param msg 返回消息
     * @return AjaxResult
     */
    public AjaxResult msg(String msg) {
        return this.put(MSG_TAG, msg);
    }

    /**
     * 设置数据对象
     *
     * @param data 数据对象
     * @return AjaxResult
     */
    public AjaxResult data(Object data) {
        return this.put(DATA_TAG, data);
    }

    /**
     * 获取状态码
     *
     * @return 状态码
     */
    public int getCode() {
        return (int) this.get(CODE_TAG);
    }

    /**
     * 获取返回消息
     *
     * @return 返回消息
     */
    public String getMsg() {
        return (String) this.get(MSG_TAG);
    }

    /**
     * 获取数据对象
     *
     * @return 数据对象
     */
    public Object getData() {
        return this.get(DATA_TAG);
    }

    /**
     * 判断是否成功
     *
     * @return 是否成功
     */
    public boolean isSuccess() {
        return SUCCESS == this.getCode();
    }

    /**
     *  业务错误
     * @param bizException
     * @return
     */
    public static AjaxResult error(BizException bizException) {
        return new AjaxResult(bizException.getErrorCode(), bizException.getErrorMessage());
    }

    /**
     *  系统错误
     * @param baseExceptionInterface
     * @return
     */
    public static AjaxResult error(BaseExceptionInterface baseExceptionInterface) {
        return new AjaxResult(baseExceptionInterface.getErrorCode(), baseExceptionInterface.getErrorMessage());
    }
}
