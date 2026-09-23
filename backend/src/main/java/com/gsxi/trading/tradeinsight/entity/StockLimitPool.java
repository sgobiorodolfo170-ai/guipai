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
import java.time.LocalTime;


/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/25
 * @description 每日涨停池数据实体类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockLimitPool implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "data_type", nullable = false)
    private String dataType; // 数据类型：LIMIT_UP-涨停，LIMIT_DOWN-跌停

    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;

    @Column(name = "stock_code", nullable = false, length = 10)
    private String stockCode;

    @Column(name = "stock_name", nullable = false, length = 50)
    private String stockName;

    @Column(name = "industry", length = 50)
    private String industry;

    @Column(name = "increase_rate", nullable = false, precision = 8, scale = 6)
    private BigDecimal increaseRate;

    @Column(name = "latest_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal latestPrice;

    @Column(name = "turnover", nullable = false)
    private Long turnover;

    @Column(name = "circulation_market_value", nullable = false, precision = 20, scale = 2)
    private BigDecimal circulationMarketValue;

    @Column(name = "total_market_value", nullable = false, precision = 20, scale = 2)
    private BigDecimal totalMarketValue;

    @Column(name = "turnover_rate", nullable = false, precision = 8, scale = 6)
    private BigDecimal turnoverRate;

    @Column(name = "limit_funds")
    private Long limitFunds; // 封单资金（共用）

    // 涨停特有字段
    @Column(name = "first_limit_time")
    private LocalTime firstLimitTime; // 首次封板时间（仅涨停）

    @Column(name = "limit_stats", length = 20)
    private String limitStats; // 涨停统计（如2/2，仅涨停）

    // 跌停特有字段
    @Column(name = "dynamic_pe", precision = 12, scale = 6)
    private BigDecimal dynamicPe; // 动态市盈率（仅跌停）

    @Column(name = "limit_turnover")
    private Long limitTurnover; // 板上成交额（仅跌停）

    // 转换后的共用字段
    @Column(name = "continuous_limit", nullable = false)
    private Integer continuousLimit; // 连续板数（涨停=连涨停，跌停=连跌停）

    @Column(name = "last_limit_time")
    private LocalTime lastLimitTime; // 最后封板时间（共用）

    @Column(name = "blast_times", nullable = false)
    private Integer blastTimes; // 炸板/开板次数（涨停=炸板，跌停=开板）

    @Column(name = "create_time", nullable = false, updatable = false)
    private LocalDateTime createTime;
}
