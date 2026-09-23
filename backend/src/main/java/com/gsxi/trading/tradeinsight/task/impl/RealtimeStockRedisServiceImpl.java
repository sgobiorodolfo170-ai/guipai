package com.gsxi.trading.tradeinsight.task.impl;

import com.gsxi.trading.tradeinsight.common.enums.RedisKeyConstant;
import com.gsxi.trading.tradeinsight.util.StockTimeUtil;
import com.gsxi.trading.tradeinsight.util.redis.StockMarketUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/27
 * @description 实时行情redis处理
 */
@Service
@RequiredArgsConstructor
public class RealtimeStockRedisServiceImpl {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    /**
     * 检查指定日期是否已有归档数据
     *
     * @param dateStr 日期字符串(yyyyMMdd格式)
     * @return 是否存在归档数据
     */
    public boolean hasArchiveData(String dateStr) {
        // 构造一个示例键来检查是否存在归档数据
        String sampleKey = RedisKeyConstant.AFTERMARKET_SNAPSHOT_PREFIX + dateStr + ":*";

        // 使用keys命令检查是否存在匹配的键
        Set<String> keys = redisTemplate.keys(RedisKeyConstant.AFTERMARKET_SNAPSHOT_PREFIX + dateStr + ":*");
        return !keys.isEmpty();
    }


    /**
     * 盘中更新：每5分钟存储最新实时行情（5分钟过期）
     */
    public void updateIntradayData(List<Map<String, Object>> realtimeList) {
        if (realtimeList == null || realtimeList.isEmpty()) {
            return;
        }

        int total = realtimeList.size();
        int success = 0;
        int fail = 0;

        for (Map<String, Object> stock : realtimeList) {
            try {
                // 过滤退市股（最新价为null）
                if (!StockMarketUtil.isValidStock(stock)) {
                    fail++;
                    continue;
                }

                String code = (String) stock.get("代码");
                if (code == null) {
                    continue;
                }

                // 存储股票实时数据（Hash结构）
                String intradayKey = RedisKeyConstant.INTRADAY_REALTIME_PREFIX + code;
                Map<String, Object> stockFields = convertToStockFields(stock);
                redisTemplate.opsForHash().putAll(intradayKey, stockFields);
                // 设置5分钟过期（每次更新重置）
                redisTemplate.expire(intradayKey, RedisKeyConstant.INTRADAY_EXPIRE_MINUTES, TimeUnit.MINUTES);

                // 加入对应市场集合
                String marketSetKey = StockMarketUtil.getMarketSetKey(code);
                if (marketSetKey != null) {
                    redisTemplate.opsForSet().add(marketSetKey, code);
                }

            } catch (Exception e) {
                fail++;
                System.err.println("盘中数据更新失败（代码：" + stock.get("代码") + "）：" + e.getMessage());
            }



        }
        System.out.println("盘中数据处理完成 - 总条数: " + total +
                ", 成功: " + success +
                ", 失败: " + fail);
    }

    /**
     * 盘后归档：独立调用接口获取数据并保存（留存30天）
     *
     */
    public void archiveAfterMarket(List<Map<String, Object>> afterMarketList) {
        if (afterMarketList == null || afterMarketList.isEmpty()) {
            System.out.println("盘后数据为空，跳过归档");
            return;
        }

        String dateStr = StockTimeUtil.getRecentTradingDay();

        for (Map<String, Object> stock : afterMarketList) {
            try {
                // 过滤退市股
                if (!StockMarketUtil.isValidStock(stock)) {
                    continue;
                }

                String code = (String) stock.get("代码");
                if (code == null) {
                    continue;
                }

                // 1. 转换为快照字段
                Map<String, Object> snapshotFields = convertToStockFields(stock);
                // 2. 存储盘后快照（带日期后缀）
                String aftermarketKey = RedisKeyConstant.AFTERMARKET_SNAPSHOT_PREFIX + dateStr + ":" + code;
                redisTemplate.opsForHash().putAll(aftermarketKey, snapshotFields);
                // 设置30天过期
                redisTemplate.expire(aftermarketKey, RedisKeyConstant.AFTERMARKET_EXPIRE_DAYS, TimeUnit.DAYS);

                // 3. 确保市场集合包含该代码（若盘中未收录）
                String marketSetKey = StockMarketUtil.getMarketSetKey(code);
                if (marketSetKey != null) {
                    redisTemplate.opsForSet().add(marketSetKey, code);
                }

            } catch (Exception e) {
                System.err.println("盘后归档失败（代码：" + stock.get("代码") + "）：" + e.getMessage());
            }
        }

        System.out.println("盘后归档完成，日期：" + dateStr + "，共" + afterMarketList.size() + "条数据");
    }

    /**
     * 转换原始数据为Redis Hash字段
     */
    private Map<String, Object> convertToStockFields(Map<String, Object> stock) {
        Map<String, Object> fields = new HashMap<>(22);

        // 基础信息
        fields.put("seq", stock.get("序号"));
        fields.put("code", stock.get("代码"));
        fields.put("name", stock.get("名称"));
        fields.put("latest_price", stock.get("最新价"));
        fields.put("change_percent", stock.get("涨跌幅"));
        fields.put("change_amount", stock.get("涨跌额"));

        // 交易数据
        fields.put("volume", stock.get("成交量"));
        fields.put("amount", stock.get("成交额"));
        fields.put("amplitude", stock.get("振幅"));
        fields.put("high", stock.get("最高"));
        fields.put("low", stock.get("最低"));
        fields.put("open", stock.get("今开"));
        fields.put("prev_close", stock.get("昨收"));
        fields.put("volume_ratio", stock.get("量比"));
        fields.put("turnover_rate", stock.get("换手率"));

        // 估值数据
        fields.put("pe", stock.get("市盈率-动态"));
        fields.put("pb", stock.get("市净率"));
        fields.put("total_market_value", stock.get("总市值"));
        fields.put("circulation_market_value", stock.get("流通市值"));

        // 其他数据
        fields.put("rise_speed", stock.get("涨速"));
        fields.put("five_min_change", stock.get("5分钟涨跌"));
        fields.put("sixty_day_change", stock.get("60日涨跌幅"));
        fields.put("ytd_change", stock.get("年初至今涨跌幅"));
        return fields;
    }

    // ------------------- 查询方法 -------------------

    /**
     * 获取指定市场的实时行情（盘中）
     */
    public List<Map<Object, Object>> getIntradayByMarket(String marketKey) {
        Set<Object> codes = redisTemplate.opsForSet().members(marketKey);
        if (codes == null) {
            return Collections.emptyList();
        }

        List<Map<Object, Object>> result = new ArrayList<>();
        for (Object code : codes) {
            String key = RedisKeyConstant.INTRADAY_REALTIME_PREFIX + code;
            Map<Object, Object> data = redisTemplate.opsForHash().entries(key);
            if (!data.isEmpty()) {
                result.add(data);
            }
        }
        return result;
    }

    /**
     * 获取指定日期的市场快照（盘后）
     */
    public List<Map<Object, Object>> getAftermarketByDateAndMarket(String dateStr, String marketKey) {
        Set<Object> codes = redisTemplate.opsForSet().members(marketKey);
        if (codes == null) {
            return Collections.emptyList();
        }

        List<Map<Object, Object>> result = new ArrayList<>();
        for (Object code : codes) {
            String key = RedisKeyConstant.AFTERMARKET_SNAPSHOT_PREFIX + dateStr + ":" + code;
            Map<Object, Object> data = redisTemplate.opsForHash().entries(key);
            if (!data.isEmpty()) {
                result.add(data);
            }
        }
        return result;
    }
}
