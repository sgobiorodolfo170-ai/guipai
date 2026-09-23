package com.gsxi.trading.tradeinsight.dto.internal;

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
 * @description 行业分布查询 DTO - 用于数据库查询结果映射
 * 用于统计不同行业的涨跌停板分布情况
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndustryDistributionDTO implements Serializable {

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
     * 占比（已计算好的百分比）
     */
    private BigDecimal percentage;

    /**
     * 平均封单资金（单位：元，需要转换为万元）
     */
    private BigDecimal avgSealFunds;

    /**
     * 平均市值（单位：元，需要转换为亿元）
     */
    private BigDecimal avgMarketValue;

    /**
     * 排名
     */
    private Integer rank;

    /**
     * 数据转换方法：将数据库查询结果转换为响应格式
     * 
     * @return 转换后的数据，如果当前对象为空则返回null
     */
    public IndustryDistributionDTO convertUnits() {
        if (this.industry == null) {
            return null;
        }

        return IndustryDistributionDTO.builder()
                .industry(this.industry)
                .count(this.count != null ? this.count : 0)
                .percentage(this.percentage != null ? this.percentage : BigDecimal.ZERO)
                .avgSealFunds(convertToWan(this.avgSealFunds))
                .avgMarketValue(convertToYi(this.avgMarketValue))
                .rank(this.rank != null ? this.rank : 0)
                .build();
    }

    /**
     * 将元转换为万元
     * 
     * @param value 原始值（元）
     * @return 转换后的值（万元），保留2位小数
     */
    private BigDecimal convertToWan(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.divide(new BigDecimal("10000"), 2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 将元转换为亿元
     * 
     * @param value 原始值（元）
     * @return 转换后的值（亿元），保留2位小数
     */
    private BigDecimal convertToYi(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.divide(new BigDecimal("100000000"), 2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 数据有效性验证
     * 
     * @return 如果数据有效返回true，否则返回false
     */
    public boolean isValid() {
        return this.industry != null && !this.industry.trim().isEmpty();
    }
}