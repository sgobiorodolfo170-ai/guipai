package com.gsxi.trading.tradeinsight.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/1/1
 * @description 连板成功率分析响应DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContinuousLimitSuccessRateResponse implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 数据类型：LIMIT_UP/LIMIT_DOWN
     */
    private String dataType;

    /**
     * 数据类型描述：涨停板/跌停板
     */
    private String dataTypeDesc;

    /**
     * 连板成功率数据
     */
    private List<SuccessRateData> successRateData;

    /**
     * 整体成功率
     */
    private BigDecimal overallSuccessRate;

    /**
     * 连板成功率数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuccessRateData implements Serializable {

        @Serial
        private static final long serialVersionUID = 1L;

        /**
         * 连板数
         */
        private Integer continuousLimit;

        /**
         * 总数量
         */
        private Long totalCount;

        /**
         * 成功数量（次日继续涨停/跌停）
         */
        private Long successCount;

        /**
         * 成功率
         */
        private BigDecimal successRate;
    }
}