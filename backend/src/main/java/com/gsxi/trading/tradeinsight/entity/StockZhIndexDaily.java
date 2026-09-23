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
 * @description A股指数日K线数据实体类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockZhIndexDaily implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 指数代码（sh000001-上证综指，sz399006-创业板指，sh000688-科创50）
    @Column(name = "symbol", nullable = false, length = 20)
    private String symbol;

    // 交易日期
    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;

    // 开盘价
    @Column(name = "open", nullable = false, precision = 10, scale = 4)
    private BigDecimal open;

    // 收盘价
    @Column(name = "close", nullable = false, precision = 10, scale = 4)
    private BigDecimal close;

    // 最高价
    @Column(name = "high", nullable = false, precision = 10, scale = 4)
    private BigDecimal high;

    // 最低价
    @Column(name = "low", nullable = false, precision = 10, scale = 4)
    private BigDecimal low;

    // 成交量（手）
    @Column(name = "volume", precision = 16, scale = 2)
    private BigDecimal volume;

    // 成交额（元）
    @Column(name = "amount", precision = 20, scale = 2)
    private BigDecimal amount;

    // 涨跌幅(%)
    @Column(name = "change", precision = 10, scale = 4)
    private BigDecimal change;

    // 换手率(%)
    @Column(name = "turnover_rate", precision = 8, scale = 4)
    private BigDecimal turnoverRate;

    // 新增字段：振幅(%)
    @Column(name = "amplitude", precision = 8, scale = 4)
    private BigDecimal amplitude;

    // 新增字段：涨跌额
    @Column(name = "price_change", precision = 10, scale = 4)
    private BigDecimal priceChange;

    @Column(name = "create_time", nullable = false, updatable = false)
    private LocalDateTime createTime;

    @Column(name = "update_time", nullable = false)
    private LocalDateTime updateTime;
}
