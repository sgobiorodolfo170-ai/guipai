package com.gsxi.trading.tradeinsight.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/1/1
 * @description 涨跌停板基础统计响应DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BasicStatisticsResponse implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 交易日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tradeDate;

    // ========== 涨停板数据 ==========
    
    /**
     * 涨停股数量
     */
    private Integer limitUpCount;

    /**
     * 涨停一字板数量
     */
    private Integer limitUpOneWordCount;

    /**
     * 涨停炸板回封数
     */
    private Integer limitUpBlastResealCount;

    /**
     * 涨停最高连板数
     */
    private Integer limitUpMaxContinuous;

    /**
     * 涨停连板率（2板及以上占比）
     */
    private BigDecimal limitUpContinuousRate;

    /**
     * 涨停总封单资金（亿元）
     */
    private BigDecimal limitUpTotalSealFunds;

    /**
     * 涨停平均封单资金（万元）
     */
    private BigDecimal limitUpAvgSealFunds;

    // ========== 跌停板数据 ==========
    
    /**
     * 跌停股数量
     */
    private Integer limitDownCount;

    /**
     * 跌停一字板数量
     */
    private Integer limitDownOneWordCount;

    /**
     * 跌停开板数量
     */
    private Integer limitDownOpenCount;

    /**
     * 跌停最高连板数
     */
    private Integer limitDownMaxContinuous;

    /**
     * 跌停连板率（2板及以上占比）
     */
    private BigDecimal limitDownContinuousRate;

    /**
     * 跌停总封单资金（亿元）
     */
    private BigDecimal limitDownTotalSealFunds;

    /**
     * 跌停平均封单资金（万元）
     */
    private BigDecimal limitDownAvgSealFunds;

    // ========== 对比指标 ==========
    
    /**
     * 涨跌停比
     */
    private BigDecimal limitUpDownRatio;

    /**
     * 涨跌停股总市值（亿元）
     */
    private BigDecimal totalMarketValue;

    /**
     * 昨日涨停今日平均涨幅
     */
    private BigDecimal yesterdayLimitUpAvgIncrease;

    /**
     * 昨日跌停今日平均涨幅
     */
    private BigDecimal yesterdayLimitDownAvgIncrease;
}