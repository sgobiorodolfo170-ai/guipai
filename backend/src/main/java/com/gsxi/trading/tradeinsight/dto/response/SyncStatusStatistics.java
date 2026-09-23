package com.gsxi.trading.tradeinsight.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/27
 * @description 数据同步状态统计信息DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncStatusStatistics {

    /**
     * 总同步次数
     */
    private Long totalSyncCount;

    /**
     * 成功次数
     */
    private Long successCount;

    /**
     * 失败次数
     */
    private Long failCount;

    /**
     * 跳过次数
     */
    private Long skippedCount;

    /**
     * 成功率（百分比）
     */
    private Double successRate;

    /**
     * 各数据类型的同步统计
     * Key: 数据类型, Value: 该类型的统计信息
     */
    private Map<String, DataTypeSyncStat> dataTypeStats;

    /**
     * 数据类型同步统计
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataTypeSyncStat {
        /**
         * 数据类型描述
         */
        private String dataTypeDesc;
        
        /**
         * 同步次数
         */
        private Long syncCount;
        
        /**
         * 成功次数
         */
        private Long successCount;
        
        /**
         * 失败次数
         */
        private Long failCount;
        
        /**
         * 跳过次数
         */
        private Long skippedCount;
        
        /**
         * 成功率
         */
        private Double successRate;
    }
}