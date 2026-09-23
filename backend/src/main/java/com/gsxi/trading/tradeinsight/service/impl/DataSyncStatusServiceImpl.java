package com.gsxi.trading.tradeinsight.service.impl;

import com.gsxi.trading.tradeinsight.common.enums.DataTypeEnum;
import com.gsxi.trading.tradeinsight.common.enums.SyncStatusEnum;
import com.gsxi.trading.tradeinsight.dto.SyncResult;
import com.gsxi.trading.tradeinsight.dto.response.DataSyncStatusResponse;
import com.gsxi.trading.tradeinsight.dto.response.SyncStatusStatistics;
import com.gsxi.trading.tradeinsight.entity.DataSyncStatus;
import com.gsxi.trading.tradeinsight.mapper.DataSyncStatusMapper;
import com.gsxi.trading.tradeinsight.service.DataSyncStatusService;
import com.gsxi.trading.tradeinsight.service.PlateMarketService;
import com.gsxi.trading.tradeinsight.service.StockLimitPoolService;
import com.gsxi.trading.tradeinsight.task.DataSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/26
 * @description 数据同步状态服务实现类
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DataSyncStatusServiceImpl implements DataSyncStatusService {

    private final DataSyncStatusMapper syncStatusMapper;
    private final PlateMarketService plateMarketService;
    private final StockLimitPoolService stockLimitPoolService;
    private final List<DataSyncService> syncServices;
    private final IndexDailyServiceImpl indexDailyService;

    @Override
    public DataSyncStatus saveOrUpdate(DataSyncStatus status) {
        // 先查询是否存在
        DataSyncStatus existing = syncStatusMapper.selectByDataTypeAndDate(
                status.getDataType(), status.getTradeDate());

        if (existing == null) {
            // 不存在则插入
            syncStatusMapper.insert(status);
            return status;
        } else {
            // 存在则更新（保留id，更新其他字段）
            status.setId(existing.getId());
            syncStatusMapper.update(status);
            return status;
        }
    }

    @Override
    public List<DataSyncStatus> findByTradeDate(LocalDate tradeDate) {
        return syncStatusMapper.selectByTradeDate(tradeDate);
    }

    @Override
    public DataSyncStatus findByDataTypeAndTradeDate(String dataType, LocalDate tradeDate) {
        return syncStatusMapper.selectByDataTypeAndDate(dataType, tradeDate);
    }

    @Override
    public void batchSaveOrUpdate(List<DataSyncStatus> statusList) {
        if (statusList == null || statusList.isEmpty()) {
            return;
        }
        syncStatusMapper.batchInsertOrUpdate(statusList);
    }

    // ========== 新增的Controller相关方法实现 ==========

    @Override
    public List<DataSyncStatusResponse> getAllSyncStatusOrderByTime() {
        List<DataSyncStatus> statusList = syncStatusMapper.selectAllOrderBySyncTimeDesc();
        return convertToResponseList(statusList);
    }

    @Override
    public List<DataSyncStatusResponse> getSyncStatusByTradeDate(LocalDate tradeDate) {
        List<DataSyncStatus> statusList = syncStatusMapper.selectByTradeDate(tradeDate);
        return convertToResponseList(statusList);
    }

    @Override
    public List<DataSyncStatusResponse> getRecentSyncStatus(Integer days) {
        LocalDate startDate = LocalDate.now().minusDays(days - 1);
        List<DataSyncStatus> statusList = syncStatusMapper.selectByDateRangeOrderBySyncTimeDesc(startDate, LocalDate.now());
        return convertToResponseList(statusList);
    }

    @Override
    public List<DataSyncStatusResponse> getSyncStatusByDataType(String dataType, Integer days) {
        LocalDate startDate = LocalDate.now().minusDays(days - 1);
        List<DataSyncStatus> statusList = syncStatusMapper.selectByDataTypeAndDateRange(dataType, startDate, LocalDate.now());
        return convertToResponseList(statusList);
    }

    @Override
    public SyncStatusStatistics getSyncStatusStatistics(Integer days) {
        LocalDate startDate = LocalDate.now().minusDays(days - 1);
        List<DataSyncStatus> statusList = syncStatusMapper.selectByDateRangeOrderBySyncTimeDesc(startDate, LocalDate.now());

        // 计算总体统计
        long totalCount = statusList.size();
        long successCount = statusList.stream().filter(s -> s.getStatus().equals(SyncStatusEnum.SUCCESS.getCode())).count();
        long failCount = statusList.stream().filter(s -> s.getStatus().equals(SyncStatusEnum.FAIL.getCode())).count();
        long skippedCount = statusList.stream().filter(s -> s.getStatus().equals(SyncStatusEnum.SKIPPED.getCode())).count();
        
        double successRate = totalCount > 0 ? (double) successCount / totalCount * 100 : 0.0;

        // 按数据类型分组统计
        Map<String, List<DataSyncStatus>> groupByDataType = statusList.stream()
                .collect(Collectors.groupingBy(DataSyncStatus::getDataType));

        Map<String, SyncStatusStatistics.DataTypeSyncStat> dataTypeStats = new HashMap<>();
        for (Map.Entry<String, List<DataSyncStatus>> entry : groupByDataType.entrySet()) {
            String dataType = entry.getKey();
            List<DataSyncStatus> typeStatusList = entry.getValue();

            long typeTotal = typeStatusList.size();
            long typeSuccess = typeStatusList.stream().filter(s -> s.getStatus().equals(SyncStatusEnum.SUCCESS.getCode())).count();
            long typeFail = typeStatusList.stream().filter(s -> s.getStatus().equals(SyncStatusEnum.FAIL.getCode())).count();
            long typeSkipped = typeStatusList.stream().filter(s -> s.getStatus().equals(SyncStatusEnum.SKIPPED.getCode())).count();
            double typeSuccessRate = typeTotal > 0 ? (double) typeSuccess / typeTotal * 100 : 0.0;

            String dataTypeDesc = getDataTypeDesc(dataType);

            SyncStatusStatistics.DataTypeSyncStat stat = SyncStatusStatistics.DataTypeSyncStat.builder()
                    .dataTypeDesc(dataTypeDesc)
                    .syncCount(typeTotal)
                    .successCount(typeSuccess)
                    .failCount(typeFail)
                    .skippedCount(typeSkipped)
                    .successRate(typeSuccessRate)
                    .build();

            dataTypeStats.put(dataType, stat);
        }

        return SyncStatusStatistics.builder()
                .totalSyncCount(totalCount)
                .successCount(successCount)
                .failCount(failCount)
                .skippedCount(skippedCount)
                .successRate(successRate)
                .dataTypeStats(dataTypeStats)
                .build();
    }

    /**
     * 将实体列表转换为响应DTO列表
     */
    private List<DataSyncStatusResponse> convertToResponseList(List<DataSyncStatus> statusList) {
        return statusList.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * 将实体转换为响应DTO
     */
    private DataSyncStatusResponse convertToResponse(DataSyncStatus status) {
        return DataSyncStatusResponse.builder()
                .id(status.getId())
                .dataType(status.getDataType())
                .dataTypeDesc(getDataTypeDesc(status.getDataType()))
                .tradeDate(status.getTradeDate())
                .status(status.getStatus())
                .statusDesc(getStatusDesc(status.getStatus()))
                .successCount(status.getSuccessCount())
                .failCount(status.getFailCount())
                .message(status.getMessage())
                .syncTime(status.getSyncTime())
                .build();
    }

    /**
     * 获取数据类型描述
     */
    private String getDataTypeDesc(String dataType) {
        try {
            return DataTypeEnum.valueOf(dataType).getDesc();
        } catch (IllegalArgumentException e) {
            return dataType; // 如果枚举中没有对应值，返回原值
        }
    }

    /**
     * 获取状态描述
     */
    private String getStatusDesc(Integer statusCode) {
        for (SyncStatusEnum status : SyncStatusEnum.values()) {
            if (status.getCode() == statusCode) {
                return status.name();
            }
        }
        return "未知状态";
    }

    // ========== 手动数据管理方法实现 ==========

    @Override
    public int manualDeleteData(LocalDate tradeDate, DataTypeEnum dataType) {
        log.info("开始手动删除数据，日期：{}，类型：{}", tradeDate, dataType.getDesc());
        
        int deletedCount = 0;

        // TODO: 如果有删除定时任务相关的服务，在这里添加删除逻辑
        try {
            switch (dataType) {
                case PLATE_MARKET:
                    deletedCount = plateMarketService.deleteByTradeDate(tradeDate);
                    break;
                case LIMIT_UP:
                    deletedCount = stockLimitPoolService.deleteByTradeDateAndType(tradeDate, "LIMIT_UP");
                    break;
                case LIMIT_DOWN:
                    deletedCount = stockLimitPoolService.deleteByTradeDateAndType(tradeDate, "LIMIT_DOWN");
                    break;
                case INDEX:
                case INDEX_DAILY:
                    deletedCount = indexDailyService.deleteByTradeDate(tradeDate);
                    break;
                default:
                    throw new IllegalArgumentException("不支持的数据类型：" + dataType);
            }
            
            // 删除对应的同步状态记录
            if (deletedCount > 0) {
                DataSyncStatus existingStatus = syncStatusMapper.selectByDataTypeAndDate(dataType.name(), tradeDate);
                if (existingStatus != null) {
                    syncStatusMapper.deleteById(existingStatus.getId());
                    log.info("已删除对应的同步状态记录");
                }
            }
            
            log.info("手动删除数据完成，删除条数：{}", deletedCount);
            return deletedCount;
            
        } catch (Exception e) {
            log.error("手动删除数据失败，日期：{}，类型：{}", tradeDate, dataType.getDesc(), e);
            throw new RuntimeException("删除数据失败：" + e.getMessage(), e);
        }
    }

    @Override
    public SyncResult manualSyncData(LocalDate tradeDate, DataTypeEnum dataType, Boolean forceUpdate) {
        log.info("开始手动同步数据，日期：{}，类型：{}，强制更新：{}", tradeDate, dataType.getDesc(), forceUpdate);
        
        try {
            // 如果强制更新，先删除已有数据
            if (forceUpdate) {
                int deletedCount = manualDeleteData(tradeDate, dataType);
                log.info("强制更新模式，已删除 {} 条旧数据", deletedCount);
            }
            
            // 找到对应的同步服务
            DataSyncService targetSyncService = null;
            for (DataSyncService syncService : syncServices) {
                if (syncService.getDataType() == dataType) {
                    targetSyncService = syncService;
                    break;
                }
            }
            
            if (targetSyncService == null) {
                return SyncResult.builder()
                        .success(false)
                        .message("未找到对应的数据同步服务：" + dataType.getDesc())
                        .build();
            }
            
            // 执行同步
            SyncResult result = targetSyncService.syncData(tradeDate);
            
            // 记录同步状态到数据库
            DataSyncStatus status = DataSyncStatus.builder()
                    .dataType(dataType.name())
                    .tradeDate(tradeDate)
                    .syncTime(LocalDateTime.now())
                    .successCount(result.getSuccessCount())
                    .failCount(result.getFailCount())
                    .message("手动同步：" + result.getMessage())
                    .build();
            
            // 设置状态码
            if (result.isSuccess()) {
                status.setStatus(result.getMessage().contains("跳过")
                        ? SyncStatusEnum.SKIPPED.getCode()
                        : SyncStatusEnum.SUCCESS.getCode());
            } else {
                status.setStatus(SyncStatusEnum.FAIL.getCode());
            }
            
            // 保存状态
            saveOrUpdate(status);
            
            log.info("手动同步数据完成，结果：{}", result.getMessage());
            return result;
            
        } catch (Exception e) {
            log.error("手动同步数据失败，日期：{}，类型：{}", tradeDate, dataType.getDesc(), e);
            
            // 记录失败状态
            DataSyncStatus failureStatus = DataSyncStatus.builder()
                    .dataType(dataType.name())
                    .tradeDate(tradeDate)
                    .syncTime(LocalDateTime.now())
                    .status(SyncStatusEnum.FAIL.getCode())
                    .successCount(0)
                    .failCount(1)
                    .message("手动同步失败：" + e.getMessage())
                    .build();
            
            try {
                saveOrUpdate(failureStatus);
            } catch (Exception saveException) {
                log.error("保存失败状态时出错", saveException);
            }
            
            return SyncResult.builder()
                    .success(false)
                    .message("同步失败：" + e.getMessage())
                    .build();
        }
    }
}
