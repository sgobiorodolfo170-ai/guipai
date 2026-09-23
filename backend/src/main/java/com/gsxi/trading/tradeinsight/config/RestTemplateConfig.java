package com.gsxi.trading.tradeinsight.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.Collections;
import java.util.concurrent.TimeUnit;

/**
 * RestTemplate 配置类
 * 
 * @author Kiro
 * @version 1.0
 * @date 2025-08-19
 * @description 配置 RestTemplate 用于 HTTP 请求
 */
@Configuration
@RequiredArgsConstructor
public class RestTemplateConfig {
    
    private final AktoolsApiConfig aktoolsApiConfig;
    
    /**
     * 创建 RestTemplate Bean
     * 
     * @return RestTemplate 实例
     */
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(aktoolsApiConfig.getConnectTimeout());
        factory.setReadTimeout(aktoolsApiConfig.getReadTimeout());
        
        RestTemplate restTemplate = new RestTemplate(factory);
        // 添加请求间隔控制拦截器，确保请求间隔至少0.5秒
        restTemplate.setInterceptors(Collections.singletonList(new RequestIntervalInterceptor()));
        
        return restTemplate;
    }
    
    /**
     * 请求间隔控制拦截器
     */
    private static class RequestIntervalInterceptor implements ClientHttpRequestInterceptor {
        
        private static final long MIN_INTERVAL_MILLIS = 500; // 0.5秒最小间隔
        private volatile long lastRequestTime = 0;
        
        @Override
        public ClientHttpResponse intercept(
                HttpRequest request,
                byte[] body,
                ClientHttpRequestExecution execution) throws IOException {
            
            long currentTime = System.currentTimeMillis();
            long timeSinceLastRequest = currentTime - lastRequestTime;
            
            if (lastRequestTime > 0 && timeSinceLastRequest < MIN_INTERVAL_MILLIS) {
                long sleepTime = MIN_INTERVAL_MILLIS - timeSinceLastRequest;
                try {
                    TimeUnit.MILLISECONDS.sleep(sleepTime);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new IOException("Request interrupted while waiting for minimum interval", e);
                }
                currentTime = System.currentTimeMillis();
            }
            
            lastRequestTime = currentTime;
            return execution.execute(request, body);
        }
    }
}