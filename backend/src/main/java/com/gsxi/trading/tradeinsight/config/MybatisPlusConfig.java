package com.gsxi.trading.tradeinsight.config;
import com.gsxi.trading.tradeinsight.util.TradeDataListTypeHandler;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Autowired;

import javax.annotation.PostConstruct;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/15
 * @description Mybatis Plus 配置文件
 */
@Configuration
@MapperScan("com.gsxi.trading.tradeinsight.mapper")
public class MybatisPlusConfig {
    @Autowired
    private SqlSessionFactory sqlSessionFactory;

    @PostConstruct
    public void addTypeHandlers() {
        // 显式注册类型处理器
        sqlSessionFactory.getConfiguration().getTypeHandlerRegistry().register(TradeDataListTypeHandler.class);
    }
}