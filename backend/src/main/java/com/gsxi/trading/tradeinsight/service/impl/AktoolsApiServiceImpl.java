package com.gsxi.trading.tradeinsight.service.impl;

import com.gsxi.trading.tradeinsight.config.AktoolsApiConfig;
import com.gsxi.trading.tradeinsight.dto.request.StockHistoryRequest;
import com.gsxi.trading.tradeinsight.dto.request.StockMinuteRequest;
import com.gsxi.trading.tradeinsight.exception.BizException;
import com.gsxi.trading.tradeinsight.service.AktoolsApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

/**
 * AKTOOLS API 服务实现类
 *
 * @author Kiro
 * @version 1.0
 * @date 2025-08-19
 * @description AKTOOLS API 服务的具体实现，提供股票数据查询功能
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AktoolsApiServiceImpl implements AktoolsApiService {

    private final AktoolsApiConfig aktoolsApiConfig;
    private final RestTemplate restTemplate;

    // 添加一个时间戳记录上次调用时间
    private volatile long lastStockSpotDataCallTime = 0;
    // 2分钟的毫秒数
    private static final long MIN_INTERVAL = 2 * 60 * 1000;

    @Override
    public synchronized List<Map<String, Object>> getStockSpotData() {
        // 检查距离上次调用的时间间隔
        long currentTime = System.currentTimeMillis();
        long timeSinceLastCall = currentTime - lastStockSpotDataCallTime;

        // 如果距离上次调用不足2分钟，则等待
        if (timeSinceLastCall < MIN_INTERVAL) {
            long waitTime = MIN_INTERVAL - timeSinceLastCall;
            try {
                log.info("距离上次调用不足2分钟，需要等待 {} 毫秒", waitTime);
                Thread.sleep(waitTime);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new BizException(500, "线程中断异常: " + e.getMessage());
            }
            // 更新当前时间
            currentTime = System.currentTimeMillis();
        }

        String url = aktoolsApiConfig.getBaseUrl() + "/stock_zh_a_spot_em";
        try {
            log.info("调用AKTOOLS API获取实时行情数据，URL: {}", url);
//            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
//                    url,
//                    HttpMethod.GET,
//                    null,
//                    new ParameterizedTypeReference<List<Map<String, Object>>>() {
//                    }
//            );

            // 更新上次调用时间
//            lastStockSpotDataCallTime = currentTime;

//            return response.getBody();
            return null;
        } catch (Exception e) {
            log.error("获取实时行情数据失败", e);
            throw new BizException(500, "获取实时行情数据失败: " + e.getMessage());
        }
    }
    @Override
    public List<Map<String, Object>> getStockHistoryData(StockHistoryRequest request) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(aktoolsApiConfig.getBaseUrl() + "/stock_zh_a_hist")
                .queryParam("symbol", request.getSymbol())
                .queryParam("period", request.getPeriod())
                .queryParam("adjust", request.getAdjust());

        if (StringUtils.hasText(request.getStartDate())) {
            builder.queryParam("start_date", request.getStartDate());
        }
        if (StringUtils.hasText(request.getEndDate())) {
            builder.queryParam("end_date", request.getEndDate());
        }

        String url = builder.toUriString();

        try {
            log.info("调用AKTOOLS API获取股票历史数据，URL: {}", url);
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    }
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("获取股票历史数据失败", e);
            throw new BizException(500, "获取股票历史数据失败: " + e.getMessage());
        }
    }

    @Override
    public List<Map<String, Object>> getStockMinuteData(StockMinuteRequest request) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(aktoolsApiConfig.getBaseUrl() + "/stock_zh_a_hist_min_em")
                .queryParam("symbol", request.getSymbol())
                .queryParam("period", request.getPeriod())
                .queryParam("adjust", request.getAdjust());

        if (StringUtils.hasText(request.getStartDate())) {
            builder.queryParam("start_date", request.getStartDate());
        }
        if (StringUtils.hasText(request.getEndDate())) {
            builder.queryParam("end_date", request.getEndDate());
        }


        String url = builder.toUriString();

        try {
            log.info("调用AKTOOLS API获取股票分钟数据，URL: {}", url);
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    }
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("获取股票分钟数据失败", e);
            throw new BizException(500, "获取股票分钟数据失败: " + e.getMessage());
        }
    }

    @Override
    public List<Map<String, Object>> getStockInfo(String symbol) {
        String url = UriComponentsBuilder
                .fromHttpUrl(aktoolsApiConfig.getBaseUrl() + "/stock_individual_info_em")
                .queryParam("symbol", symbol)
                .toUriString();

        try {
            log.info("调用AKTOOLS API获取个股基础信息，URL: {}", url);
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    }
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("获取个股基础信息失败", e);
            throw new BizException(500, "获取个股基础信息失败: " + e.getMessage());
        }
    }

    @Override
    public List<Map<String, Object>> getStockHoldingDetail(String date, String indicator, String symbol) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(aktoolsApiConfig.getBaseUrl() + "/stock_gdfx_holding_detail_em")
                .queryParam("date", date);
        if (StringUtils.hasText(indicator)) {
            builder.queryParam("indicator", indicator);
        }
        if (StringUtils.hasText(symbol)) {
            builder.queryParam("symbol", symbol);
        }
        URI uri = UriComponentsBuilder
                .fromHttpUrl(aktoolsApiConfig.getBaseUrl() + "/stock_gdfx_holding_detail_em")
                .queryParam("date", date)
                .queryParam("indicator", indicator)
                .queryParam("symbol", symbol)
                .build(false)
                .toUri();

        String url = builder.toUriString();


        try {
            log.info("调用AKTOOLS API获取十大股东持股明细，URL: {}", uri);

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    }
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("获取十大股东持股明细失败", e);
            throw new BizException(500, "获取十大股东持股明细失败: " + e.getMessage());
        }
    }


    @Override
    public List<Map<String, Object>> getStockLimitPool(String date) {
        String url = UriComponentsBuilder
                .fromHttpUrl(aktoolsApiConfig.getBaseUrl() + "/stock_zt_pool_em")
                .queryParam("date", date)
                .toUriString();
        log.info("调用AKTOOLS API获取当日涨停池，URL: {}", url);
        try {
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    }
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("获取涨停池失败 ： ", e);
            throw new BizException(500, "获取涨停池失败 ： " + e.getMessage());
        }
    }

    @Override
    public List<Map<String, Object>> getStockDropPool(String date) {
        String url = UriComponentsBuilder
                .fromHttpUrl(aktoolsApiConfig.getBaseUrl() + "/stock_zt_pool_dtgc_em")
                .queryParam("date", date)
                .toUriString();
        log.info("调用AKTOOLS API获取当日跌停池，URL: {}", url);
        try {
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    }
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("获取跌停池失败 ： ", e);
            throw new BizException(500, "获取跌停池失败 ： " + e.getMessage());
        }
    }

    @Override
    public List<Map<String, Object>> getStockIndustry() {
        String url = UriComponentsBuilder
                .fromHttpUrl(aktoolsApiConfig.getBaseUrl() + "/stock_board_industry_summary_ths")
                .toUriString();
                log.info("调用AKTOOLS API获取板块行业一览表，URL: {}", url);
                try {
                    ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                            url,
                            HttpMethod.GET,
                            null,
                            new ParameterizedTypeReference<List<Map<String, Object>>>() {
                            }
                    );
                    return response.getBody();
                } catch (Exception e) {
                    log.error("获取板块行业一览表失败 ： ", e);
                    throw new BizException(500, "获取板块行业一览表失败 ： " + e.getMessage());
                }
    }

    @Override
    public List<Map<String, Object>> getZtPoolPrevious(String date) {
        String url = UriComponentsBuilder
                .fromHttpUrl(aktoolsApiConfig.getBaseUrl() + "/stock_zt_pool_previous_em")
                .queryParam("date", date)
                .toUriString();
        log.info("调用AKTOOLS API获取昨天涨停池，URL: {}", url);
        try {
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    }
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("获取涨停池失败 ： ", e);
            throw new BizException(500, "获取涨停池失败 ： " + e.getMessage());
        }

    }

    @Override
    public List<Map<String, Object>> getStockIndexSpot(String symbol) {
        try {
//            String url = UriComponentsBuilder
//                    .fromHttpUrl(aktoolsApiConfig.getBaseUrl() + "/stock_zh_index_spot_em")
//                    .queryParam("symbol", symbol)
//                    .toUriString();
            String url = aktoolsApiConfig.getBaseUrl() + "/stock_zh_index_spot_em?symbol=" + symbol;
            log.info("调用AKTOOLS API获取指数实时行情，URL: {}", url);

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("获取指数实时行情失败：", e);
            throw new BizException(500, "获取指数实时行情失败：" + e.getMessage());
        }
    }

    @Override
    public List<Map<String, Object>> getIndexDailyData(String symbol,String startDate,String endDate) {
        try {
//            String url = aktoolsApiConfig.getBaseUrl() + "/index_zh_a_hist?symbol=" + symbol;


            URI url = UriComponentsBuilder
                    .fromHttpUrl(aktoolsApiConfig.getBaseUrl() + "/index_zh_a_hist")
                    .queryParam("symbol", symbol)
                    .queryParam("start_date", startDate)
                    .queryParam("end_date", endDate)
                    .build(false)
                    .toUri();

            log.info("调用AKTOOLS API获取指数历史行情，URL: {}", url);

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("获取指数历史行情失败：", e);
            throw new BizException(500, "获取指数历史行情失败：" + e.getMessage());
        }
    }
}



