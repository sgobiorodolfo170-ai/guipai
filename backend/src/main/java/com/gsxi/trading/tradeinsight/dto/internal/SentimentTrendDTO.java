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
 * @description 市场情绪趋势查询 DTO - 用于数据库查询结果映射
 * 用于分析一段时间内市场情绪指标的变化趋势
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentTrendDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 交易日期
     */
    private LocalDate tradeDate;

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

    /**
     * 总封单资金（单位：元，需要转换为亿元）
     */
    private BigDecimal totalSealFunds;

    /**
     * 平均封单资金（单位：元，需要转换为万元）
     */
    private BigDecimal avgSealFunds;

    /**
     * 早盘涨停比例
     */
    private BigDecimal earlyLimitRate;

    /**
     * 尾盘涨停比例
     */
    private BigDecimal lateLimitRate;

    /**
     * 涨停股数量
     */
    private Long limitUpCount;

    /**
     * 跌停股数量
     */
    private Long limitDownCount;

    /**
     * 数据转换方法：将数据库查询结果转换为响应格式
     * 
     * @return 转换后的数据，如果当前对象为空则返回null
     */
    public SentimentTrendDTO convertUnits() {
        if (this.tradeDate == null) {
            return null;
        }

        return SentimentTrendDTO.builder()
                .tradeDate(this.tradeDate)
                .limitUpDownRatio(this.limitUpDownRatio != null ? this.limitUpDownRatio : BigDecimal.ZERO)
                .continuousLimitRate(convertToPercentage(this.continuousLimitRate))
                .blastRate(convertToPercentage(this.blastRate))
                .totalSealFunds(convertToYi(this.totalSealFunds))
                .avgSealFunds(convertToWan(this.avgSealFunds))
                .earlyLimitRate(convertToPercentage(this.earlyLimitRate))
                .lateLimitRate(convertToPercentage(this.lateLimitRate))
                .limitUpCount(this.limitUpCount != null ? this.limitUpCount : 0L)
                .limitDownCount(this.limitDownCount != null ? this.limitDownCount : 0L)
                .build();
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

    /**
     * 计算与前一日的情绪变化
     * 
     * @param previousDay 前一日的情绪趋势数据
     * @return 情绪变化描述
     */
    public String calculateSentimentChange(SentimentTrendDTO previousDay) {
        if (previousDay == null) {
            return "无对比数据";
        }
        
        BigDecimal currentScore = this.calculateSentimentScore();
        BigDecimal previousScore = previousDay.calculateSentimentScore();
        BigDecimal change = currentScore.subtract(previousScore);
        
        if (change.compareTo(new BigDecimal("10")) >= 0) {
            return "大幅改善";
        } else if (change.compareTo(new BigDecimal("5")) >= 0) {
            return "明显改善";
        } else if (change.compareTo(new BigDecimal("2")) >= 0) {
            return "小幅改善";
        } else if (change.compareTo(new BigDecimal("-2")) >= 0) {
            return "基本持平";
        } else if (change.compareTo(new BigDecimal("-5")) >= 0) {
            return "小幅恶化";
        } else if (change.compareTo(new BigDecimal("-10")) >= 0) {
            return "明显恶化";
        } else {
            return "大幅恶化";
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