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
 * @description 分位数分析响应DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PercentileAnalysisResponse implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 目标日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate targetDate;

    /**
     * 分析天数
     */
    private Integer days;

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

    // ========== 分位数分析 ==========
    
    /**
     * 涨停数量分位数（0-100）
     */
    private BigDecimal limitUpCountPercentile;

    /**
     * 跌停数量分位数（0-100）
     */
    private BigDecimal limitDownCountPercentile;

    /**
     * 涨跌停比分位数（0-100）
     */
    private BigDecimal limitUpDownRatioPercentile;



    // ========== 历史统计 ==========
    
    /**
     * 历史涨停数量最大值
     */
    private Integer historicalMaxLimitUpCount;

    /**
     * 历史涨停数量最小值
     */
    private Integer historicalMinLimitUpCount;

    /**
     * 历史涨停数量平均值
     */
    private BigDecimal historicalAvgLimitUpCount;

    /**
     * 历史跌停数量最大值
     */
    private Integer historicalMaxLimitDownCount;

    /**
     * 历史跌停数量最小值
     */
    private Integer historicalMinLimitDownCount;

    /**
     * 历史跌停数量平均值
     */
    private BigDecimal historicalAvgLimitDownCount;

    // ========== 异常检测 ==========
    
    /**
     * 是否异常高涨停（分位数>90）
     */
    private Boolean isAbnormallyHighLimitUp;

    /**
     * 是否异常高跌停（分位数>90）
     */
    private Boolean isAbnormallyHighLimitDown;

    /**
     * 市场状态评估（极度活跃/活跃/正常/冷清/极度冷清）
     */
    private String marketStateAssessment;
}