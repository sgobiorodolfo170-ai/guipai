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
 * @description 分位数分析数据查询 DTO - 用于数据库查询结果映射
 * 用于计算当前数据在历史数据中的分位数位置
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PercentileDataDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 目标日期（要分析的日期）
     */
    private LocalDate targetDate;

    /**
     * 目标日期的涨停股数量
     */
    private Long targetLimitUpCount;

    /**
     * 目标日期的跌停股数量
     */
    private Long targetLimitDownCount;

    /**
     * 目标日期的涨跌停比
     */
    private BigDecimal targetLimitUpDownRatio;

    /**
     * 目标日期的总封单资金（单位：元，需要转换为亿元）
     */
    private BigDecimal targetTotalSealFunds;

    /**
     * 历史数据总天数
     */
    private Long totalDays;

    /**
     * 涨停股数量小于等于目标值的天数
     */
    private Long limitUpCountLessEqualDays;

    /**
     * 跌停股数量小于等于目标值的天数
     */
    private Long limitDownCountLessEqualDays;

    /**
     * 涨跌停比小于等于目标值的天数
     */
    private Long ratioLessEqualDays;

    /**
     * 总封单资金小于等于目标值的天数
     */
    private Long totalFundsLessEqualDays;

    /**
     * 数据转换方法：将数据库查询结果转换为响应格式
     * 
     * @return 转换后的数据，如果当前对象为空则返回null
     */
    public PercentileDataDTO convertUnits() {
        if (this.targetDate == null) {
            return null;
        }

        return PercentileDataDTO.builder()
                .targetDate(this.targetDate)
                .targetLimitUpCount(this.targetLimitUpCount != null ? this.targetLimitUpCount : 0L)
                .targetLimitDownCount(this.targetLimitDownCount != null ? this.targetLimitDownCount : 0L)
                .targetLimitUpDownRatio(this.targetLimitUpDownRatio != null ? this.targetLimitUpDownRatio : BigDecimal.ZERO)
                .targetTotalSealFunds(convertToYi(this.targetTotalSealFunds))
                .totalDays(this.totalDays != null ? this.totalDays : 0L)
                .limitUpCountLessEqualDays(this.limitUpCountLessEqualDays != null ? this.limitUpCountLessEqualDays : 0L)
                .limitDownCountLessEqualDays(this.limitDownCountLessEqualDays != null ? this.limitDownCountLessEqualDays : 0L)
                .ratioLessEqualDays(this.ratioLessEqualDays != null ? this.ratioLessEqualDays : 0L)
                .totalFundsLessEqualDays(this.totalFundsLessEqualDays != null ? this.totalFundsLessEqualDays : 0L)
                .build();
    }

    /**
     * 计算涨停股数量分位数
     * 
     * @return 分位数（0-100）
     */
    public BigDecimal calculateLimitUpCountPercentile() {
        if (this.totalDays == null || this.totalDays == 0) {
            return BigDecimal.ZERO;
        }
        
        Long lessEqualDays = this.limitUpCountLessEqualDays != null ? this.limitUpCountLessEqualDays : 0L;
        return new BigDecimal(lessEqualDays)
                .divide(new BigDecimal(this.totalDays), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 计算跌停股数量分位数
     * 
     * @return 分位数（0-100）
     */
    public BigDecimal calculateLimitDownCountPercentile() {
        if (this.totalDays == null || this.totalDays == 0) {
            return BigDecimal.ZERO;
        }
        
        Long lessEqualDays = this.limitDownCountLessEqualDays != null ? this.limitDownCountLessEqualDays : 0L;
        return new BigDecimal(lessEqualDays)
                .divide(new BigDecimal(this.totalDays), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 计算涨跌停比分位数
     * 
     * @return 分位数（0-100）
     */
    public BigDecimal calculateRatioPercentile() {
        if (this.totalDays == null || this.totalDays == 0) {
            return BigDecimal.ZERO;
        }
        
        Long lessEqualDays = this.ratioLessEqualDays != null ? this.ratioLessEqualDays : 0L;
        return new BigDecimal(lessEqualDays)
                .divide(new BigDecimal(this.totalDays), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 计算总封单资金分位数
     * 
     * @return 分位数（0-100）
     */
    public BigDecimal calculateTotalFundsPercentile() {
        if (this.totalDays == null || this.totalDays == 0) {
            return BigDecimal.ZERO;
        }
        
        Long lessEqualDays = this.totalFundsLessEqualDays != null ? this.totalFundsLessEqualDays : 0L;
        return new BigDecimal(lessEqualDays)
                .divide(new BigDecimal(this.totalDays), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 获取涨停股数量分位数等级描述
     * 
     * @return 分位数等级描述
     */
    public String getLimitUpCountPercentileLevel() {
        BigDecimal percentile = calculateLimitUpCountPercentile();
        return getPercentileLevel(percentile);
    }

    /**
     * 获取跌停股数量分位数等级描述
     * 
     * @return 分位数等级描述
     */
    public String getLimitDownCountPercentileLevel() {
        BigDecimal percentile = calculateLimitDownCountPercentile();
        return getPercentileLevel(percentile);
    }

    /**
     * 获取涨跌停比分位数等级描述
     * 
     * @return 分位数等级描述
     */
    public String getRatioPercentileLevel() {
        BigDecimal percentile = calculateRatioPercentile();
        return getPercentileLevel(percentile);
    }

    /**
     * 获取总封单资金分位数等级描述
     * 
     * @return 分位数等级描述
     */
    public String getTotalFundsPercentileLevel() {
        BigDecimal percentile = calculateTotalFundsPercentile();
        return getPercentileLevel(percentile);
    }

    /**
     * 根据分位数值获取等级描述
     * 
     * @param percentile 分位数值
     * @return 等级描述
     */
    private String getPercentileLevel(BigDecimal percentile) {
        if (percentile.compareTo(new BigDecimal("95")) >= 0) {
            return "极高水平";
        } else if (percentile.compareTo(new BigDecimal("80")) >= 0) {
            return "高水平";
        } else if (percentile.compareTo(new BigDecimal("60")) >= 0) {
            return "中高水平";
        } else if (percentile.compareTo(new BigDecimal("40")) >= 0) {
            return "中等水平";
        } else if (percentile.compareTo(new BigDecimal("20")) >= 0) {
            return "中低水平";
        } else if (percentile.compareTo(new BigDecimal("5")) >= 0) {
            return "低水平";
        } else {
            return "极低水平";
        }
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
        return this.targetDate != null && this.totalDays != null && this.totalDays > 0;
    }
}