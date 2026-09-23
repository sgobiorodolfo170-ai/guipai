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
 * @description 连板分布查询 DTO - 用于数据库查询结果映射
 * 用于统计不同连板数的股票分布情况
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContinuousLimitDistributionDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 连板数（2连板、3连板等）
     */
    private Integer continuousLimit;

    /**
     * 股票数量
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
     * 数据转换方法：将数据库查询结果转换为响应格式
     * 
     * @return 转换后的数据，如果当前对象为空则返回null
     */
    public ContinuousLimitDistributionDTO convertUnits() {
        if (this.continuousLimit == null) {
            return null;
        }

        return ContinuousLimitDistributionDTO.builder()
                .continuousLimit(this.continuousLimit)
                .count(this.count != null ? this.count : 0)
                .percentage(this.percentage != null ? this.percentage : BigDecimal.ZERO)
                .avgSealFunds(convertToWan(this.avgSealFunds))
                .avgMarketValue(convertToYi(this.avgMarketValue))
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
        return this.continuousLimit != null && this.continuousLimit > 0;
    }
}