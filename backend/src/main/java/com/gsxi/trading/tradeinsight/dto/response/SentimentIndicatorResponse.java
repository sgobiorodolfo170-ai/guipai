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
 * @description 市场情绪指标响应DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentIndicatorResponse implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 交易日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tradeDate;

    // ========== 基础情绪指标 ==========
    
    /**
     * 涨跌停比
     */
    private BigDecimal limitUpDownRatio;

    /**
     * 连板率
     */
    private BigDecimal continuousLimitRate;

    /**
     * 炸板率
     */
    private BigDecimal blastRate;

    /**
     * 回封率
     */
    private BigDecimal resealRate;

    // ========== 资金情绪指标 ==========
    
    /**
     * 总封单资金（亿元）
     */
    private BigDecimal totalSealFunds;

    /**
     * 平均封单资金（万元）
     */
    private BigDecimal avgSealFunds;

    /**
     * 大单封板比例
     */
    private BigDecimal largeSealRate;

    /**
     * 资金集中度
     */
    private BigDecimal fundConcentration;

    // ========== 时间情绪指标 ==========
    
    /**
     * 早盘涨停比例
     */
    private BigDecimal earlyLimitUpRate;

    /**
     * 尾盘涨停比例
     */
    private BigDecimal lateLimitUpRate;

    /**
     * 平均首次封板时间（分钟，从开盘算起）
     */
    private BigDecimal avgFirstLimitTime;

    // ========== 综合情绪评分 ==========
    
    /**
     * 情绪综合评分（0-100）
     */
    private BigDecimal sentimentScore;

    /**
     * 情绪等级（极度恐慌/恐慌/中性/乐观/极度乐观）
     */
    private String sentimentLevel;
}