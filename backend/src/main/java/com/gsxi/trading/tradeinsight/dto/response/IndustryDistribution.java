package com.gsxi.trading.tradeinsight.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/1/1
 * @description 行业分布数据
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndustryDistribution implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 行业名称
     */
    private String industry;

    /**
     * 数量
     */
    private Integer count;

    /**
     * 占比（百分比）
     */
    private BigDecimal percentage;

    /**
     * 平均封单资金（万元）
     */
    private BigDecimal avgSealFunds;

    /**
     * 平均市值（亿元）
     */
    private BigDecimal avgMarketValue;

    /**
     * 排名
     */
    private Integer rank;
}