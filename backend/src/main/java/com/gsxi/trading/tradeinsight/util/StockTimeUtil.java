package com.gsxi.trading.tradeinsight.util;

import lombok.extern.slf4j.Slf4j;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.Set;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/24
 * @description A股交易日期工具类
 */
@Slf4j
public class StockTimeUtil {
    // 测试模式开关
    private static boolean testMode = false;
    // 测试模式下的模拟时间
    private static LocalDateTime testTime;


    //todo: 临时解决时间问题,需要找到更加稳定的，判断盘中是否交易的情况

    // 维护法定定节假日列表
    private static final Set<LocalDate> HOLIDAYS = new HashSet<>();

    // 上午开盘时间
    private static final LocalTime MORNING_OPEN = LocalTime.of(9, 30);
    // 上午收盘时间
    private static final LocalTime MORNING_CLOSE = LocalTime.of(11, 30);
    // 下午开盘时间
    private static final LocalTime AFTERNOON_OPEN = LocalTime.of(13, 0);
    // 下午收盘时间
    private static final LocalTime AFTERNOON_CLOSE = LocalTime.of(15, 0);

    static {
        // 2025年节假日
        addHolidays(2025, 1, new int[]{1,2,3,4,5,6,7}); // 元旦
        addHolidays(2025, 2, new int[]{1,2,3,4,5,6,7}); // 春节
        addHolidays(2025, 4, new int[]{5,6,7}); // 清明
        addHolidays(2025, 5, new int[]{1,2,3,4,5}); // 劳动节
        addHolidays(2025, 6, new int[]{1,2,3}); // 端午
        addHolidays(2025, 10, new int[]{1,2,3,4,5,6,7}); // 国庆

        // 2026年节假日
        addHolidays(2026, 1, new int[]{1,2,3,4,5,6,7}); // 元旦
        addHolidays(2026, 2, new int[]{17,18,19,20,21,22,23}); // 春节
        addHolidays(2026, 4, new int[]{4,5,6}); // 清明
        addHolidays(2026, 5, new int[]{1,2,3,4,5}); // 劳动节
        addHolidays(2026, 6, new int[]{10,11,12}); // 端午
        addHolidays(2026, 10, new int[]{1,2,3,4,5,6,7}); // 国庆

        // 2027年节假日
        addHolidays(2027, 1, new int[]{1,2,3,4,5,6,7}); // 元旦
        addHolidays(2027, 2, new int[]{6,7,8,9,10,11,12}); // 春节
        addHolidays(2027, 4, new int[]{3,4,5}); // 清明
        addHolidays(2027, 5, new int[]{1,2,3,4,5}); // 劳动节
        addHolidays(2027, 5, new int[]{30,31}); // 端午(跨月)
        addHolidays(2027, 10, new int[]{1,2,3,4,5,6,7}); // 国庆

        // 2028年节假日
        addHolidays(2028, 1, new int[]{1,2,3,4,5,6,7}); // 元旦
        addHolidays(2028, 2, new int[]{25,26,27,28}); // 春节
        addHolidays(2028, 4, new int[]{3,4,5}); // 清明
        addHolidays(2028, 5, new int[]{1,2,3,4,5}); // 劳动节
        addHolidays(2028, 6, new int[]{18,19,20}); // 端午
        addHolidays(2028, 10, new int[]{1,2,3,4,5,6,7}); // 国庆
    }

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    /**
     * 日期格式化：将LocalDate对象转为yyyyMMdd字符串
     * @param date - 日期对象
     * @return 格式化后的日期字符串
     */
    public static String formatDate(LocalDate date) {
        return date.format(DATE_FORMATTER);
    }

    /**
     * 日期解析：将yyyyMMdd字符串转为LocalDate对象
     * @param dateStr - 格式为yyyyMMdd的字符串
     * @return 日期对象
     */
    public static LocalDate parseDate(String dateStr) {
        return LocalDate.parse(dateStr, DATE_FORMATTER);
    }

    /**
     * 测试专用：设置模拟时间
     * @param testMode 是否启用测试模式
     * @param time 模拟时间
     */
    public static void setTestMode(boolean testMode, LocalDateTime time) {
        StockTimeUtil.testMode = testMode;
        StockTimeUtil.testTime = time;
    }

