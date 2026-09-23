package com.gsxi.trading.tradeinsight.task;

import com.gsxi.trading.tradeinsight.common.enums.SyncStatusEnum;
import com.gsxi.trading.tradeinsight.dto.SyncResult;
import com.gsxi.trading.tradeinsight.entity.DataSyncStatus;
import com.gsxi.trading.tradeinsight.service.DataSyncStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/26
 * @description 总调度器（协调所有同步任务）
 */
@Service
@RequiredArgsConstructor
public class DataSyncScheduler {

    private final List<DataSyncService> syncServices;
    private final DataSyncStatusService statusService;

    /**
     * 执行所有类型数据的同步
     */
    public void executeAllSync(LocalDate tradeDate) {
        for (DataSyncService syncService : syncServices) {
            // 逐个执行同步任务（独立事务，互不影响）
            SyncResult result = syncService.syncData(tradeDate);

            // 记录状态到数据库
            DataSyncStatus status = DataSyncStatus.builder()
                    .dataType(syncService.getDataType().name())
                    .tradeDate(tradeDate)
                    .syncTime(LocalDateTime.now())
                    .successCount(result.getSuccessCount())
                    .failCount(result.getFailCount())
                    .message(result.getMessage())
                    .build();

            // 设置状态码
            if (result.isSuccess()) {
                // 成功但可能是跳过（如已存在数据）
                status.setStatus(result.getMessage().contains("跳过")
                        ? SyncStatusEnum.SKIPPED.getCode()
                        : SyncStatusEnum.SUCCESS.getCode());
            } else {
                status.setStatus(SyncStatusEnum.FAIL.getCode());
            }

            // 保存状态（若已存在则更新）
            statusService.saveOrUpdate(status);
        }
    }
}