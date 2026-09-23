package com.gsxi.trading.tradeinsight.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/1/1
 * @description 时间分布数据
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeDistribution implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 时间区间（如：09:30-10:30）
     */
    private String timeRange;

    /**
     * 时间描述（如：早盘、午盘、尾盘）
     */
    private String timeDesc;

    /**
     * 数量
     */
    private Integer count;

    /**
     * 占比（百分比）
     */
    private BigDecimal percentage;
}