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
 * @description 跌停板反弹分析查询 DTO - 用于数据库查询结果映射
 * 专门用于跌停板次日反弹情况的数据传输和分析
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LimitDownReboundDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 交易日期
     */
    private LocalDate tradeDate;

    /**
     * 跌停总数量
     */
    private Integer totalLimitDownCount;

    /**
     * 次日反弹数量（涨幅>0）
     */
    private Integer reboundCount;

    /**
     * 平均反弹幅度
     */
    private BigDecimal avgReboundIncrease;

    /**
     * 数据转换方法：将数据库查询结果转换为响应格式
     * 
     * @return 转换后的数据，如果当前对象为空则返回null
     */
    public LimitDownReboundDTO convertUnits() {
        if (this.tradeDate == null) {
            return null;
        }

        return LimitDownReboundDTO.builder()
                .tradeDate(this.tradeDate)
                .totalLimitDownCount(this.totalLimitDownCount != null ? this.totalLimitDownCount : 0)
                .reboundCount(this.reboundCount != null ? this.reboundCount : 0)
                .avgReboundIncrease(convertToPercentage(this.avgReboundIncrease))
                .build();
    }

    /**
     * 计算反弹率
     * 
     * @return 反弹率（百分比），如果总数为0则返回0
     */
    public BigDecimal calculateReboundRate() {
        if (this.totalLimitDownCount == null || this.totalLimitDownCount == 0) {
            return BigDecimal.ZERO;
        }
        
        Long reboundCountValue = this.reboundCount != null ? this.reboundCount : 0L;
        return new BigDecimal(reboundCountValue)
                .divide(new BigDecimal(this.totalLimitDownCount), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, BigDecimal.ROUND_HALF_UP);
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
        return this.tradeDate != null && this.totalLimitDownCount != null;
    }

    /**
     * 判断反弹强度
     * 
     * @return 反弹强度描述
     */
    public String getReboundStrength() {
        BigDecimal reboundRate = calculateReboundRate();
        
        if (reboundRate.compareTo(new BigDecimal("80")) >= 0) {
            return "极强反弹";
        } else if (reboundRate.compareTo(new BigDecimal("60")) >= 0) {
            return "强反弹";
        } else if (reboundRate.compareTo(new BigDecimal("40")) >= 0) {
            return "中等反弹";
        } else if (reboundRate.compareTo(new BigDecimal("20")) >= 0) {
            return "弱反弹";
        } else {
            return "极弱反弹";
        }
    }

    /**
     * 判断平均反弹幅度强度
     * 
     * @return 平均反弹幅度强度描述
     */
    public String getAvgReboundStrength() {
        BigDecimal avgIncrease = this.avgReboundIncrease != null ? this.avgReboundIncrease : BigDecimal.ZERO;
        
        if (avgIncrease.compareTo(new BigDecimal("8")) >= 0) {
            return "超强反弹";
        } else if (avgIncrease.compareTo(new BigDecimal("5")) >= 0) {
            return "强反弹";
        } else if (avgIncrease.compareTo(new BigDecimal("3")) >= 0) {
            return "中等反弹";
        } else if (avgIncrease.compareTo(new BigDecimal("1")) >= 0) {
            return "弱反弹";
        } else {
            return "微弱反弹";
        }
    }
}