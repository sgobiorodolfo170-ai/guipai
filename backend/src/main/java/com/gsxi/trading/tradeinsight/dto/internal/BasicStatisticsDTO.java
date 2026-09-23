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
 * @description 基础统计查询 DTO - 用于数据库查询结果映射
 * 包含涨停和跌停板的基础统计数据，用于内部数据传输和转换
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BasicStatisticsDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 交易日期
     */
    private LocalDate tradeDate;

    // ==================== 涨停板统计数据 ====================
    
    /**
     * 涨停股数量
     */
    private Integer limitUpCount;

    /**
     * 涨停一字板数量
     */
    private Integer limitUpOneWordCount;

    /**
     * 涨停炸板回封数量
     */
    private Integer limitUpBlastResealCount;

    /**
     * 涨停最高连板数
     */
    private Integer limitUpMaxContinuous;

    /**
     * 涨停总封单资金（单位：元，需要转换为亿元）
     */
    private BigDecimal limitUpTotalSealFunds;

    /**
     * 涨停平均封单资金（单位：元，需要转换为万元）
     */
    private BigDecimal limitUpAvgSealFunds;

    /**
     * 涨停连板率（2板及以上占比）
     */
    private BigDecimal limitUpContinuousRate;

    // ==================== 跌停板统计数据 ====================
    
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
     * 跌停总封单资金（单位：元，需要转换为亿元）
     */
    private BigDecimal limitDownTotalSealFunds;

    /**
     * 跌停平均封单资金（单位：元，需要转换为万元）
     */
    private BigDecimal limitDownAvgSealFunds;

    /**
     * 跌停连板率（2板及以上占比）
     */
    private BigDecimal limitDownContinuousRate;

    // ==================== 综合统计数据 ====================
    
    /**
     * 涨跌停股总市值（单位：元，需要转换为亿元）
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

    /**
     * 涨跌停比
     */
    private BigDecimal limitUpDownRatio;

    /**
     * 数据转换方法：将数据库查询结果转换为响应格式
     * 
     * @return 转换后的数据，如果当前对象为空则返回null
     */
    public BasicStatisticsDTO convertUnits() {
        if (this.tradeDate == null) {
            return null;
        }

        return BasicStatisticsDTO.builder()
                .tradeDate(this.tradeDate)
                // 涨停板数据转换
                .limitUpCount(this.limitUpCount != null ? this.limitUpCount : 0)
                .limitUpOneWordCount(this.limitUpOneWordCount != null ? this.limitUpOneWordCount : 0)
                .limitUpBlastResealCount(this.limitUpBlastResealCount != null ? this.limitUpBlastResealCount : 0)
                .limitUpMaxContinuous(this.limitUpMaxContinuous != null ? this.limitUpMaxContinuous : 0)
                .limitUpTotalSealFunds(convertToYi(this.limitUpTotalSealFunds))
                .limitUpAvgSealFunds(convertToWan(this.limitUpAvgSealFunds))
                .limitUpContinuousRate(this.limitUpContinuousRate != null ? this.limitUpContinuousRate : BigDecimal.ZERO)
                // 跌停板数据转换
                .limitDownCount(this.limitDownCount != null ? this.limitDownCount : 0)
                .limitDownOneWordCount(this.limitDownOneWordCount != null ? this.limitDownOneWordCount : 0)
                .limitDownOpenCount(this.limitDownOpenCount != null ? this.limitDownOpenCount : 0)
                .limitDownMaxContinuous(this.limitDownMaxContinuous != null ? this.limitDownMaxContinuous : 0)
                .limitDownTotalSealFunds(convertToYi(this.limitDownTotalSealFunds))
                .limitDownAvgSealFunds(convertToWan(this.limitDownAvgSealFunds))
                .limitDownContinuousRate(this.limitDownContinuousRate != null ? this.limitDownContinuousRate : BigDecimal.ZERO)
                // 综合数据转换
                .totalMarketValue(convertToYi(this.totalMarketValue))
                .yesterdayLimitUpAvgIncrease(this.yesterdayLimitUpAvgIncrease != null ? this.yesterdayLimitUpAvgIncrease : BigDecimal.ZERO)
                .yesterdayLimitDownAvgIncrease(this.yesterdayLimitDownAvgIncrease != null ? this.yesterdayLimitDownAvgIncrease : BigDecimal.ZERO)
                .limitUpDownRatio(this.limitUpDownRatio != null ? this.limitUpDownRatio : BigDecimal.ZERO)
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
     * 数据有效性验证
     * 
     * @return 如果数据有效返回true，否则返回false
     */
    public boolean isValid() {
        return this.tradeDate != null && 
               (this.limitUpCount != null || this.limitDownCount != null);
    }
}