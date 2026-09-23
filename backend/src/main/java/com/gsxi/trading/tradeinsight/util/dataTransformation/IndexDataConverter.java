package com.gsxi.trading.tradeinsight.util.dataTransformation;

import com.gsxi.trading.tradeinsight.entity.StockZhIndexDaily;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/26
 * @description 指数转换实体类
 */
public class IndexDataConverter {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * 转换指数日K原始数据为实体类列表
     */
    public static List<StockZhIndexDaily> convertToEntityList(
            List<Map<String, Object>> mapList, String symbol) {

        List<StockZhIndexDaily> resultList = new ArrayList<>();
        if (mapList == null || mapList.isEmpty()) {
            return resultList;
        }

        for (Map<String, Object> map : mapList) {
            try {
                StockZhIndexDaily entity = StockZhIndexDaily.builder()
                        .symbol(symbol)
                        .tradeDate(LocalDate.parse(map.get("日期").toString(), DATE_FORMATTER))
                        .open(convertToBigDecimal(map.get("开盘")))
                        .close(convertToBigDecimal(map.get("收盘")))
                        .high(convertToBigDecimal(map.get("最高")))
                        .low(convertToBigDecimal(map.get("最低")))
                        .volume(convertToBigDecimal(map.get("成交量")))
                        .amount(convertToBigDecimal(map.get("成交额")))
                        .change(convertToBigDecimal(map.get("涨跌幅")))
                        .turnoverRate(convertToBigDecimal(map.get("换手率")))
                        .amplitude(convertToBigDecimal(map.get("振幅")))
                        .priceChange(convertToBigDecimal(map.get("涨跌额")))
                        .build();
                resultList.add(entity);
            } catch (Exception e) {
                System.err.println("指数数据转换失败：" + map + "，错误：" + e.getMessage());
            }
        }
        return resultList;
    }

    private static BigDecimal convertToBigDecimal(Object obj) {
        if (obj == null) {
            return null;
        }
        if (obj instanceof Number) {
            return new BigDecimal(obj.toString());
        }
        if (obj instanceof String) {
            return new BigDecimal((String) obj);
        }
        throw new IllegalArgumentException("无法转换为BigDecimal：" + obj);
    }
}
