package com.gsxi.trading.tradeinsight.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * @author gsxi
 * @date 2025/9/4
 * @description 单次交易记录DTO（内嵌在SimSingleTraining中）
 * @version 1.0
 */
@Data
public class TradeData {
    private String tradeType; // 交易类型：buy（买入）/ sell（卖出）
    private BigDecimal price; // 交易价格
    private Integer amount; // 交易数量（股）
    private BigDecimal total; // 交易总金额（price * amount）
    private Integer klineIndex; // 对应K线的索引（第N天K线，前端匹配用）
    private LocalDate tradeDate; // 交易日期（对应K线日期）
}