    /**
     * 测试专用：获取当前时间（优先用模拟时间）
     * @return 当前时间
     */
    private static LocalDateTime now() {
        return testMode ? testTime : LocalDateTime.now();
    }


    /**
     * 批量添加节假日的辅助方法
     * @param year 年份
     * @param month 月份
     * @param days  日期
     */
    private static void addHolidays(int year, int month, int[] days) {
        for (int day : days) {
            HOLIDAYS.add(LocalDate.of(year, month, day));
        }
    }

    /**
     * 判断当前是否为交易日
     */
    public static boolean isTradingDay(LocalDate today) {
        // 周末不是交易日
        DayOfWeek dayOfWeek = today.getDayOfWeek();
        if (dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY) {
            return false;
        }
        // 法定节假日不是交易日
        if (HOLIDAYS.contains(today)) {
            return false;
        }
        // 检查是否有特殊休市情况（这里可以扩展）
        if (isSpecialNonTradingDay(today)) {
            return false;
        }
        return true;
    }

    /**
     * 判断当前是否为交易日
     */
    public static boolean isTradingDay() {
        LocalDate today = now().toLocalDate();
        // 周末不是交易日
        DayOfWeek dayOfWeek = today.getDayOfWeek();
        if (dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY) {
            return false;
        }
        // 法定节假日不是交易日
        if (HOLIDAYS.contains(today)) {
            return false;
        }
        // 检查是否有特殊休市情况（这里可以扩展）
        if (isSpecialNonTradingDay(today)) {
            return false;
        }
        return true;
    }

    /**
     * 判断是否为特殊休市日（如临时通知的休市）
     */
    private static boolean isSpecialNonTradingDay(LocalDate date) {
        // todo 实际应用中，这里应该从可靠来源获取特殊休市信息
        // 例如：从交易所API获取，或从数据库加载管理员维护的特殊休市日期
        return false; // 默认没有特殊休市
    }

    /**
     * 判断当前时间是否在交易时段内
     */
    public static boolean isInTradingTime() {
        if (!isTradingDay()) {
            return false;
        }

        LocalTime now = now().toLocalTime();

        // 上午交易时段
        boolean isMorningTrading = now.isAfter(MORNING_OPEN) && now.isBefore(MORNING_CLOSE);
        // 下午交易时段
        boolean isAfternoonTrading = now.isAfter(AFTERNOON_OPEN) && now.isBefore(AFTERNOON_CLOSE);

        return isMorningTrading || isAfternoonTrading;
    }

    /**
     * 判断是否已经闭盘
     */
    public static boolean isAfterTradingTime() {
        if (!isTradingDay()) {
            return true;
        }
        return now().toLocalTime().isAfter(AFTERNOON_CLOSE);
    }

    /**
     * 获取距离下一个交易时段的时间（毫秒）
     */
    public static long getMillisToNextTradingTime() {
        LocalDateTime now = now();

        // 如果是交易日
        if (isTradingDay()) {
            LocalTime currentTime = now.toLocalTime();

            // 上午开盘前
            if (currentTime.isBefore(MORNING_OPEN)) {
                return java.time.Duration.between(now,
                        LocalDateTime.of(now.toLocalDate(), MORNING_OPEN)).toMillis();
            }
            // 上午开盘后，午间休盘前
            else if (currentTime.isAfter(MORNING_OPEN) && currentTime.isBefore(MORNING_CLOSE)) {
                return java.time.Duration.between(now,
                        LocalDateTime.of(now.toLocalDate(), AFTERNOON_OPEN)).toMillis();
            }
            // 午间休市
            else if (currentTime.isAfter(MORNING_CLOSE) && currentTime.isBefore(AFTERNOON_OPEN)) {
                return java.time.Duration.between(now,
                        LocalDateTime.of(now.toLocalDate(), AFTERNOON_OPEN)).toMillis();
            }
            // 下午开盘后，下午交易时段内
            else if (currentTime.isAfter(AFTERNOON_OPEN) && currentTime.isBefore(AFTERNOON_CLOSE)) {
                 return java.time.Duration.between(now,
                        LocalDateTime.of(now.toLocalDate(), AFTERNOON_CLOSE)).toMillis();
            }
            // 下午收盘后，等待下一个交易日
            else if (currentTime.isAfter(AFTERNOON_CLOSE)) {
                return getMillisToNextTradingDay();
            }
        }
        // 非交易日，等待下一个交易日
        else {
            return getMillisToNextTradingDay();
        }

        return 600000;
    }

