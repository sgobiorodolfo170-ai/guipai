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
 * @description 连板成功率查询 DTO - 用于数据库查询结果映射
 * 用于分析N连板股票次日继续涨停/跌停的成功率统计
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContinuousLimitSuccessRateDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 连板数（2连板、3连板等）
     */
    private Integer continuousLimit;

    /**
     * 数据类型：LIMIT_UP-涨停板，LIMIT_DOWN-跌停板
     */
    private String dataType;

    /**
     * 总数量（该连板数的股票总数）
     */
    private Long totalCount;

    /**
     * 成功数量（次日继续涨停/跌停的数量）
     */
    private Long successCount;

    /**
     * 成功率（已计算好的百分比）
     */
    private BigDecimal successRate;

    /**
     * 数据转换方法：将数据库查询结果转换为响应格式
     * 
     * @return 转换后的数据，如果当前对象为空则返回null
     */
    public ContinuousLimitSuccessRateDTO convertUnits() {
        if (this.continuousLimit == null || this.dataType == null) {
            return null;
        }

        return ContinuousLimitSuccessRateDTO.builder()
                .continuousLimit(this.continuousLimit)
                .dataType(this.dataType)
                .totalCount(this.totalCount != null ? this.totalCount : 0L)
                .successCount(this.successCount != null ? this.successCount : 0L)
                .successRate(this.successRate != null ? this.successRate : calculateSuccessRate())
                .build();
    }

    /**
     * 计算成功率
     * 
     * @return 成功率（百分比），如果总数为0则返回0
     */
    public BigDecimal calculateSuccessRate() {
        if (this.totalCount == null || this.totalCount == 0) {
            return BigDecimal.ZERO;
        }
        
        Long successCountValue = this.successCount != null ? this.successCount : 0L;
        return new BigDecimal(successCountValue)
                .divide(new BigDecimal(this.totalCount), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 数据有效性验证
     * 
     * @return 如果数据有效返回true，否则返回false
     */
    public boolean isValid() {
        return this.continuousLimit != null && 
               this.continuousLimit > 0 &&
               this.dataType != null && 
               ("LIMIT_UP".equals(this.dataType) || "LIMIT_DOWN".equals(this.dataType)) &&
               this.totalCount != null;
    }

    /**
     * 判断是否为涨停板数据
     * 
     * @return 如果是涨停板数据返回true，否则返回false
     */
    public boolean isLimitUp() {
        return "LIMIT_UP".equals(this.dataType);
    }

    /**
     * 判断是否为跌停板数据
     * 
     * @return 如果是跌停板数据返回true，否则返回false
     */
    public boolean isLimitDown() {
        return "LIMIT_DOWN".equals(this.dataType);
    }

    /**
     * 获取数据类型描述
     * 
     * @return 数据类型的中文描述
     */
    public String getDataTypeDesc() {
        if ("LIMIT_UP".equals(this.dataType)) {
            return "涨停板";
        } else if ("LIMIT_DOWN".equals(this.dataType)) {
            return "跌停板";
        }
        return "未知类型";
    }

    /**
     * 获取连板描述
     * 
     * @return 连板数的中文描述
     */
    public String getContinuousLimitDesc() {
        if (this.continuousLimit == null) {
            return "未知连板";
        }
        
        String typeDesc = getDataTypeDesc();
        return this.continuousLimit + "连" + (isLimitUp() ? "涨停" : "跌停");
    }

    /**
     * 判断成功率等级
     * 
     * @return 成功率等级描述
     */
    public String getSuccessRateLevel() {
        BigDecimal rate = this.successRate != null ? this.successRate : calculateSuccessRate();
        
        if (rate.compareTo(new BigDecimal("80")) >= 0) {
            return "极高";
        } else if (rate.compareTo(new BigDecimal("60")) >= 0) {
            return "高";
        } else if (rate.compareTo(new BigDecimal("40")) >= 0) {
            return "中等";
        } else if (rate.compareTo(new BigDecimal("20")) >= 0) {
            return "低";
        } else {
            return "极低";
        }
    }
}