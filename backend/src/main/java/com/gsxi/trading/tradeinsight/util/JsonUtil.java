package com.gsxi.trading.tradeinsight.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/15
 * @description JSON 工具类
 */
@Slf4j
public class JsonUtil {

    private static final ObjectMapper INSTANCE = new ObjectMapper();

    static {
        // 配置 JavaTimeModule
        JavaTimeModule javaTimeModule = new JavaTimeModule();
        javaTimeModule.addSerializer(LocalDateTime.class, new com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        javaTimeModule.addDeserializer(LocalDateTime.class, new com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        javaTimeModule.addSerializer(LocalDate.class, new com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        javaTimeModule.addDeserializer(LocalDate.class, new com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        javaTimeModule.addSerializer(LocalTime.class, new com.fasterxml.jackson.datatype.jsr310.ser.LocalTimeSerializer(DateTimeFormatter.ofPattern("HH:mm:ss")));
        javaTimeModule.addDeserializer(LocalTime.class, new com.fasterxml.jackson.datatype.jsr310.deser.LocalTimeDeserializer(DateTimeFormatter.ofPattern("HH:mm:ss")));

        INSTANCE.registerModule(javaTimeModule);
        INSTANCE.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        // 添加忽略未知字段的配置
        INSTANCE.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    }

    /**
     * 将对象转换为JSON字符串
     * @param obj 需要转换的对象
     * @return 转换后的JSON字符串，如果转换失败则返回对象的toString()结果
     */
    public static String toJsonString(Object obj) {
        try {
            // 使用Jackson ObjectMapper将对象序列化为JSON字符串
            return INSTANCE.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            // 如果JSON处理异常，则返回对象的默认字符串表示
            log.error("JSON序列化失败", e);
            return obj.toString();
        }
    }

    /**
     * 将JSON字符串转换为指定类型的对象
     * @param jsonString JSON字符串
     * @param clazz 目标类型
     * @param <T> 泛型类型
     * @return 转换后的对象，如果转换失败则返回null
     */
    public static <T> T parseObject(String jsonString, Class<T> clazz) {
        try {
            return INSTANCE.readValue(jsonString, clazz);
        } catch (JsonProcessingException e) {
            log.error("JSON反序列化失败: jsonString={}, clazz={}", jsonString, clazz.getName(), e);
            return null;
        }
    }

    /**
     * 将JSON字符串转换为指定类型的列表
     * @param jsonString JSON字符串
     * @param clazz 列表元素类型
     * @param <T> 泛型类型
     * @return 转换后的列表，如果转换失败则返回null
     */
    public static <T> List<T> parseArray(String jsonString, Class<T> clazz) {
        try {
            // 如果需要处理数组类型，也需要配置相应的类型引用
            com.fasterxml.jackson.core.type.TypeReference<java.util.List<T>> typeRef =
                    new com.fasterxml.jackson.core.type.TypeReference<java.util.List<T>>() {};
            return INSTANCE.readValue(jsonString, typeRef);
        } catch (Exception e) {
            log.error("JSON反序列化数组失败: jsonString={}, clazz={}", jsonString, clazz, e);
            return null;
        }
    }

}
