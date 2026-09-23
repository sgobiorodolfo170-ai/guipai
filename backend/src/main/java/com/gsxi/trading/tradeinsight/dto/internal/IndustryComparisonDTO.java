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
 * @description 行业涨跌停对比查询 DTO - 用于数据库查询结果映射
 * 用于统计各行业涨停和跌停股票的对比情况
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndustryComparisonDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 行业名称
     */
    private String industry;

    /**
     * 涨停股数量
     */
    private Long limitUpCount;

    /**
     * 跌停股数量
     */
    private Long limitDownCount;

    /**
     * 净比率（涨停-跌停）/总数（已计算好的百分比）
     */
    private BigDecimal netRatio;

    /**
     * 数据转换方法：将数据库查询结果转换为响应格式
     * 
     * @return 转换后的数据，如果当前对象为空则返回null
     */
    public IndustryComparisonDTO convertUnits() {
        if (this.industry == null) {
            return null;
        }

        return IndustryComparisonDTO.builder()
                .industry(this.industry)
                .limitUpCount(this.limitUpCount != null ? this.limitUpCount : 0L)
                .limitDownCount(this.limitDownCount != null ? this.limitDownCount : 0L)
                .netRatio(this.netRatio != null ? this.netRatio : calculateNetRatio())
                .build();
    }

    /**
     * 计算净比率
     * 
     * @return 净比率（百分比）
     */
    public BigDecimal calculateNetRatio() {
        Long upCount = this.limitUpCount != null ? this.limitUpCount : 0L;
        Long downCount = this.limitDownCount != null ? this.limitDownCount : 0L;
        Long totalCount = upCount + downCount;
        
        if (totalCount == 0) {
            return BigDecimal.ZERO;
        }
        
        Long netCount = upCount - downCount;
        return new BigDecimal(netCount)
                .divide(new BigDecimal(totalCount), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 计算涨跌停比
     * 
     * @return 涨跌停比
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
     * 获取行业情绪描述
     * 
     * @return 行业情绪描述
     */
    public String getIndustrySentiment() {
        BigDecimal netRatio = this.netRatio != null ? this.netRatio : calculateNetRatio();
        
        if (netRatio.compareTo(new BigDecimal("50")) >= 0) {
            return "极度乐观";
        } else if (netRatio.compareTo(new BigDecimal("20")) >= 0) {
            return "乐观";
        } else if (netRatio.compareTo(new BigDecimal("-20")) >= 0) {
            return "中性";
        } else if (netRatio.compareTo(new BigDecimal("-50")) >= 0) {
            return "悲观";
        } else {
            return "极度悲观";
        }
    }

    /**
     * 判断是否为热点行业
     * 
     * @return 如果是热点行业返回true，否则返回false
     */
    public boolean isHotIndustry() {
        Long upCount = this.limitUpCount != null ? this.limitUpCount : 0L;
        Long downCount = this.limitDownCount != null ? this.limitDownCount : 0L;
        
        // 涨停股数量大于等于3且涨停股数量大于跌停股数量
        return upCount >= 3 && upCount > downCount;
    }

    /**
     * 判断是否为冷门行业
     * 
     * @return 如果是冷门行业返回true，否则返回false
     */
    public boolean isColdIndustry() {
        Long upCount = this.limitUpCount != null ? this.limitUpCount : 0L;
        Long downCount = this.limitDownCount != null ? this.limitDownCount : 0L;
        
        // 跌停股数量大于等于3且跌停股数量大于涨停股数量
        return downCount >= 3 && downCount > upCount;
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