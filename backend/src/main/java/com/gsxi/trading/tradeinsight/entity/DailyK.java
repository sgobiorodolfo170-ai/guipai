package com.gsxi.trading.tradeinsight.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/9/4
 * @description 股票日线结构（时序数据，持久化于 DolphinDB，非 JPA 实体）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyK {
    /**
     * 自增主键
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /**
     * 交易日期
     */
    @Column(name = "date", nullable = false)
    private LocalDate date;

    /**
     * 股票代码
     */
    @Column(name = "code", nullable = false)
    private String code;

    /**
     * 开盘价
     */
    @Column(name = "open")
    private BigDecimal open;

    /**
     * 最高价
     */
    @Column(name = "high")
    private BigDecimal high;

    /**
     * 最低价
     */
    @Column(name = "low")
    private BigDecimal low;

    /**
     * 收盘价
     */
    @Column(name = "close")
    private BigDecimal close;

    /**
     * 前收盘价
     */
    @Column(name = "preclose")
    private BigDecimal preclose;

    /**
     * 成交量
     */
    @Column(name = "volume")
    private Long volume;

    /**
     * 成交金额
     */
    @Column(name = "amount")
    private BigDecimal amount;

    /**
     * 复权状态
     */
    @Column(name = "adjustflag")
    private Integer adjustflag;

    /**
     * 换手率
     */
    @Column(name = "turn")
    private Float turn;

    /**
     * 交易状态
     */
    @Column(name = "tradestatus")
    private Integer tradestatus;

    /**
     * 涨跌幅(%)
     */
    @Column(name = "pctChg")
    private Float pctChg;

    /**
     * 是否ST股
     */
    @Column(name = "isST")
    private Integer isST;

    /**
     * 更新时间
     */
    @Column(name = "update_time")
    private LocalDateTime updateTime;
}