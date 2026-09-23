package com.gsxi.trading.tradeinsight.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/1/1
 * @description 涨跌停板质量分析统一响应DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LimitBoardQualityResponse implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 交易日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tradeDate;

    /**
     * 数据类型：LIMIT_UP/LIMIT_DOWN
     */
    private String dataType;

    /**
     * 数据类型描述：涨停板/跌停板
     */
    private String dataTypeDesc;

    // ========== 时间质量指标（通用） ==========
    
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

    // ========== 封单质量指标（通用） ==========
    
    /**
     * 封单强度分布
     */
    private List<SealStrengthDistribution> sealStrengthDist;

    /**
     * 平均封单强度（万元）
     */
    private BigDecimal avgSealStrength;

    /**
     * 强封单比例（>1000万）
     */
    private BigDecimal strongSealRate;

    // ========== 涨停板特有质量指标（当dataType=LIMIT_UP时有值） ==========
    
    /**
     * 炸板数量
     */
    private Integer blastCount;

    /**
     * 回封数量
     */
    private Integer resealCount;

    /**
     * 回封率
     */
    private BigDecimal resealRate;

    /**
     * 平均炸板次数
     */
    private BigDecimal avgBlastTimes;

    // ========== 跌停板特有质量指标（当dataType=LIMIT_DOWN时有值） ==========
    
    /**
     * 市盈率分布
     */
    private List<PeDistribution> peDistribution;

    /**
     * 平均动态市盈率
     */
    private BigDecimal avgDynamicPe;

    /**
     * 低估值比例（PE<20）
     */
    private BigDecimal lowPeRate;

    /**
     * 开板数量
     */
    private Integer openBoardCount;

    /**
     * 开板率
     */
    private BigDecimal openBoardRate;

    /**
     * 平均开板次数
     */
    private BigDecimal avgOpenTimes;

    // ========== 内部类定义 ==========
    
    /**
     * 封单强度分布数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SealStrengthDistribution implements Serializable {

        @Serial
        private static final long serialVersionUID = 1L;

        /**
         * 封单资金区间
         */
        private String range;

        /**
         * 数量
         */
        private Integer count;

        /**
         * 占比（百分比）
         */
        private BigDecimal percentage;
    }

    /**
     * 市盈率分布数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PeDistribution implements Serializable {

        @Serial
        private static final long serialVersionUID = 1L;

        /**
         * 市盈率区间
         */
        private String peRange;

        /**
         * 数量
         */
        private Integer count;

        /**
         * 占比（百分比）
         */
        private BigDecimal percentage;
    }
}