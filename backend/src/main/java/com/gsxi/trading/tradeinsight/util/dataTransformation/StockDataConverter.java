package com.gsxi.trading.tradeinsight.util.dataTransformation;

import com.gsxi.trading.tradeinsight.entity.StockLimitPool;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/25
 * @description 涨停板数据转换工具
 */
public class StockDataConverter {
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HHmmss");

    /**
     * 转换原始数据为实体类列表
     * @param mapList 原始数据列表
     * @param tradeDate 交易日期
     * @param dataType 数据类型：LIMIT_UP或LIMIT_DOWN
     */
    public static List<StockLimitPool> convertToEntityList(
            List<Map<String, Object>> mapList,
            LocalDate tradeDate,
            String dataType) {

        List<StockLimitPool> resultList = new ArrayList<>();
        if (mapList == null || mapList.isEmpty()) {
            return resultList;
        }

        for (Map<String, Object> map : mapList) {
            try {
                StockLimitPool.StockLimitPoolBuilder builder = StockLimitPool.builder()
                        .dataType(dataType)
                        .tradeDate(tradeDate)
                        .stockCode(convertToString(map.get("代码")))
                        .stockName(convertToString(map.get("名称")))
                        .industry(convertToString(map.get("所属行业")))
                        .increaseRate(convertToBigDecimal(map.get("涨跌幅")))
                        .latestPrice(convertToBigDecimal(map.get("最新价")))
                        .turnover(convertToLong(map.get("成交额")))
                        .circulationMarketValue(convertToBigDecimal(map.get("流通市值")))
                        .totalMarketValue(convertToBigDecimal(map.get("总市值")))
                        .turnoverRate(convertToBigDecimal(map.get("换手率")))
                        .lastLimitTime(convertToLocalTime(map.get("最后封板时间")));

                // 区分涨停/跌停的差异化字段
                if ("LIMIT_UP".equals(dataType)) {
                    // 涨停特有字段
                    builder.firstLimitTime(convertToLocalTime(map.get("首次封板时间")))
                            .limitStats(convertToString(map.get("涨停统计")))
                            .limitFunds(convertToLong(map.get("封板资金")))
                            .continuousLimit(convertToInteger(map.get("连板数")))
                            .blastTimes(convertToInteger(map.get("炸板次数")));
                } else if ("LIMIT_DOWN".equals(dataType)) {
                    // 跌停特有字段
                    builder.dynamicPe(convertToBigDecimal(map.get("动态市盈率")))
                            .limitTurnover(convertToLong(map.get("板上成交额")))
                            .limitFunds(convertToLong(map.get("封单资金")))
                            .continuousLimit(convertToInteger(map.get("连续跌停")))
                            .blastTimes(convertToInteger(map.get("开板次数")));
                }

                resultList.add(builder.build());
            } catch (Exception e) {
                System.err.println("数据转换失败（" + dataType + "）：" + map + "，错误：" + e.getMessage());
            }
        }
        return resultList;
    }

    // 辅助转换方法
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

    private static Long convertToLong(Object obj) {
        if (obj == null) {
            return null;
        }
        if (obj instanceof Number) {
            return ((Number) obj).longValue();
        }
        if (obj instanceof String) {
            return Long.parseLong((String) obj);
        }
        throw new IllegalArgumentException("无法转换为Long：" + obj);
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

    private static LocalTime convertToLocalTime(Object obj) {
        if (obj == null) {
            return null;
        }
        String timeStr = obj.toString();
        if (timeStr.length() != 6) {
            // 格式错误时返回null
            return null;
        }
        return LocalTime.parse(timeStr, TIME_FORMATTER);
    }
}
