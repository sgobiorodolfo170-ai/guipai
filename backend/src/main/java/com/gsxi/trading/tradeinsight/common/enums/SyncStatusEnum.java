package com.gsxi.trading.tradeinsight.common.enums;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/25
 * @description 同步状态枚举
 */
public enum SyncStatusEnum {
    /**
     * 状态码
     */
    INIT(0, "初始"),
    SUCCESS(1, "成功"),
    FAIL(2, "失败"),
    SKIPPED(3, "跳过");

    private final int code;
    private final String desc;
    SyncStatusEnum(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
    public int getCode() {
        return code;
    }
}