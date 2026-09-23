package com.gsxi.trading.tradeinsight.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;


/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/25
 * @description 持久化状态实体类
 */
// 状态实体类
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "data_sync_status")
public class DataSyncStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 存储DataTypeEnum的name()
    @Column(name = "data_type", nullable = false)
    private String dataType;

    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;

    // 存储SyncStatusEnum的code
    @Column(name = "status", nullable = false)
    private Integer status;

    @Column(name = "success_count")
    private Integer successCount;

    @Column(name = "fail_count")
    private Integer failCount;

    @Column(name = "message")
    private String message;

    @Column(name = "sync_time")
    private LocalDateTime syncTime;
}
