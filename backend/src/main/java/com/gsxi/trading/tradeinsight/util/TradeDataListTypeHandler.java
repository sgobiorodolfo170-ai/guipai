package com.gsxi.trading.tradeinsight.util;


import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.gsxi.trading.tradeinsight.dto.TradeData;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedJdbcTypes;
import org.apache.ibatis.type.MappedTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/9/4
 * @description TradeData列表类型处理器
 */
@MappedTypes(List.class)
@MappedJdbcTypes(JdbcType.VARCHAR)
public class TradeDataListTypeHandler extends BaseTypeHandler<List<TradeData>> {

    private static final Logger logger = LoggerFactory.getLogger(TradeDataListTypeHandler.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    static {
        // 注册JavaTimeModule以支持LocalDate等Java 8时间类型
        objectMapper.registerModule(new JavaTimeModule());

        // 注册自定义的LocalDate反序列化器来处理数组格式的日期
        SimpleModule module = new SimpleModule();
        module.addDeserializer(LocalDate.class, new LocalDateDeserializer());
        objectMapper.registerModule(module);

        // 允许解析非标准JSON格式
        objectMapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true);
        objectMapper.configure(JsonParser.Feature.ALLOW_SINGLE_QUOTES, true);
    }

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, List<TradeData> parameter, JdbcType jdbcType) throws SQLException {
        try {
            String json = objectMapper.writeValueAsString(parameter);
            logger.debug("Serializing TradeData list to JSON: {}", json);
            ps.setString(i, json);
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize TradeData list to JSON", e);
            throw new SQLException("Failed to serialize TradeData list to JSON", e);
        }
    }

    @Override
    public List<TradeData> getNullableResult(ResultSet rs, String columnName) throws SQLException {
        String json = rs.getString(columnName);
        logger.debug("Deserializing TradeData list from JSON column {}: {}", columnName, json);
        return parseJson(json);
    }

    @Override
    public List<TradeData> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        String json = rs.getString(columnIndex);
        logger.debug("Deserializing TradeData list from JSON column index {}: {}", columnIndex, json);
        return parseJson(json);
    }

    @Override
    public List<TradeData> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        String json = cs.getString(columnIndex);
        logger.debug("Deserializing TradeData list from CallableStatement column index {}: {}", columnIndex, json);
        return parseJson(json);
    }

    private List<TradeData> parseJson(String json) throws SQLException {
        logger.debug("Attempting to parse JSON: {}", json);
        if (json == null || json.isEmpty()) {
            logger.debug("JSON is null or empty, returning null");
            return null;
        }

        try {
            List<TradeData> result = objectMapper.readValue(
                json,
                objectMapper.getTypeFactory().constructCollectionType(List.class, TradeData.class)
            );
            logger.debug("Successfully deserialized TradeData list, size: {}", result != null ? result.size() : 0);
            if (result != null) {
                for (int i = 0; i < result.size(); i++) {
                    TradeData data = result.get(i);
                    logger.debug("TradeData[{}]: tradeType={}, price={}, amount={}, total={}, klineIndex={}, tradeDate={}",
                        i, data.getTradeType(), data.getPrice(), data.getAmount(), data.getTotal(), data.getKlineIndex(), data.getTradeDate());
                }
            }
            return result;
        } catch (JsonProcessingException e) {
            logger.error("Failed to deserialize JSON to TradeData list: {}", json, e);
            throw new SQLException("Failed to deserialize JSON to TradeData list: " + json, e);
        } catch (Exception e) {
            logger.error("Unexpected error deserializing JSON to TradeData list: {}", json, e);
            throw new SQLException("Unexpected error deserializing JSON to TradeData list: " + json, e);
        }
    }

    /**
     * 自定义LocalDate反序列化器，支持处理数组格式的日期 [year, month, day]
     */
    public static class LocalDateDeserializer extends JsonDeserializer<LocalDate> {
        @Override
        public LocalDate deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            logger.debug("Deserializing LocalDate, current token: {}, text: {}", p.getCurrentToken(), p.getText());
            // 首先尝试按照数组格式解析
            if (p.isExpectedStartArrayToken()) {
                logger.debug("Parsing LocalDate as array");
                int year = p.nextIntValue(0);
                int month = p.nextIntValue(0);
                int day = p.nextIntValue(0);
                p.nextToken(); // 跳过结束数组标记
                LocalDate date = LocalDate.of(year, month, day);
                logger.debug("Parsed LocalDate from array: {}", date);
                return date;
            } else {
                // 如果不是数组，则使用默认的字符串解析
                String dateString = p.getValueAsString();
                logger.debug("Parsing LocalDate as string: {}", dateString);
                if (dateString != null && !dateString.isEmpty()) {
                    // 尝试不同的日期格式
                    try {
                        LocalDate date = LocalDate.parse(dateString);
                        logger.debug("Parsed LocalDate from string: {}", date);
                        return date;
                    } catch (Exception e) {
                        logger.warn("Failed to parse LocalDate from string: {}", dateString, e);
                        // 如果解析失败，返回null
                        return null;
                    }
                }
                logger.debug("LocalDate string is null or empty");
                return null;
            }
        }
    }
}
