package com.gsxi.trading.tradeinsight.common.enums;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/27
 * @description Redis键名常量定义
 */
public class RedisKeyConstant {
    /**
     *    盘中实时数据键前缀（5分钟过期）
     */
    public static final String INTRADAY_REALTIME_PREFIX = "stock:realtime:intraday:";

    /**
     *     盘后快照键前缀（30天过期）
     */
    public static final String AFTERMARKET_SNAPSHOT_PREFIX = "stock:realtime:aftermarket:";

    /**
     * 市场代码集合键（上证）
     */
    public static final String MARKET_SH = "stock:realtime:market:sh";

    /**
     * 市场代码集合键（创业板）
     */
    public static final String MARKET_SZ_CYB = "stock:realtime:market:sz:cyb";

    /**
     *  市场代码集合键（科创板）
     */
    public static final String MARKET_SH_KCB = "stock:realtime:market:sh:kcb";

    /**
     *  盘中数据过期时间（分钟）
     */
    public static final long INTRADAY_EXPIRE_MINUTES = 5;

    /**
     *  盘后数据过期时间（天）
     */
    public static final long AFTERMARKET_EXPIRE_DAYS = 30;
}
