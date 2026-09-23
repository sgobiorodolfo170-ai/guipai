package com.gsxi.trading.tradeinsight.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.CollectionType;
import com.gsxi.trading.tradeinsight.dto.TradeData;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/9/4
 * @description 用于JSON字段的序列化和反序列化
 */


@Converter
public class TradeDataListConverter implements AttributeConverter<List<TradeData>, String> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<TradeData> tradeDataList) {
        try {
            return objectMapper.writeValueAsString(tradeDataList);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert TradeData list to JSON", e);
        }
    }

    @Override
    public List<TradeData> convertToEntityAttribute(String json) {
        try {
            CollectionType listType = objectMapper.getTypeFactory()
                    .constructCollectionType(List.class, TradeData.class);
            return objectMapper.readValue(json, listType);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert JSON to TradeData list", e);
        }
    }
}