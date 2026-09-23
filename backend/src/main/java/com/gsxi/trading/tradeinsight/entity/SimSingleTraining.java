package com.gsxi.trading.tradeinsight.entity;

import com.gsxi.trading.tradeinsight.config.TradeDataListConverter;
import com.gsxi.trading.tradeinsight.dto.TradeData;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;


/**
 * @author gsxi
 * @version 1.0
 * @date 2025/9/4
 * @description 单人K线模拟记录表实体
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sim_single_training")
public class SimSingleTraining {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "stock_name", nullable = false, length = 50)
    private String stockName;

    @Column(name = "stock_code", nullable = false, length = 20)
    private String stockCode;

    @Column(name = "start_time", nullable = false)
    private LocalDate startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDate endTime;

    @Column(name = "initial_capital", nullable = false, precision = 15, scale = 2)
    private BigDecimal initialCapital;

    @Column(name = "final_capital", nullable = false, precision = 15, scale = 2)
    private BigDecimal finalCapital;

    @Column(name = "total_profit", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalProfit;

    @Column(name = "operation_profit_rate", nullable = false, precision = 10, scale = 4)
    private BigDecimal operationProfitRate;

    @Column(name = "excess_profit_rate", nullable = false, precision = 10, scale = 4)
    private BigDecimal excessProfitRate;

    @Column(name = "stock_range_profit_rate", nullable = false, precision = 10, scale = 4)
    private BigDecimal stockRangeProfitRate;

    @Column(name = "trade_times", nullable = false)
    private Integer tradeTimes;

    @Column(name = "trade_datas", nullable = false, columnDefinition = "json")
    @Convert(converter = TradeDataListConverter.class)
    private List<TradeData> tradeDatas;

    @Column(name = "status", nullable = false, columnDefinition = "tinyint default 1")
    private Integer status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
