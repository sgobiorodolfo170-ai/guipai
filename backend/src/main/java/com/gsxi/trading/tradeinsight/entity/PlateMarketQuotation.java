package com.gsxi.trading.tradeinsight.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;


/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/26
 * @description 板块行情数据实体类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlateMarketQuotation implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;

    @Column(name = "plate", nullable = false, length = 50)
    private String plate; // 板块名称（如：游戏）

    @Column(name = "increase_rate", nullable = false, precision = 8, scale = 4)
    private BigDecimal increaseRate; // 涨跌幅(%)

    @Column(name = "total_volume", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalVolume; // 总成交量(万手)

    @Column(name = "total_turnover", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalTurnover; // 总成交额(亿元)

    @Column(name = "net_inflow", precision = 12, scale = 2)
    private BigDecimal netInflow; // 净流入(亿元)

    @Column(name = "up_count", nullable = false)
    private Integer upCount; // 上涨家数

    @Column(name = "down_count", nullable = false)
    private Integer downCount; // 下跌家数

    @Column(name = "average_price", precision = 10, scale = 2)
    private BigDecimal averagePrice; // 均价

    @Column(name = "leading_stock", length = 50)
    private String leadingStock; // 领涨股名称

    @Column(name = "leading_stock_price", precision = 10, scale = 2)
    private BigDecimal leadingStockPrice; // 领涨股最新价

    @Column(name = "leading_stock_increase", precision = 8, scale = 4)
    private BigDecimal leadingStockIncrease; // 领涨股涨跌幅(%)

    @Column(name = "create_time", nullable = false, updatable = false)
    private LocalDateTime createTime;
}


