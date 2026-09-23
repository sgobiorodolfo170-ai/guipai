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
 * @description 封单强度分布查询 DTO - 用于数据库查询结果映射
 * 用于统计不同封单资金区间的涨跌停板分布情况
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SealStrengthDistributionDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 封单资金区间（如：0-100万、100-500万等）
     */
    private String range;

    /**
     * 数量
     */
    private Long count;

    /**
     * 占比（已计算好的百分比）
     */
    private BigDecimal percentage;

    /**
     * 数据转换方法：将数据库查询结果转换为响应格式
     * 
     * @return 转换后的数据，如果当前对象为空则返回null
     */
    public SealStrengthDistributionDTO convertUnits() {
        if (this.range == null) {
            return null;
        }

        return SealStrengthDistributionDTO.builder()
                .range(this.range)
                .count(this.count != null ? this.count : 0L)
                .percentage(this.percentage != null ? this.percentage : BigDecimal.ZERO)
                .build();
    }

    /**
     * 数据有效性验证
     * 
     * @return 如果数据有效返回true，否则返回false
     */
    public boolean isValid() {
        return this.range != null && !this.range.trim().isEmpty();
    }

    /**
     * 获取封单强度等级
     * 
     * @return 封单强度等级描述
     */
    public String getStrengthLevel() {
        if (this.range == null) {
            return "未知";
        }
        
        if (this.range.contains("5000万以上") || this.range.contains("1亿以上")) {
            return "超强封单";
        } else if (this.range.contains("1000万") && this.range.contains("5000万")) {
            return "强封单";
        } else if (this.range.contains("500万") && this.range.contains("1000万")) {
            return "中等封单";
        } else if (this.range.contains("100万") && this.range.contains("500万")) {
            return "一般封单";
        } else {
            return "弱封单";
        }
    }
}