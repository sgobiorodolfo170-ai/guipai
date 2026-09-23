package com.gsxi.trading.tradeinsight.dolphindb;

import org.springframework.jdbc.core.BeanPropertyRowMapper;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;

/**
 * DolphinDB JDBC 结果集 → Bean 行映射器。
 *
 * <p>继承 {@link BeanPropertyRowMapper}，复用其“列名(下划线) → 属性(驼峰)”自动匹配能力，
 * 重写取值逻辑以通过 {@link ValueConverter} 做健壮的类型转换，
 * 规避 DolphinDB JDBC 对 LocalDate/BigDecimal 等类型映射不确定的问题。</p>
 *
 * @author gsxi
 */
public class DolphinDBRowMapper<T> extends BeanPropertyRowMapper<T> {

    public DolphinDBRowMapper(Class<T> mappedClass) {
        super(mappedClass);
        // DolphinDB 列名统一小写下划线，开启驼峰映射
        setPrimitivesDefaultedForNullValue(true);
    }

    @Override
    protected Object getColumnValue(ResultSet rs, int index, Class<?> paramType) throws SQLException {
        ResultSetMetaData meta = rs.getMetaData();
        // 统一以 Object 取值后转换，不依赖驱动对 java.time / BigDecimal 的原生支持
        Object value = rs.getObject(index);
        try {
            return ValueConverter.convert(value, paramType);
        } catch (Exception e) {
            // 转换失败返回 null，避免单字段异常导致整行读取失败
            return null;
        }
    }
}
