package com.gsxi.trading.tradeinsight.dto.request;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;

/**
 * 股票历史数据查询请求参数
 * 
 * @author Kiro
 * @version 1.0
 * @date 2025-08-19
 * @description 用于查询股票历史日/周/月线数据的请求参数
 */
@Data
public class StockHistoryRequest {
    
    /**
     * 股票代码（如 600000）
     */
    @NotBlank(message = "股票代码不能为空")
    private String symbol;
    
    /**
     * 周期：daily (日), weekly (周), monthly (月)
     */
    private String period = "daily";
    
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