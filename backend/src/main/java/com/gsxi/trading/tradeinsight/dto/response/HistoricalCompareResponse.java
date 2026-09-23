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

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/1/1
 * @description 历史对比分析响应DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoricalCompareResponse implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 目标日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate targetDate;

    /**
     * 对比类型：SAME_PERIOD（同期对比）/PREVIOUS_PERIOD（前期对比）
     */
    private String compareType;

    /**
     * 对比类型描述
     */
    private String compareTypeDesc;

    // ========== 当前数据 ==========
    
    /**
     * 当前涨停数量
     */
    private Integer currentLimitUpCount;

    /**
     * 当前跌停数量
     */
    private Integer currentLimitDownCount;

    /**
     * 当前涨跌停比
     */
    private BigDecimal currentLimitUpDownRatio;

    /**
     * 当前连板率
     */
    private BigDecimal currentContinuousLimitRate;

    // ========== 对比数据 ==========
    
    /**
     * 对比日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate compareDate;

    /**
     * 对比涨停数量
     */
    private Integer compareLimitUpCount;

    /**
     * 对比跌停数量
     */
    private Integer compareLimitDownCount;

    /**
     * 对比涨跌停比
     */
    private BigDecimal compareLimitUpDownRatio;

    /**
     * 对比连板率
     */
    private BigDecimal compareContinuousLimitRate;

    // ========== 变化幅度 ==========
    
    /**
     * 涨停数量变化幅度
     */
    private BigDecimal limitUpCountChange;

    /**
     * 跌停数量变化幅度
     */
    private BigDecimal limitDownCountChange;

    /**
     * 涨跌停比变化幅度
     */
    private BigDecimal limitUpDownRatioChange;

    /**
     * 连板率变化幅度
     */
    private BigDecimal continuousLimitRateChange;

    // ========== 分析结论 ==========
    
    /**
     * 市场活跃度对比（更活跃/相当/较冷清）
     */
    private String marketActivityComparison;

    /**
     * 情绪对比（更乐观/相当/更悲观）
     */
    private String sentimentComparison;
}