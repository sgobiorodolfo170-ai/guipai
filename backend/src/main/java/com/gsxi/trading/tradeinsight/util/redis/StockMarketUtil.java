package com.gsxi.trading.tradeinsight.util.redis;

import com.gsxi.trading.tradeinsight.common.enums.RedisKeyConstant;

import java.util.Map;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/27
 * @description 股票市场分类工具（根据代码前缀判断所属市场）
 */
public class StockMarketUtil {
    /**
     * 根据股票代码获取对应的市场集合键
     * @param code 股票代码（如600000、300001、688001）
     * @return 市场集合键（如stock:realtime:market:sh）
     */
    public static String getMarketSetKey(String code) {
        if (code == null || code.length() < 3) {
            // 无效代码
            return null;
        }

        String prefix = code.substring(0, 3);
        if (prefix.startsWith("60")) {
            // 上证主板（60开头）
            return RedisKeyConstant.MARKET_SH;
        } else if (prefix.startsWith("30")) {
            // 创业板（300开头）
            return RedisKeyConstant.MARKET_SZ_CYB;
        } else if (prefix.startsWith("68")) {
            // 科创板（688开头）
            return RedisKeyConstant.MARKET_SH_KCB;
        }

        return null;
    }

    /**
     * 判断是否为有效交易股票（过滤退市股）
     * @param stockData 股票数据Map
     * @return true=有效（有最新价），false=无效（退市股）
     */
    public static boolean isValidStock(Map<String, Object> stockData) {
        Object latestPrice = stockData.get("最新价");
        // 退市股最新价为null
        return latestPrice != null;
    }
}
