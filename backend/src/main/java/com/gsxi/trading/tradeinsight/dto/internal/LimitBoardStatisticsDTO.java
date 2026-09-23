package com.gsxi.trading.tradeinsight.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/1/1
 * @description 统一的涨跌停板统计查询 DTO - 用于数据库查询结果映射
 * 通过 dataType 字段区分涨停板和跌停板数据，实现统一的数据结构
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LimitBoardStatisticsDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 交易日期
     */
    private LocalDate tradeDate;

    /**
     * 数据类型：LIMIT_UP-涨停板，LIMIT_DOWN-跌停板
     */
    private String dataType;

    // ==================== 通用统计字段 ====================
    
    /**
     * 总数量（涨停股数量或跌停股数量）
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
     * 总封单资金（单位：元，需要转换为亿元）
     */
    private BigDecimal totalSealFunds;

    /**
     * 平均封单资金（单位：元，需要转换为万元）
     */
    private BigDecimal avgSealFunds;

    // ==================== 涨停板特有字段 ====================
    
    /**
     * 炸板回封数量（仅涨停板有效）
     */
    private Integer blastAndResealCount;

    // ==================== 跌停板特有字段 ====================
    
    /**
     * 开板数量（仅跌停板有效）
     */
    private Integer openBoardCount;

    /**
     * 平均动态市盈率（仅跌停板有效）
     */
    private BigDecimal avgDynamicPe;

    /**
     * 数据转换方法：将数据库查询结果转换为响应格式
     * 
     * @return 转换后的数据，如果当前对象为空则返回null
     */
    public LimitBoardStatisticsDTO convertUnits() {
        if (this.tradeDate == null || this.dataType == null) {
            return null;
        }

        return LimitBoardStatisticsDTO.builder()
                .tradeDate(this.tradeDate)
                .dataType(this.dataType)
                // 通用字段转换
                .totalCount(this.totalCount != null ? this.totalCount : 0)
                .oneWordBoardCount(this.oneWordBoardCount != null ? this.oneWordBoardCount : 0)
                .maxContinuousLimit(this.maxContinuousLimit != null ? this.maxContinuousLimit : 0)
                .totalSealFunds(convertToYi(this.totalSealFunds))
                .avgSealFunds(convertToWan(this.avgSealFunds))
                // 涨停板特有字段转换
                .blastAndResealCount(this.blastAndResealCount != null ? this.blastAndResealCount : 0)
                // 跌停板特有字段转换
                .openBoardCount(this.openBoardCount != null ? this.openBoardCount : 0)
                .avgDynamicPe(this.avgDynamicPe != null ? this.avgDynamicPe : BigDecimal.ZERO)
                .build();
    }

    /**
     * 将元转换为亿元
     * 
     * @param value 原始值（元）
     * @return 转换后的值（亿元），保留2位小数
     */
    private BigDecimal convertToYi(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.divide(new BigDecimal("100000000"), 2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 将元转换为万元
     * 
     * @param value 原始值（元）
     * @return 转换后的值（万元），保留2位小数
     */
    private BigDecimal convertToWan(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.divide(new BigDecimal("10000"), 2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * 数据有效性验证
     * 
     * @return 如果数据有效返回true，否则返回false
     */
    public boolean isValid() {
        return this.tradeDate != null && 
               this.dataType != null && 
               ("LIMIT_UP".equals(this.dataType) || "LIMIT_DOWN".equals(this.dataType));
    }

    /**
     * 判断是否为涨停板数据
     * 
     * @return 如果是涨停板数据返回true，否则返回false
     */
    public boolean isLimitUp() {
        return "LIMIT_UP".equals(this.dataType);
    }

    /**
     * 判断是否为跌停板数据
     * 
     * @return 如果是跌停板数据返回true，否则返回false
     */
    public boolean isLimitDown() {
        return "LIMIT_DOWN".equals(this.dataType);
    }

    /**
     * 获取数据类型描述
     * 
     * @return 数据类型的中文描述
     */
    public String getDataTypeDesc() {
        if ("LIMIT_UP".equals(this.dataType)) {
            return "涨停板";
        } else if ("LIMIT_DOWN".equals(this.dataType)) {
            return "跌停板";
        }
        return "未知类型";
    }
}