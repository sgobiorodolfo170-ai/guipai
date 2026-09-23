package com.gsxi.trading.tradeinsight.common.enums;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/25
 * @description 数据类型枚举
 */
public enum DataTypeEnum {
    /**
     * 持久化模块
     */
    LIMIT_UP("涨停板数据"),
    LIMIT_DOWN("跌停板数据"),
    PLATE_MARKET("板块行情数据"),
    INDEX("指数数据"),
    INDEX_DAILY("指数日K数据");

    private final String desc;
    DataTypeEnum(String desc) {
        this.desc = desc;
    }
    public String getDesc() {
        return desc;
    }
}



