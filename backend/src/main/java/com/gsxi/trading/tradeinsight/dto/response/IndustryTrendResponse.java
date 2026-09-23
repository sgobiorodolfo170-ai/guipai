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
 * @description 行业趋势分析响应DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndustryTrendResponse implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 开始日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    /**
     * 结束日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    /**
     * 数据类型：LIMIT_UP/LIMIT_DOWN/ALL
     */
    private String dataType;

    /**
     * 行业趋势数据
     */
    private List<IndustryTrendData> industryTrends;

    /**
     * 热点行业轮动分析
     */
    private List<String> hotIndustryRotation;

    /**
     * 行业趋势数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IndustryTrendData implements Serializable {

        @Serial
        private static final long serialVersionUID = 1L;

        /**
         * 行业名称
         */
        private String industry;

        /**
         * 日期趋势数据
         */
        private List<DailyIndustryData> dailyData;

        /**
         * 平均涨停数量
         */
        private BigDecimal avgLimitCount;

        /**
         * 趋势方向（上升/下降/平稳）
         */
        private String trendDirection;
    }

    /**
     * 每日行业数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyIndustryData implements Serializable {

        @Serial
        private static final long serialVersionUID = 1L;

        /**
         * 交易日期
         */
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate tradeDate;

        /**
         * 涨停数量
         */
        private Integer limitUpCount;

        /**
         * 跌停数量（当dataType为ALL时有值）
         */
        private Integer limitDownCount;

        /**
         * 占比
         */
        private BigDecimal percentage;
    }
}