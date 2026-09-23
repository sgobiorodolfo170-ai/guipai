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
 * @description 市盈率分布查询 DTO - 用于数据库查询结果映射
 * 专门用于跌停板的市盈率分布统计
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeDistributionDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 市盈率区间（如：0-20、20-50、50-100等）
     */
    private String peRange;

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
    public PeDistributionDTO convertUnits() {
        if (this.peRange == null) {
            return null;
        }

        return PeDistributionDTO.builder()
                .peRange(this.peRange)
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
        return this.peRange != null && !this.peRange.trim().isEmpty();
    }

    /**
     * 获取估值水平描述
     * 
     * @return 估值水平描述
     */
    public String getValuationLevel() {
        if (this.peRange == null) {
            return "未知";
        }
        
        if (this.peRange.contains("负值") || this.peRange.contains("零")) {
            return "亏损股";
        } else if (this.peRange.contains("0-20")) {
            return "低估值";
        } else if (this.peRange.contains("20-50")) {
            return "合理估值";
        } else if (this.peRange.contains("50-100")) {
            return "高估值";
        } else if (this.peRange.contains("100以上")) {
            return "超高估值";
        } else if (this.peRange.contains("未知")) {
            return "无法评估";
        } else {
            return "其他";
        }
    }

    /**
     * 判断是否为低估值股票
     * 
     * @return 如果是低估值股票返回true，否则返回false
     */
    public boolean isLowValuation() {
        return this.peRange != null && this.peRange.contains("0-20");
    }

    /**
     * 判断是否为高估值股票
     * 
     * @return 如果是高估值股票返回true，否则返回false
     */
    public boolean isHighValuation() {
        return this.peRange != null && 
               (this.peRange.contains("50-100") || this.peRange.contains("100以上"));
    }
}