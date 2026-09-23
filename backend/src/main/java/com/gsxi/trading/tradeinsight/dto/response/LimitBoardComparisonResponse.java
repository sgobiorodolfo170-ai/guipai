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
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/1/1
 * @description 涨跌停对比分析响应DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LimitBoardComparisonResponse implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 交易日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tradeDate;

    // ========== 数量对比 ==========
    
    /**
     * 涨停数量
     */
    private Integer limitUpCount;

    /**
     * 跌停数量
     */
    private Integer limitDownCount;

    /**
     * 涨跌停比
     */
    private BigDecimal limitUpDownRatio;

    // ========== 资金对比 ==========
    
    /**
     * 涨停总资金（亿元）
     */
    private BigDecimal limitUpTotalFunds;

    /**
     * 跌停总资金（亿元）
     */
    private BigDecimal limitDownTotalFunds;

    /**
     * 资金流向比
     */
    private BigDecimal fundFlowRatio;

    // ========== 质量对比 ==========
    
    /**
     * 涨停一字板率
     */
    private BigDecimal limitUpOneWordRate;

    /**
     * 跌停一字板率
     */
    private BigDecimal limitDownOneWordRate;

    /**
     * 涨停连板率
     */
    private BigDecimal limitUpContinuousRate;

    /**
     * 跌停连板率
     */
    private BigDecimal limitDownContinuousRate;

    // ========== 行业对比 ==========
    
    /**
     * 行业涨跌停对比
     */
    private List<IndustryComparison> industryComparisons;

    /**
     * 行业涨跌停对比数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IndustryComparison implements Serializable {

        @Serial
        private static final long serialVersionUID = 1L;

        /**
         * 行业名称
         */
        private String industry;

        /**
         * 涨停数量
         */
        private Integer limitUpCount;

        /**
         * 跌停数量
         */
        private Integer limitDownCount;

        /**
         * 净比率（涨停-跌停）/总数
         */
        private BigDecimal netRatio;
    }
}