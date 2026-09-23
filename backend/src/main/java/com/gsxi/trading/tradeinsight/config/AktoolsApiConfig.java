package com.gsxi.trading.tradeinsight.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * AKTOOLS API 配置类
 * 
 * @author Kiro
 * @version 1.0
 * @date 2025-08-19
 * @description 用于读取 AKTOOLS API 相关配置信息
 */
@Data
@Component
@ConfigurationProperties(prefix = "aktools.api")
public class AktoolsApiConfig {
    
    /**
     * AKTOOLS API 基础地址
     */
    private String baseUrl ;
    
    /**
     * 连接超时时间（毫秒）
     */
    private Integer connectTimeout ;
    
    /**
     * 读取超时时间（毫秒）
     */
    private Integer readTimeout ;
}