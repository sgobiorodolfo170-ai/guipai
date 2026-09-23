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
 * @description 时间分布查询 DTO - 用于数据库查询结果映射
 * 用于统计不同时间段的涨跌停板分布情况
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeDistributionDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 时间区间（如：09:30-10:30）
     */
    private String timeRange;

    /**
     * 时间描述（如：早盘、午盘、尾盘）
     */
    private String timeDesc;

    /**
     * 数量
     */
    private Integer count;

    /**
     * 占比（已计算好的百分比）
     */
    private BigDecimal percentage;

    /**
     * 数据转换方法：将数据库查询结果转换为响应格式
     * 
     * @return 转换后的数据，如果当前对象为空则返回null
     */
    public TimeDistributionDTO convertUnits() {
        if (this.timeRange == null) {
            return null;
        }

        return TimeDistributionDTO.builder()
                .timeRange(this.timeRange)
                .timeDesc(this.timeDesc != null ? this.timeDesc : getTimeDescByRange(this.timeRange))
                .count(this.count != null ? this.count : 0)
                .percentage(this.percentage != null ? this.percentage : BigDecimal.ZERO)
                .build();
    }

    /**
     * 根据时间区间获取时间描述
     * 
     * @param timeRange 时间区间
     * @return 时间描述
     */
    private String getTimeDescByRange(String timeRange) {
        if (timeRange == null) {
            return "未知时段";
        }
        
        if (timeRange.contains("09:30") || timeRange.contains("10:")) {
            return "早盘";
        } else if (timeRange.contains("11:") || timeRange.contains("13:") || timeRange.contains("14:")) {
            return "午盘";
        } else if (timeRange.contains("14:30") || timeRange.contains("15:")) {
            return "尾盘";
        } else {
            return "其他时段";
        }
    }

    /**
     * 数据有效性验证
     * 
     * @return 如果数据有效返回true，否则返回false
     */
    public boolean isValid() {
        return this.timeRange != null && !this.timeRange.trim().isEmpty();
    }
}