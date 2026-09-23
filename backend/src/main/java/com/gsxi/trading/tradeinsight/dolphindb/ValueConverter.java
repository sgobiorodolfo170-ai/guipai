package com.gsxi.trading.tradeinsight.dolphindb;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;

/**
 * DolphinDB 结果值通用转换工具。
 * 兼容 JDBC ResultSet 取值与 Java API BasicTable 取值两种来源，
 * 将任意运行期取到的值安全映射为 Java 目标类型。
 *
 * <p>说明：DolphinDB 不支持 BigDecimal（JDBC 会转成 DOUBLE），
 * BigDecimal 列在 DolphinDB 中以 DOUBLE 存储，读取时按需转回 BigDecimal。</p>
 *
 * @author gsxi
 */
public final class ValueConverter {

    /** DolphinDB DATE 字符串格式：2025.09.04 */
    public static final DateTimeFormatter DDB_DATE = DateTimeFormatter.ofPattern("yyyy.MM.dd");
    /** DolphinDB TIMESTAMP/DATETIME 字符串格式：2025.09.04T09:30:00.000 */
    public static final DateTimeFormatter DDB_DATETIME = DateTimeFormatter.ofPattern("yyyy.MM.dd'T'HH:mm:ss.SSS");
    public static final DateTimeFormatter DDB_DATETIME_SHORT = DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm:ss");
    /** LocalTime 字符串格式：HH:mm:ss */
    public static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm:ss");

    private ValueConverter() {
    }

    public static LocalDate toLocalDate(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDate d) {
            return d;
        }
        if (value instanceof java.sql.Date d) {
            return d.toLocalDate();
        }
        if (value instanceof Date d) {
            return new Timestamp(d.getTime()).toLocalDateTime().toLocalDate();
        }
        if (value instanceof LocalDateTime ldt) {
            return ldt.toLocalDate();
        }
        String s = value.toString().trim();
        if (s.isEmpty()) {
            return null;
        }
        // 兼容 ISO 与 DolphinDB 两种格式
        try {
            return LocalDate.parse(s, DDB_DATE);
        } catch (Exception ignored) {
            try {
                return LocalDate.parse(s.length() >= 10 ? s.substring(0, 10) : s);
            } catch (Exception e) {
                return null;
            }
        }
    }

    public static LocalDateTime toLocalDateTime(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDateTime ldt) {
            return ldt;
        }
        if (value instanceof Timestamp ts) {
            return ts.toLocalDateTime();
        }
        if (value instanceof java.sql.Date d) {
            return d.toLocalDate().atStartOfDay();
        }
        if (value instanceof Date d) {
            return new Timestamp(d.getTime()).toLocalDateTime();
        }
        String s = value.toString().trim();
        if (s.isEmpty()) {
            return null;
        }
        try {
            return LocalDateTime.parse(s, DDB_DATETIME);
        } catch (Exception ignored) {
            try {
                return LocalDateTime.parse(s, DDB_DATETIME_SHORT);
            } catch (Exception ignored2) {
                return toLocalDate(s) != null ? toLocalDate(s).atStartOfDay() : null;
            }
        }
    }

    public static LocalTime toLocalTime(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalTime lt) {
            return lt;
        }
        if (value instanceof java.sql.Time t) {
            return t.toLocalTime();
        }
        String s = value.toString().trim();
        if (s.isEmpty()) {
            return null;
        }
        // 形如 09:26:00 或 09:26:00.000
        if (s.length() >= 8) {
            try {
                return LocalTime.parse(s.substring(0, 8), TIME_FMT);
            } catch (Exception ignored) {
            }
        }
        try {
            return LocalTime.parse(s);
        } catch (Exception e) {
            return null;
        }
    }

    public static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        if (value instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        String s = value.toString().trim();
        if (s.isEmpty()) {
            return null;
        }
        try {
            return new BigDecimal(s);
        } catch (Exception e) {
            return null;
        }
    }

    public static Integer toInteger(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number n) {
            return n.intValue();
        }
        String s = value.toString().trim();
        if (s.isEmpty()) {
            return null;
        }
        try {
            return Integer.valueOf(s);
        } catch (Exception e) {
            try {
                return (int) Double.parseDouble(s);
            } catch (Exception ex) {
                return null;
            }
        }
    }

    public static Long toLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number n) {
            return n.longValue();
        }
        String s = value.toString().trim();
        if (s.isEmpty()) {
            return null;
        }
        try {
            return Long.valueOf(s);
        } catch (Exception e) {
            try {
                return (long) Double.parseDouble(s);
            } catch (Exception ex) {
                return null;
            }
        }
    }

    public static Double toDouble(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number n) {
            return n.doubleValue();
        }
        String s = value.toString().trim();
        if (s.isEmpty()) {
            return null;
        }
        try {
            return Double.parseDouble(s);
        } catch (Exception e) {
            return null;
        }
    }

    public static Float toFloat(Object value) {
        Double d = toDouble(value);
        return d == null ? null : d.floatValue();
    }

    public static String toString(Object value) {
        return value == null ? null : value.toString();
    }

    /**
     * 按目标类型统一转换。
     */
    @SuppressWarnings("unchecked")
    public static Object convert(Object value, Class<?> target) {
        if (value == null) {
            return null;
        }
        if (target.isAssignableFrom(value.getClass())) {
            return value;
        }
        if (target == LocalDate.class) return toLocalDate(value);
        if (target == LocalDateTime.class) return toLocalDateTime(value);
        if (target == LocalTime.class) return toLocalTime(value);
        if (target == BigDecimal.class) return toBigDecimal(value);
        if (target == Integer.class || target == int.class) {
            Integer v = toInteger(value);
            return target == int.class && v == null ? 0 : v;
        }
        if (target == Long.class || target == long.class) {
            Long v = toLong(value);
            return target == long.class && v == null ? 0L : v;
        }
        if (target == Double.class || target == double.class) {
            Double v = toDouble(value);
            return target == double.class && v == null ? 0d : v;
        }
        if (target == Float.class || target == float.class) {
            Float v = toFloat(value);
            return target == float.class && v == null ? 0f : v;
        }
        if (target == Boolean.class || target == boolean.class) {
            String s = value.toString().trim();
            boolean b = "1".equals(s) || "true".equalsIgnoreCase(s) || "1b".equals(s);
            return target == boolean.class ? b : b;
        }
        if (target == String.class) return value.toString();
        return value;
    }
}
