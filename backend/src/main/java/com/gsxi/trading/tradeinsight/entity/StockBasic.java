package com.gsxi.trading.tradeinsight.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
/**
 * @author gsxi
 * @version 1.0
 * @date 2025/9/4
 * @description 股票基础信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "stock_basic")
public class StockBasic {
    /**
     * 股票代码
     */
    @Id
    @Column(name = "code", nullable = false)
    private String code;

    /**
     * 股票名称
     */
    @Column(name = "code_name")
    private String codeName;

    /**
     * 上市日期
     */
    @Column(name = "ipo_date")
    private LocalDate ipoDate;

    /**
     * 退市日期
     */
    @Column(name = "out_date")
    private LocalDate outDate;

    /**
     * 类型
     */
    @Column(name = "type")
    private String type;

    /**
     * 状态
     */
    @Column(name = "status")
    private String status;

    /**
     * 交易所
     */
    @Column(name = "exchange")
    private String exchange;
}

