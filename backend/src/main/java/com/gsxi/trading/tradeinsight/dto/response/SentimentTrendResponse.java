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
 * @description 市场情绪趋势响应DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentTrendResponse implements Serializable {

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
     * 情绪趋势数据
     */
    private List<SentimentTrendData> trendData;

    /**
     * 平均情绪评分
     */
    private BigDecimal avgSentimentScore;

    /**
     * 情绪趋势方向（上升/下降/平稳）
     */
    private String trendDirection;

    /**
     * 情绪趋势数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SentimentTrendData implements Serializable {

        @Serial
        private static final long serialVersionUID = 1L;

        /**
         * 交易日期
         */
        @JsonFormat(pattern = "yyyy-MM-dd")
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
         * 情绪评分
         */
        private BigDecimal sentimentScore;

        /**
         * 情绪等级
         */
        private String sentimentLevel;
    }
}