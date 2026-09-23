package com.gsxi.trading.tradeinsight.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/16
 * @description CORS 跨域配置类
 */
@Configuration
public class CorsConfig {

    /**
     * 配置跨域
     *
     * @return CorsFilter
     */
    @Bean
    public CorsFilter corsFilter() {
        // 1. 添加CORS配置信息
        CorsConfiguration config = new CorsConfiguration();
        // 放行哪些原始域
        config.addAllowedOriginPattern("*");
        // 是否发送Cookie信息
        config.setAllowCredentials(true);
        // 放行哪些原始域(请求方式)
        config.addAllowedMethod("*");
        // 放行哪些原始域(头部信息)
        config.addAllowedHeader("*");
        // 暴露哪些头部信息
        config.addExposedHeader("*");

        // 2. 添加映射路径
        UrlBasedCorsConfigurationSource configSource = new UrlBasedCorsConfigurationSource();
        configSource.registerCorsConfiguration("/**", config);

        // 3. 返回新的CorsFilter
        return new CorsFilter(configSource);
    }
}
