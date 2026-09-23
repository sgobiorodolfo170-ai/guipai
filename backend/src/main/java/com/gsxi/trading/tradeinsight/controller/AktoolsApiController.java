package com.gsxi.trading.tradeinsight.controller;

import com.gsxi.trading.tradeinsight.aspect.ApiOperationLog;
import com.gsxi.trading.tradeinsight.dto.request.StockHistoryRequest;
import com.gsxi.trading.tradeinsight.dto.request.StockMinuteRequest;
import com.gsxi.trading.tradeinsight.dto.response.AjaxResult;
import com.gsxi.trading.tradeinsight.service.AktoolsApiService;
import com.gsxi.trading.tradeinsight.util.CacheExpireTimeUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * AKTOOLS API 控制器
 *
 * @author Kiro
 * @version 1.0
 * @date 2025-08-19
 * @description 提供基于AKTOOLS的股票数据查询接口
 */
@Slf4j
@RestController
@RequestMapping("/api/aktools")
@RequiredArgsConstructor
@Validated
public class AktoolsApiController {

    private final AktoolsApiService aktoolsApiService;
    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * 获取全市场A股实时行情
     *
     * @return 实时行情数据
     */
    @GetMapping("/stock/spot")
    @ApiOperationLog(description = "获取全市场A股实时行情")
    public AjaxResult getStockSpotData() {
        String redisKey = "aktools:stock:spot";
        List<Map<String, Object>> cachedData = (List<Map<String, Object>>) redisTemplate.opsForValue().get(redisKey);
        if (cachedData != null) {
            return AjaxResult.success("获取实时行情成功(缓存)", cachedData);
        }
        List<Map<String, Object>> data = aktoolsApiService.getStockSpotData();
        long expireSeconds = CacheExpireTimeUtil.calculateExpireTime(60, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set(redisKey, data, expireSeconds, TimeUnit.SECONDS);
        return AjaxResult.success("获取实时行情成功");
    }

    /**
     * 获取单只股票历史日/周/月线数据
     *
     * @param request 查询请求参数
     * @return 历史数据
     */
    @GetMapping("/stock/history")
    @ApiOperationLog(description = "获取股票历史数据")
    public AjaxResult getStockHistoryData(@Valid StockHistoryRequest request) {
        String redisKey = "aktools:stock:history:" + request.getSymbol() + ":" + request.getPeriod() + ":" + request.getAdjust();
        List<Map<String, Object>> cachedData = (List<Map<String, Object>>) redisTemplate.opsForValue().get(redisKey);
        if (cachedData != null) {
            return AjaxResult.success("获取历史数据成功(缓存)", cachedData);
        }
        List<Map<String, Object>> data = aktoolsApiService.getStockHistoryData(request);
        long expireSeconds = CacheExpireTimeUtil.calculateExpireTime(300, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set(redisKey, data, expireSeconds, TimeUnit.SECONDS);
        return AjaxResult.success("获取历史数据成功", data);
    }

    /**
     * 获取股票分钟级K线数据
     *
     * @param request 查询请求参数
     * @return 分钟级K线数据
     */
    @GetMapping("/stock/minute")
    @ApiOperationLog(description = "获取股票分钟级K线数据")
    public AjaxResult getStockMinuteData(@Valid StockMinuteRequest request) {
        String redisKey = "aktools:stock:minute:" + request.getSymbol() + ":" + request.getPeriod();
        List<Map<String, Object>> cachedData = (List<Map<String, Object>>) redisTemplate.opsForValue().get(redisKey);
        if (cachedData != null) {
            return AjaxResult.success("获取分钟级数据成功(缓存)", cachedData);
        }
        List<Map<String, Object>> data = aktoolsApiService.getStockMinuteData(request);
        long expireSeconds = CacheExpireTimeUtil.calculateExpireTime(60, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set(redisKey, data, expireSeconds, TimeUnit.SECONDS);
        return AjaxResult.success("获取分钟级数据成功", data);
    }

    /**
     * 获取个股基础信息
     *
     * @param symbol 股票代码
     * @return 个股基础信息
     */
    @GetMapping("/stock/info")
    @ApiOperationLog(description = "获取个股基础信息")
    public AjaxResult getStockInfo(
            @RequestParam @NotBlank(message = "股票代码不能为空") String symbol) {
        String redisKey = "aktools:stock:info:" + symbol;
        List<Map<String, Object>> cachedData = (List<Map<String, Object>>) redisTemplate.opsForValue().get(redisKey);
        if (cachedData != null) {
            return AjaxResult.success("获取个股信息成功(缓存)", cachedData);
        }
        List<Map<String, Object>> data = aktoolsApiService.getStockInfo(symbol);
        long expireSeconds = CacheExpireTimeUtil.calculateExpireTime(10000, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set(redisKey, data, expireSeconds, TimeUnit.SECONDS);
        return AjaxResult.success("获取个股信息成功", data);
    }


    /**
     * 获取十大股东持股明细
     * @param date 财报截止日（如 20230930）
     * @param indicator 股东类型，格式如 "个人", "基金", "QFII", "社保", "券商", "信托"
     * @param symbol 持股变动，格式如 "新进", "增加", "不变", "减少"
     * @return 十大股东持股明细
     */
    @GetMapping("/stock/holding")
    @ApiOperationLog(description = "获取十大股东持股明细")
    public AjaxResult getStockHoldingDetail(
            @RequestParam @NotBlank(message = "财报日期不能为空") String date,
            @RequestParam(required = false) String indicator,
            @RequestParam(required = false) String symbol) {
        String redisKey = "aktools:stock:holding:" + date + ":" + (indicator != null ? indicator : "") + ":" + (symbol != null ? symbol : "");
        List<Map<String, Object>> cachedData = (List<Map<String, Object>>) redisTemplate.opsForValue().get(redisKey);
        if (cachedData != null) {
            return AjaxResult.success("获取股东持股明细成功(缓存)", cachedData);
        }
        List<Map<String, Object>> data = aktoolsApiService.getStockHoldingDetail(date, indicator, symbol);
        long expireSeconds = CacheExpireTimeUtil.calculateExpireTime(10000, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set(redisKey, data, expireSeconds, TimeUnit.SECONDS);
        return AjaxResult.success("获取股东持股明细成功", data);
    }


    /**
     * 获取当日涨停池
     * @param date 涨停日期 如20250819 只能获取近期数据
     * @return 当日涨停池
     */
    @GetMapping("/stock/limit")
    @ApiOperationLog(description = "获取当日涨停池")
    public AjaxResult getStockLimitPool(
            @RequestParam @NotBlank(message = "涨停日期不能为空") String date) {
        String redisKey = "aktools:stock:limit:" + date;
        List<Map<String, Object>> cachedData = (List<Map<String, Object>>) redisTemplate.opsForValue().get(redisKey);
        if (cachedData != null) {
            return AjaxResult.success("获取涨停池成功(缓存)", cachedData);
        }
        List<Map<String, Object>> data = aktoolsApiService.getStockLimitPool(date);
        long expireSeconds = CacheExpireTimeUtil.calculateExpireTime(30, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set(redisKey, data, expireSeconds, TimeUnit.SECONDS);
        return AjaxResult.success("获取涨停池成功", data);
    }

    /**
     * 获取当日跌停池
     * @param date 跌停日期 如20250819 只能获取近期数据
     * @return 当日跌停池
     */
    @GetMapping("/stock/drop")
    @ApiOperationLog(description = "获取当日跌停池")
    public AjaxResult getStockDropPool(
            @RequestParam @NotBlank(message = "跌停日期不能为空") String date) {
        String redisKey = "aktools:stock:drop:" + date;
        List<Map<String, Object>> cachedData = (List<Map<String, Object>>) redisTemplate.opsForValue().get(redisKey);
        if (cachedData != null) {
            return AjaxResult.success("获取跌停池成功(缓存)", cachedData);
        }
        List<Map<String, Object>> data = aktoolsApiService.getStockDropPool(date);
        long expireSeconds = CacheExpireTimeUtil.calculateExpireTime(60, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set(redisKey, data, expireSeconds, TimeUnit.SECONDS);
        return AjaxResult.success("获取跌停池成功", data);
    }


    /**
     * 板块行业一览表
     * @return 限量:单次返回当前时刻同花顺行业一览表
     */
    @GetMapping("/stock/industry")
    @ApiOperationLog(description = "板块行业一览表")
    public AjaxResult getStockIndustry() {
        String redisKey = "aktools:stock:industry";
        List<Map<String, Object>> cachedData = (List<Map<String, Object>>) redisTemplate.opsForValue().get(redisKey);
        if (cachedData != null) {
            return AjaxResult.success("获取板块行业一览表成功(缓存)", cachedData);
        }
        List<Map<String, Object>> data = aktoolsApiService.getStockIndustry();
        long expireSeconds = CacheExpireTimeUtil.calculateExpireTime(60, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set(redisKey, data, expireSeconds, TimeUnit.SECONDS);
        return AjaxResult.success("获取板块行业一览表成功", data);
    }


    /**
     * 昨天涨停板的表现
     * @param date 涨停日期 如20250819
     * @return 昨日涨停池
     */
    @GetMapping("/stock/ztPoolPrevious")
    public AjaxResult getStockZtPoolPrevious(@RequestParam @NotBlank(message = "涨停日期不能为空") String date) {
        String redisKey = "aktools:stock:ztPoolPrevious:" + date;
        List<Map<String, Object>> cachedData = (List<Map<String, Object>>) redisTemplate.opsForValue().get(redisKey);
        if (cachedData != null) {
            return AjaxResult.success("获取昨日涨停板成功(缓存)", cachedData);
        }
        List<Map<String, Object>> data = aktoolsApiService.getZtPoolPrevious(date);
        long expireSeconds = CacheExpireTimeUtil.calculateExpireTime(60, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set(redisKey, data, expireSeconds, TimeUnit.SECONDS);
        return AjaxResult.success("获取昨日涨停板成功", data);
    }

    /**
     * 获取指数数据
     *
     * @param symbol symbol="上证系列指数"；choice of {"沪深重要指数", "上证系列指数", "深证系列指数", "指数成份", "中证系列指数"}
     *  @return 指数数据
     */
    @GetMapping("/stock/indexSpot")
    public AjaxResult getStockIndexSpot(
            @RequestParam @NotBlank(message = "指数代码不能为空") String symbol) {
        //入参检查
        if (!"沪深重要指数".equals(symbol) && !"上证系列指数".equals(symbol) && !"深证系列指数".equals(symbol) && !"指数成份".equals(symbol) && !"中证系列指数".equals(symbol)) {
            return AjaxResult.error("参数错误");
        }
        String redisKey = "aktools:stock:indexSpot:" + symbol;
        List<Map<String, Object>> cachedData = (List<Map<String, Object>>) redisTemplate.opsForValue().get(redisKey);
        if (cachedData != null) {
            return AjaxResult.success("获取指数数据成功(缓存)", cachedData);
        }
        List<Map<String, Object>> data = aktoolsApiService.getStockIndexSpot(symbol);
        long expireSeconds = CacheExpireTimeUtil.calculateExpireTime(60, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set(redisKey, data, expireSeconds, TimeUnit.SECONDS);
        return AjaxResult.success("获取指数数据成功", data);

    }

}