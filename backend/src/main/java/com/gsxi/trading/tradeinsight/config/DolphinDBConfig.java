package com.gsxi.trading.tradeinsight.config;

import com.gsxi.trading.tradeinsight.dolphindb.DolphinDBClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * DolphinDB 配置：注册 {@link DolphinDBClient}（Java API + JDBC 双通道），
 * 并启用 {@link DolphinDBProperties} 属性绑定。
 *
 * <p>主数据源（MySQL/H2）仍由各 profile 的 spring.datasource 提供，
 * DolphinDB 不注册为 Spring DataSource Bean，互不影响。</p>
 *
 * @author gsxi
 */
@Configuration
@EnableConfigurationProperties(DolphinDBProperties.class)
public class DolphinDBConfig {

    private static final Logger log = LoggerFactory.getLogger(DolphinDBConfig.class);

    @Bean(destroyMethod = "close")
    public DolphinDBClient dolphinDBClient(DolphinDBProperties properties) {
        log.info("初始化 DolphinDB 客户端: {}:{} db={}", properties.getHost(), properties.getPort(), properties.getDatabase());
        return new DolphinDBClient(properties);
    }
}
