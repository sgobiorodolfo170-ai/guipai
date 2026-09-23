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
 * @description 行业分析响应DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndustryAnalysisResponse implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 交易日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tradeDate;

    /**
     * 数据类型：LIMIT_UP/LIMIT_DOWN/ALL
     */
    private String dataType;

    /**
     * 行业统计数据
     */
    private List<IndustryStatistics> industryStats;

    /**
     * 最热行业
     */
    private String hotIndustry;

    /**
     * 涉及行业数
     */
    private Integer totalIndustryCount;

    /**
     * 行业统计数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IndustryStatistics implements Serializable {

        @Serial
        private static final long serialVersionUID = 1L;

        /**
         * 行业名称
         */
        private String industry;

        /**
         * 涨停股数量
         */
        private Integer limitUpCount;

        /**
         * 跌停股数量（当dataType为ALL时有值）
         */
        private Integer limitDownCount;

        /**
         * 占总涨停股比例
         */
        private BigDecimal percentage;

        /**
         * 平均涨幅
         */
        private BigDecimal avgIncrease;

        /**
         * 总封单资金（亿元）
         */
        private BigDecimal totalSealFunds;

        /**
         * 平均市值（亿元）
         */
        private BigDecimal avgMarketValue;

        /**
         * 排名
         */
        private Integer rank;
    }
}