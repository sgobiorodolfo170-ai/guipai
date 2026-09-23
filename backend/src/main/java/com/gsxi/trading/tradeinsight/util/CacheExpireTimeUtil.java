package com.gsxi.trading.tradeinsight.util;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.TimeUnit;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/24
 * @description 缓存时间工具类
 */
public class CacheExpireTimeUtil {
    /**
     * 下午4点的小时数 ，从4点后，缓存时间将保留到第二天
     */
    private static final int CUTOFF_HOUR = 16;

    /**
     * 第二天目标时间的小时数
     */
    private static final int TARGET_HOUR = 9;

    /**
     * 计算缓存过期时间
     * 如果当前时间在下午4点之后，缓存将保留到第二天9点
     * 否则使用默认过期时间
     *
     * @param defaultExpire 默认过期时间
     * @param unit 时间单位
     * @return 实际应该使用的过期时间（秒）
     */
    public static long calculateExpireTime(long defaultExpire, TimeUnit unit) {
        LocalDateTime now = LocalDateTime.now();

        // 如果当前时间在下午4点之后
        if (now.getHour() >= CUTOFF_HOUR) {
            // 计算到第二天8点的秒数
            LocalDateTime nextDayTarget = now.plusDays(1)
                    .withHour(TARGET_HOUR)
                    .withMinute(0)
                    .withSecond(0)
                    .withNano(0);
            return ChronoUnit.SECONDS.between(now, nextDayTarget);
        } else {
            // 转换默认时间为秒
            return unit.toSeconds(defaultExpire);
        }
    }
}
