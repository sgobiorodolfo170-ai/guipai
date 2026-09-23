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
 * @description 市场情绪指标查询 DTO - 用于数据库查询结果映射
 * 用于计算和传输市场情绪相关的各项指标数据
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentIndicatorDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 交易日期
     */
    private LocalDate tradeDate;

    // ==================== 基础情绪指标 ====================
    
    /**
     * 涨跌停比
     */
    private BigDecimal limitUpDownRatio;

    /**
     * 连板率
     */
    private BigDecimal continuousLimitRate;

    /**
     * 炸板率
     */
    private BigDecimal blastRate;

    // ==================== 资金情绪指标 ====================
    
    /**
     * 总封单资金（单位：元，需要转换为亿元）
     */
    private BigDecimal totalSealFunds;

    /**
     * 平均封单资金（单位：元，需要转换为万元）
     */
    private BigDecimal avgSealFunds;

    // ==================== 时间情绪指标 ====================
    
    /**
     * 早盘涨停比例（10:30前）
     */
    private BigDecimal earlyLimitRate;

    /**
     * 尾盘涨停比例
     */
    private BigDecimal lateLimitRate;

    /**
     * 数据转换方法：将数据库查询结果转换为响应格式
     * 
     * @return 转换后的数据，如果当前对象为空则返回null
     */
    public SentimentIndicatorDTO convertUnits() {
        if (this.tradeDate == null) {
            return null;
        }

        return SentimentIndicatorDTO.builder()
                .tradeDate(this.tradeDate)
                // 基础情绪指标转换
                .limitUpDownRatio(this.limitUpDownRatio != null ? this.limitUpDownRatio : BigDecimal.ZERO)
                .continuousLimitRate(convertToPercentage(this.continuousLimitRate))
                .blastRate(convertToPercentage(this.blastRate))
                // 资金情绪指标转换
                .totalSealFunds(convertToYi(this.totalSealFunds))
                .avgSealFunds(convertToWan(this.avgSealFunds))
                // 时间情绪指标转换
                .earlyLimitRate(convertToPercentage(this.earlyLimitRate))
                .lateLimitRate(convertToPercentage(this.lateLimitRate))
                .build();
    }

    /**
     * 计算大单封板比例（封单资金>1000万的比例）
     * 
     * @param largeSealCount 大单封板数量
     * @param totalLimitCount 总涨停数量
     * @return 大单封板比例
     */
    public BigDecimal calculateLargeSealRate(Long largeSealCount, Long totalLimitCount) {
        if (totalLimitCount == null || totalLimitCount == 0) {
            return BigDecimal.ZERO;
        }
        
        Long largeSealCountValue = largeSealCount != null ? largeSealCount : 0L;
        return new BigDecimal(largeSealCountValue)
                .divide(new BigDecimal(totalLimitCount), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 计算资金集中度（前20%涨停股的封单资金占比）
     * 
     * @param top20PercentFunds 前20%涨停股的封单资金
     * @return 资金集中度
     */
    public BigDecimal calculateFundConcentration(BigDecimal top20PercentFunds) {
        if (this.totalSealFunds == null || this.totalSealFunds.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal top20Funds = top20PercentFunds != null ? top20PercentFunds : BigDecimal.ZERO;
        return top20Funds
                .divide(this.totalSealFunds, 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 计算平均首次封板时间（分钟数）
     * 
     * @param avgFirstLimitMinutes 平均首次封板时间（分钟）
     * @return 平均首次封板时间
     */
    public BigDecimal calculateAvgFirstLimitTime(BigDecimal avgFirstLimitMinutes) {
        return avgFirstLimitMinutes != null ? avgFirstLimitMinutes : BigDecimal.ZERO;
    }

    /**
     * 计算综合情绪评分（0-100分）
     * 
     * @return 综合情绪评分
     */
    public BigDecimal calculateSentimentScore() {
        BigDecimal score = BigDecimal.ZERO;
        
        // 涨跌停比权重：30%
        BigDecimal ratioScore = calculateRatioScore();
        score = score.add(ratioScore.multiply(new BigDecimal("0.3")));
        
        // 连板率权重：25%
        BigDecimal continuousScore = calculateContinuousScore();
        score = score.add(continuousScore.multiply(new BigDecimal("0.25")));
        
        // 炸板率权重：20%（炸板率越低越好）
        BigDecimal blastScore = calculateBlastScore();
        score = score.add(blastScore.multiply(new BigDecimal("0.2")));
        
        // 早盘涨停率权重：15%
        BigDecimal earlyScore = calculateEarlyScore();
        score = score.add(earlyScore.multiply(new BigDecimal("0.15")));
        
        // 资金强度权重：10%
        BigDecimal fundScore = calculateFundScore();
        score = score.add(fundScore.multiply(new BigDecimal("0.1")));
        
        return score.setScale(2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 获取情绪等级描述
     * 
     * @return 情绪等级
     */
    public String getSentimentLevel() {
        BigDecimal score = calculateSentimentScore();
        
        if (score.compareTo(new BigDecimal("80")) >= 0) {
            return "极度乐观";
        } else if (score.compareTo(new BigDecimal("60")) >= 0) {
            return "乐观";
        } else if (score.compareTo(new BigDecimal("40")) >= 0) {
            return "中性";
        } else if (score.compareTo(new BigDecimal("20")) >= 0) {
            return "悲观";
        } else {
            return "极度悲观";
        }
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 计算涨跌停比评分
     */
    private BigDecimal calculateRatioScore() {
        if (this.limitUpDownRatio == null) {
            return BigDecimal.ZERO;
        }
        
        if (this.limitUpDownRatio.compareTo(new BigDecimal("3")) >= 0) {
            return new BigDecimal("100");
        } else if (this.limitUpDownRatio.compareTo(new BigDecimal("1")) >= 0) {
            return this.limitUpDownRatio.multiply(new BigDecimal("33.33"));
        } else {
            return this.limitUpDownRatio.multiply(new BigDecimal("50"));
        }
    }

    /**
     * 计算连板率评分
     */
    private BigDecimal calculateContinuousScore() {
        if (this.continuousLimitRate == null) {
            return BigDecimal.ZERO;
        }
        
        // 连板率转换为0-100分
        return this.continuousLimitRate.multiply(new BigDecimal("2"));
    }

    /**
     * 计算炸板率评分（炸板率越低分数越高）
     */
    private BigDecimal calculateBlastScore() {
        if (this.blastRate == null) {
            return new BigDecimal("100");
        }
        
        // 炸板率越低越好，满分100减去炸板率的2倍
        BigDecimal score = new BigDecimal("100").subtract(this.blastRate.multiply(new BigDecimal("2")));
        return score.max(BigDecimal.ZERO);
    }

    /**
     * 计算早盘涨停率评分
     */
    private BigDecimal calculateEarlyScore() {
        if (this.earlyLimitRate == null) {
            return BigDecimal.ZERO;
        }
        
        // 早盘涨停率转换为0-100分
        return this.earlyLimitRate.multiply(new BigDecimal("2"));
    }

    /**
     * 计算资金强度评分
     */
    private BigDecimal calculateFundScore() {
        if (this.avgSealFunds == null) {
            return BigDecimal.ZERO;
        }
        
        // 平均封单资金评分（万元为单位）
        if (this.avgSealFunds.compareTo(new BigDecimal("5000")) >= 0) {
            return new BigDecimal("100");
        } else if (this.avgSealFunds.compareTo(new BigDecimal("1000")) >= 0) {
            return this.avgSealFunds.divide(new BigDecimal("50"), 2, BigDecimal.ROUND_HALF_UP);
        } else {
            return this.avgSealFunds.divide(new BigDecimal("20"), 2, BigDecimal.ROUND_HALF_UP);
        }
    }

    /**
     * 将元转换为亿元
     */
    private BigDecimal convertToYi(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.divide(new BigDecimal("100000000"), 2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 将元转换为万元
     */
    private BigDecimal convertToWan(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.divide(new BigDecimal("10000"), 2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 将小数转换为百分比格式
     */
    private BigDecimal convertToPercentage(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.multiply(new BigDecimal("100")).setScale(2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 数据有效性验证
     */
    public boolean isValid() {
        return this.tradeDate != null;
    }
}