    /**
     * 获取距离下一个交易日的时间（毫秒）
     */
    private static long getMillisToNextTradingDay() {
        LocalDate nextDay = now().toLocalDate().plusDays(1);

        nextDay = getLocalDate(nextDay);

        return java.time.Duration.between(LocalDateTime.now(),
                LocalDateTime.of(nextDay, MORNING_OPEN)).toMillis();
    }

    /**
     * 获取距离收盘的时间（毫秒）
     */
    public static long getMillisToClose() {
        LocalDateTime now = now();
        LocalTime currentTime = now.toLocalTime();

        LocalDateTime closeTime;
        if (currentTime.isBefore(MORNING_CLOSE)) {
            closeTime = LocalDateTime.of(now.toLocalDate(), MORNING_CLOSE);
        } else {
            closeTime = LocalDateTime.of(now.toLocalDate(), AFTERNOON_CLOSE);
        }

        return java.time.Duration.between(now, closeTime).toMillis();
    }

    /**
     * 获取距离下一个交易日下午3点30分的时间（毫秒）
     * @return 距离下一个交易日下午3点30分的毫秒数
     */
    public static long getMillisToThreeThirtyPM() {
        LocalDateTime now = now();
        LocalTime threeThirtyPM = LocalTime.of(15, 1);

        // 如果当前是交易日且时间早于threeThirtyPM，则今天执行
        if (isTradingDay() && now.toLocalTime().isBefore(threeThirtyPM)) {
            LocalDateTime threeThirtyTime = LocalDateTime.of(now.toLocalDate(), threeThirtyPM);
            log.info("需要等待{}小时来执行任务！",java.time.Duration.between(now, threeThirtyTime).toMillis() /1000/60/60);
            return java.time.Duration.between(now, threeThirtyTime).toMillis();
        } else {
            // 否则等待到下一个交易日的下午3点30分
            LocalDate nextDay = now.toLocalDate().plusDays(1);

            nextDay = getLocalDate(nextDay);

            LocalDateTime nextThreeThirty = LocalDateTime.of(nextDay, threeThirtyPM);
            log.info("需要等待{}小时来执行任务！",java.time.Duration.between(now, nextThreeThirty).toMillis()/1000/60/60);
            return java.time.Duration.between(now, nextThreeThirty).toMillis();
        }
    }

    /**
     * 获取下一个交易日的日期
     * @param nextDay 下一个交易日的日期
     * @return 下一个交易日的日期
     */
    private static LocalDate getLocalDate(LocalDate nextDay) {
        while (true) {
            DayOfWeek dayOfWeek = nextDay.getDayOfWeek();
            if (dayOfWeek != DayOfWeek.SATURDAY && dayOfWeek != DayOfWeek.SUNDAY &&
                    !HOLIDAYS.contains(nextDay) && !isSpecialNonTradingDay(nextDay)) {
                break;
            }
            nextDay = nextDay.plusDays(1);
        }
        return nextDay;
    }

    /**
     * 获取今天的日期，若今天非交易日则返回最近的上一个交易日,早于9.15也会返回上个交易日
     * @return 最近交易日（格式yyyyMMdd）
     */
    public static String getRecentTradingDay() {
        LocalDate currentDate = now().toLocalDate();
        LocalTime currentTime = LocalTime.now();
        String currentDateStr = formatDate(currentDate);

        // 若今天是交易日，且当前时间晚于9:15，直接返回
        if (isTradingDay(currentDate) && currentTime.isAfter(LocalTime.of(9, 15))) {
            return currentDateStr;
        }


        // 今天非交易日，往前追溯最近的交易日
        LocalDate tempDate = currentDate;
        while (true) {
            tempDate = tempDate.minusDays(1);
            String tempDateStr = formatDate(tempDate);
            if (isTradingDay(tempDate)) {
                return tempDateStr;
            }
        }
    }




}
