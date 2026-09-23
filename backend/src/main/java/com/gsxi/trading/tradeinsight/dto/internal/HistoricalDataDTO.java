package com.gsxi.trading.tradeinsight.dto.internal;

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
 * @description 历史数据查询 DTO - 用于数据库查询结果映射
 * 用于历史对比分析的基础数据传输
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoricalDataDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 交易日期
     */
    private LocalDate tradeDate;

    /**
     * 涨停股数量
     */
    private Long limitUpCount;

    /**
     * 跌停股数量
     */
    private Long limitDownCount;

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
     * 总封单资金（单位：元，需要转换为亿元）
     */
    private BigDecimal totalSealFunds;

    /**
     * 平均封单资金（单位：元，需要转换为万元）
     */
    private BigDecimal avgSealFunds;

    /**
     * 早盘涨停比例
     */
    private BigDecimal earlyLimitRate;

    /**
     * 数据转换方法：将数据库查询结果转换为响应格式
     * 
     * @return 转换后的数据，如果当前对象为空则返回null
     */
    public HistoricalDataDTO convertUnits() {
        if (this.tradeDate == null) {
            return null;
        }

        return HistoricalDataDTO.builder()
                .tradeDate(this.tradeDate)
                .limitUpCount(this.limitUpCount != null ? this.limitUpCount : 0L)
                .limitDownCount(this.limitDownCount != null ? this.limitDownCount : 0L)
                .limitUpDownRatio(this.limitUpDownRatio != null ? this.limitUpDownRatio : BigDecimal.ZERO)
                .continuousLimitRate(convertToPercentage(this.continuousLimitRate))
                .blastRate(convertToPercentage(this.blastRate))
                .totalSealFunds(convertToYi(this.totalSealFunds))
                .avgSealFunds(convertToWan(this.avgSealFunds))
                .earlyLimitRate(convertToPercentage(this.earlyLimitRate))
                .build();
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
     * 将小数转换为百分比格式
     * 
     * @param value 原始值（小数）
     * @return 转换后的值（百分比），保留2位小数
     */
    private BigDecimal convertToPercentage(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.multiply(new BigDecimal("100")).setScale(2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 数据有效性验证
     * 
     * @return 如果数据有效返回true，否则返回false
     */
    public boolean isValid() {
        return this.tradeDate != null;
    }
}