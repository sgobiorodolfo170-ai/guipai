package com.gsxi.trading.tradeinsight.util.dataTransformation;

import com.gsxi.trading.tradeinsight.entity.PlateMarketQuotation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/26
 * @description 板块行情数据转换工具类
 */
public class PlateDataConverter {

    /**
     * 将原始Map列表转换为实体类列表
     */
    public static List<PlateMarketQuotation> convertToEntityList(
            List<Map<String, Object>> mapList, LocalDate tradeDate) {

        List<PlateMarketQuotation> resultList = new ArrayList<>();
        if (mapList == null || mapList.isEmpty()) {
            return resultList;
        }

        for (Map<String, Object> map : mapList) {
            try {
                PlateMarketQuotation entity = PlateMarketQuotation.builder()
                        .tradeDate(tradeDate)
                        .plate(convertToString(map.get("板块")))
                        .increaseRate(convertToBigDecimal(map.get("涨跌幅")))
                        .totalVolume(convertToBigDecimal(map.get("总成交量")))
                        .totalTurnover(convertToBigDecimal(map.get("总成交额")))
                        .netInflow(convertToBigDecimal(map.get("净流入")))
                        .upCount(convertToInteger(map.get("上涨家数")))
                        .downCount(convertToInteger(map.get("下跌家数")))
                        .averagePrice(convertToBigDecimal(map.get("均价")))
                        .leadingStock(convertToString(map.get("领涨股")))
                        .leadingStockPrice(convertToBigDecimal(map.get("领涨股-最新价")))
                        .leadingStockIncrease(convertToBigDecimal(map.get("领涨股-涨跌幅")))
                        .build();
                resultList.add(entity);
            } catch (Exception e) {
                System.err.println("板块行情数据转换失败：" + map + "，错误：" + e.getMessage());
            }
        }
        return resultList;
    }

    // 复用之前的类型转换辅助方法
    private static String convertToString(Object obj) {
        return obj != null ? obj.toString() : null;
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

    private static Integer convertToInteger(Object obj) {
        if (obj == null) {
            return 0;
        }
        if (obj instanceof Number) {
            return ((Number) obj).intValue();
        }
        if (obj instanceof String) {
            return Integer.parseInt((String) obj);
        }
        throw new IllegalArgumentException("无法转换为Integer：" + obj);
    }
}
