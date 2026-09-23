package com.gsxi.trading.tradeinsight.dto.request;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * 股票分钟级K线数据查询请求参数
 * 
 * @author Kiro
 * @version 1.0
 * @date 2025-08-19
 * @description 用于查询股票分钟级K线数据的请求参数
 */
@Data
public class StockMinuteRequest {
    
    /**
     * 股票代码
     */
    @NotBlank(message = "股票代码不能为空")
    private String symbol;
    
    /**
     * 分钟周期：1,5,15,30,60
     */
    @Pattern(regexp = "^(1|5|15|30|60)$", message = "分钟周期只能是1,5,15,30,60")
    private String period = "5";

    /**
     * 开始日期（格式：20230812）
     */
    private String startDate;

    /**
     * 结束日期（格式：20230819）
     */
    private String endDate;
    
    /**
     * 复权类型
     */
    private String adjust = "qfq";
}