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
 * @description 跌停板反弹分析响应DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LimitDownReboundResponse implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 交易日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tradeDate;

    // ========== 反弹统计 ==========
    
    /**
     * 跌停总数
     */
    private Integer totalLimitDownCount;

    /**
     * 次日反弹数量
     */
    private Integer reboundCount;

    /**
     * 反弹率
     */
    private BigDecimal reboundRate;

    /**
     * 平均反弹幅度
     */
    private BigDecimal avgReboundIncrease;

    // ========== 按连跌停数分析 ==========
    
    /**
     * 按连跌停数分析
     */
    private List<ReboundByConsecutive> reboundByConsecutive;

    // ========== 按行业分析 ==========
    
    /**
     * 按行业分析
     */
    private List<ReboundByIndustry> reboundByIndustry;

    // ========== 按市盈率分析 ==========
    
    /**
     * 按市盈率分析
     */
    private List<ReboundByPe> reboundByPe;

    // ========== 内部类定义 ==========
    
    /**
     * 按连跌停数反弹分析
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReboundByConsecutive implements Serializable {

        @Serial
        private static final long serialVersionUID = 1L;

        /**
         * 连跌停数
         */
        private Integer consecutiveLimit;

        /**
         * 总数
         */
        private Integer totalCount;

        /**
         * 反弹数
         */
        private Integer reboundCount;

        /**
         * 反弹率
         */
        private BigDecimal reboundRate;
    }

    /**
     * 按行业反弹分析
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReboundByIndustry implements Serializable {

        @Serial
        private static final long serialVersionUID = 1L;

        /**
         * 行业
         */
        private String industry;

        /**
         * 总数
         */
        private Integer totalCount;

        /**
         * 反弹数
         */
        private Integer reboundCount;

        /**
         * 反弹率
         */
        private BigDecimal reboundRate;
    }

    /**
     * 按市盈率反弹分析
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReboundByPe implements Serializable {

        @Serial
        private static final long serialVersionUID = 1L;

        /**
         * 市盈率区间
         */
        private String peRange;

        /**
         * 总数
         */
        private Integer totalCount;

        /**
         * 反弹数
         */
        private Integer reboundCount;

        /**
         * 反弹率
         */
        private BigDecimal reboundRate;
    }
}