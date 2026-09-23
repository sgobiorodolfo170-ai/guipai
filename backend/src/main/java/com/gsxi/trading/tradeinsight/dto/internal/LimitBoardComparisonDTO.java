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
 * @description 涨跌停对比分析查询 DTO - 用于数据库查询结果映射
 * 用于涨停板和跌停板的对比分析数据传输
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LimitBoardComparisonDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 交易日期
     */
    private LocalDate tradeDate;

    // ==================== 数量对比 ====================
    
    /**
     * 涨停股数量
     */
    private Integer limitUpCount;

    /**
     * 跌停股数量
     */
    private Integer limitDownCount;

    // ==================== 资金对比 ====================
    
    /**
     * 涨停总封单资金（单位：元，需要转换为亿元）
     */
    private BigDecimal limitUpTotalFunds;

    /**
     * 跌停总封单资金（单位：元，需要转换为亿元）
     */
    private BigDecimal limitDownTotalFunds;

    // ==================== 质量对比 ====================
    
    /**
     * 涨停一字板比例
     */
    private BigDecimal limitUpOneWordRate;

    /**
     * 跌停一字板比例
     */
    private BigDecimal limitDownOneWordRate;

    /**
     * 涨停连板比例
     */
    private BigDecimal limitUpContinuousRate;

    /**
     * 跌停连板比例
     */
    private BigDecimal limitDownContinuousRate;

    /**
     * 数据转换方法：将数据库查询结果转换为响应格式
     * 
     * @return 转换后的数据，如果当前对象为空则返回null
     */
    public LimitBoardComparisonDTO convertUnits() {
        if (this.tradeDate == null) {
            return null;
        }

        return LimitBoardComparisonDTO.builder()
                .tradeDate(this.tradeDate)
                // 数量对比转换
                .limitUpCount(this.limitUpCount != null ? this.limitUpCount : 0)
                .limitDownCount(this.limitDownCount != null ? this.limitDownCount : 0)
                // 资金对比转换
                .limitUpTotalFunds(convertToYi(this.limitUpTotalFunds))
                .limitDownTotalFunds(convertToYi(this.limitDownTotalFunds))
                // 质量对比转换
                .limitUpOneWordRate(convertToPercentage(this.limitUpOneWordRate))
                .limitDownOneWordRate(convertToPercentage(this.limitDownOneWordRate))
                .limitUpContinuousRate(convertToPercentage(this.limitUpContinuousRate))
                .limitDownContinuousRate(convertToPercentage(this.limitDownContinuousRate))
                .build();
    }

    /**
     * 计算涨跌停比
     * 
     * @return 涨跌停比，如果跌停数量为0则返回最大值
     */
    public BigDecimal calculateLimitUpDownRatio() {
        Long upCount = this.limitUpCount != null ? this.limitUpCount : 0L;
        Long downCount = this.limitDownCount != null ? this.limitDownCount : 0L;
        
        if (downCount == 0) {
            return upCount > 0 ? new BigDecimal("999.99") : BigDecimal.ZERO;
        }
        
        return new BigDecimal(upCount)
                .divide(new BigDecimal(downCount), 2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 计算资金流向比
     * 
     * @return 资金流向比，如果跌停资金为0则返回最大值
     */
    public BigDecimal calculateFundFlowRatio() {
        BigDecimal upFunds = this.limitUpTotalFunds != null ? this.limitUpTotalFunds : BigDecimal.ZERO;
        BigDecimal downFunds = this.limitDownTotalFunds != null ? this.limitDownTotalFunds : BigDecimal.ZERO;
        
        if (downFunds.compareTo(BigDecimal.ZERO) == 0) {
            return upFunds.compareTo(BigDecimal.ZERO) > 0 ? new BigDecimal("999.99") : BigDecimal.ZERO;
        }
        
        return upFunds.divide(downFunds, 2, BigDecimal.ROUND_HALF_UP);
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
        return this.tradeDate != null && 
               (this.limitUpCount != null || this.limitDownCount != null);
    }

    /**
     * 判断市场情绪倾向
     * 
     * @return 市场情绪描述
     */
    public String getMarketSentiment() {
        BigDecimal ratio = calculateLimitUpDownRatio();
        
        if (ratio.compareTo(new BigDecimal("3")) >= 0) {
            return "极度乐观";
        } else if (ratio.compareTo(new BigDecimal("2")) >= 0) {
            return "乐观";
        } else if (ratio.compareTo(new BigDecimal("1")) >= 0) {
            return "中性偏乐观";
        } else if (ratio.compareTo(new BigDecimal("0.5")) >= 0) {
            return "中性偏悲观";
        } else if (ratio.compareTo(new BigDecimal("0.33")) >= 0) {
            return "悲观";
        } else {
            return "极度悲观";
        }
    }
}