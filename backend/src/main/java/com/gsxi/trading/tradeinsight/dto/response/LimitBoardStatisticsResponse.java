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
 * @description 涨跌停板统一统计响应DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LimitBoardStatisticsResponse implements Serializable {

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

    // ========== 基础统计（通用） ==========
    
    /**
     * 总数量
     */
    private Integer totalCount;

    /**
     * 一字板数量
     */
    private Integer oneWordBoardCount;

    /**
     * 最高连板数
     */
    private Integer maxContinuousLimit;

    /**
     * 连板率（2板及以上占比）
     */
    private BigDecimal continuousLimitRate;

    /**
     * 总封单资金（亿元）
     */
    private BigDecimal totalSealFunds;

    /**
     * 平均封单资金（万元）
     */
    private BigDecimal avgSealFunds;

    // ========== 涨停板特有字段（当dataType=LIMIT_UP时有值） ==========
    
    /**
     * 炸板回封数
     */
    private Integer blastAndResealCount;

    // ========== 跌停板特有字段（当dataType=LIMIT_DOWN时有值） ==========
    
    /**
     * 开板数量
     */
    private Integer openBoardCount;

    /**
     * 平均动态市盈率
     */
    private BigDecimal avgDynamicPe;

    // ========== 分布数据（通用） ==========
    
    /**
     * 连板分布
     */
    private List<ContinuousLimitDistribution> continuousDistribution;

    /**
     * 时间分布
     */
    private List<TimeDistribution> timeDistribution;

    /**
     * 行业分布
     */
    private List<IndustryDistribution> industryDistribution;

    // ========== 跌停板特有分布（当dataType=LIMIT_DOWN时有值） ==========
    
    /**
     * 市盈率分布
     */
    private List<PeDistribution> peDistribution;

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