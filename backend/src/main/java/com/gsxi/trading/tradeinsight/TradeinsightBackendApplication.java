package com.gsxi.trading.tradeinsight;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * @author 25318
 */
@SpringBootApplication
@ComponentScan({"com.gsxi.trading.tradeinsight.*"})
@EnableScheduling
public class TradeinsightBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(TradeinsightBackendApplication.class, args);
    }

}
