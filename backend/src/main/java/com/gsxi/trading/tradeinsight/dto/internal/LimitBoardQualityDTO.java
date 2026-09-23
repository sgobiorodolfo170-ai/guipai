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
 * @description 统一的涨跌停板质量分析查询 DTO - 用于数据库查询结果映射
 * 通过 dataType 字段区分涨停板和跌停板的质量分析数据
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LimitBoardQualityDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 交易日期
     */
    private LocalDate tradeDate;

    /**
     * 数据类型：LIMIT_UP-涨停板，LIMIT_DOWN-跌停板
     */
    private String dataType;

    // ==================== 通用质量指标 ====================
    
    /**
     * 一字板比例
     */
    private BigDecimal oneWordBoardRate;

    /**
     * 早盘封板比例（10:30前）
     */
    private BigDecimal earlyLimitRate;

    /**
     * 午盘封板比例
     */
    private BigDecimal noonLimitRate;

    /**
     * 尾盘封板比例
     */
    private BigDecimal lateLimitRate;

    /**
     * 平均封单强度
     */
    private BigDecimal avgSealStrength;

    /**
     * 强封单比例（>1000万）
     */
    private BigDecimal strongSealRate;

    // ==================== 涨停板特有质量指标 ====================
    
    /**
     * 炸板数量（仅涨停板有效）
     */
    private Integer blastCount;

    /**
     * 回封数量（仅涨停板有效）
     */
    private Integer resealCount;

    /**
     * 平均炸板次数（仅涨停板有效）
     */
    private BigDecimal avgBlastTimes;

    // ==================== 跌停板特有质量指标 ====================
    
    /**
     * 平均动态市盈率（仅跌停板有效）
     */
    private BigDecimal avgDynamicPe;

    /**
     * 低估值比例（PE<20）（仅跌停板有效）
     */
    private BigDecimal lowPeRate;

    /**
     * 开板数量（仅跌停板有效）
     */
    private Integer openBoardCount;

    /**
     * 平均开板次数（仅跌停板有效）
     */
    private BigDecimal avgOpenTimes;

    /**
     * 数据转换方法：将数据库查询结果转换为响应格式
     * 
     * @return 转换后的数据，如果当前对象为空则返回null
     */
    public LimitBoardQualityDTO convertUnits() {
        if (this.tradeDate == null || this.dataType == null) {
            return null;
        }

        return LimitBoardQualityDTO.builder()
                .tradeDate(this.tradeDate)
                .dataType(this.dataType)
                // 通用质量指标转换
                .oneWordBoardRate(convertToPercentage(this.oneWordBoardRate))
                .earlyLimitRate(convertToPercentage(this.earlyLimitRate))
                .noonLimitRate(convertToPercentage(this.noonLimitRate))
                .lateLimitRate(convertToPercentage(this.lateLimitRate))
                .avgSealStrength(this.avgSealStrength != null ? this.avgSealStrength : BigDecimal.ZERO)
                .strongSealRate(convertToPercentage(this.strongSealRate))
                // 涨停板特有指标转换
                .blastCount(this.blastCount != null ? this.blastCount : 0)
                .resealCount(this.resealCount != null ? this.resealCount : 0)
                .avgBlastTimes(this.avgBlastTimes != null ? this.avgBlastTimes : BigDecimal.ZERO)
                // 跌停板特有指标转换
                .avgDynamicPe(this.avgDynamicPe != null ? this.avgDynamicPe : BigDecimal.ZERO)
                .lowPeRate(convertToPercentage(this.lowPeRate))
                .openBoardCount(this.openBoardCount != null ? this.openBoardCount : 0)
                .avgOpenTimes(this.avgOpenTimes != null ? this.avgOpenTimes : BigDecimal.ZERO)
                .build();
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
     * 计算回封率（仅涨停板有效）
     * 
     * @return 回封率，如果炸板数量为0则返回0
     */
    public BigDecimal calculateResealRate() {
        if (!isLimitUp() || this.blastCount == null || this.blastCount == 0) {
            return BigDecimal.ZERO;
        }
        
        int resealCountValue = this.resealCount != null ? this.resealCount : 0;
        return new BigDecimal(resealCountValue)
                .divide(new BigDecimal(this.blastCount), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 计算开板率（仅跌停板有效）
     * 
     * @param totalLimitDownCount 总跌停数量
     * @return 开板率
     */
    public BigDecimal calculateOpenBoardRate(Long totalLimitDownCount) {
        if (!isLimitDown() || totalLimitDownCount == null || totalLimitDownCount == 0) {
            return BigDecimal.ZERO;
        }
        
        int openBoardCountValue = this.openBoardCount != null ? this.openBoardCount : 0;
        return new BigDecimal(openBoardCountValue)
                .divide(new BigDecimal(totalLimitDownCount), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 数据有效性验证
     * 
     * @return 如果数据有效返回true，否则返回false
     */
    public boolean isValid() {
        return this.tradeDate != null && 
               this.dataType != null && 
               ("LIMIT_UP".equals(this.dataType) || "LIMIT_DOWN".equals(this.dataType));
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
}