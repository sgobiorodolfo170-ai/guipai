package com.gsxi.trading.tradeinsight.controller;

import com.gsxi.trading.tradeinsight.common.enums.DataTypeEnum;
import com.gsxi.trading.tradeinsight.dto.response.AjaxResult;
import com.gsxi.trading.tradeinsight.dto.response.DataSyncStatusResponse;
import com.gsxi.trading.tradeinsight.service.DataSyncStatusService;
import com.gsxi.trading.tradeinsight.task.DataSyncScheduler;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/27
 * @description 数据同步状态控制器
 */
@RestController
@RequestMapping("/api/sync-status")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "每日数据持久化", description = "每日数据持久化相关接口")
public class DataSyncStatusController {

    private final DataSyncStatusService dataSyncStatusService;
    private final DataSyncScheduler dataSyncScheduler;

    /**
     * 查询所有数据同步状态，按时间倒序排列
     * 
     * @return 数据同步状态列表
     */
    @GetMapping("/list")
    public AjaxResult getAllSyncStatus() {
        try {
            List<DataSyncStatusResponse> statusList = dataSyncStatusService.getAllSyncStatusOrderByTime();
            return AjaxResult.success("查询成功", statusList);
        } catch (Exception e) {
            log.error("查询数据同步状态失败", e);
            return AjaxResult.error("查询失败：" + e.getMessage());
        }
    }

    /**
     * 根据交易日期查询数据同步状态
     * 
     * @param tradeDate 交易日期，格式：yyyy-MM-dd
     * @return 指定日期的数据同步状态列表
     */
    @GetMapping("/by-date")
    public AjaxResult getSyncStatusByDate(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate tradeDate) {
        try {
            List<DataSyncStatusResponse> statusList = dataSyncStatusService.getSyncStatusByTradeDate(tradeDate);
            return AjaxResult.success("查询成功", statusList);
        } catch (Exception e) {
            log.error("根据日期查询数据同步状态失败，日期：{}", tradeDate, e);
            return AjaxResult.error("查询失败：" + e.getMessage());
        }
    }

    /**
     * 查询最近N天的数据同步状态
     * 
     * @param days 天数，默认7天
     * @return 最近N天的数据同步状态列表
     */
    @GetMapping("/recent")
    public AjaxResult getRecentSyncStatus(@RequestParam(defaultValue = "7") Integer days) {
        try {
            if (days <= 0 || days > 30) {
                return AjaxResult.error("天数参数无效，请输入1-30之间的数字");
            }
            List<DataSyncStatusResponse> statusList = dataSyncStatusService.getRecentSyncStatus(days);
            return AjaxResult.success("查询成功", statusList);
        } catch (Exception e) {
            log.error("查询最近{}天数据同步状态失败", days, e);
            return AjaxResult.error("查询失败：" + e.getMessage());
        }
    }

    /**
     * 根据数据类型查询同步状态
     * 
     * @param dataType 数据类型
     * @param days 查询最近几天的数据，默认7天
     * @return 指定类型的数据同步状态列表
     */
    @GetMapping("/by-type")
    public AjaxResult getSyncStatusByType(
            @RequestParam String dataType,
            @RequestParam(defaultValue = "7") Integer days) {
        try {
            if (days <= 0 || days > 30) {
                return AjaxResult.error("天数参数无效，请输入1-30之间的数字");
            }
            List<DataSyncStatusResponse> statusList = dataSyncStatusService.getSyncStatusByDataType(dataType, days);
            return AjaxResult.success("查询成功", statusList);
        } catch (Exception e) {
            log.error("根据数据类型查询同步状态失败，类型：{}，天数：{}", dataType, days, e);
            return AjaxResult.error("查询失败：" + e.getMessage());
        }
    }

    /**
     * 获取数据同步状态统计信息
     * 
     * @param days 统计最近几天的数据，默认7天
     * @return 统计信息
     */
    @GetMapping("/statistics")
    public AjaxResult getSyncStatusStatistics(@RequestParam(defaultValue = "7") Integer days) {
        try {
            if (days <= 0 || days > 30) {
                return AjaxResult.error("天数参数无效，请输入1-30之间的数字");
            }
            var statistics = dataSyncStatusService.getSyncStatusStatistics(days);
            return AjaxResult.success("查询成功", statistics);
        } catch (Exception e) {
            log.error("查询数据同步状态统计信息失败，天数：{}", days, e);
            return AjaxResult.error("查询失败：" + e.getMessage());
        }
    }

    // ========== 手动数据管理接口 ==========
    //todo : 这一块接参数设置时间等都需要调整
    /**
     * 手动删除指定日期的特定类型数据
     * 
     * @param tradeDate 交易日期，格式：yyyy-MM-dd
     * @param dataType 数据类型：LIMIT_UP(涨停板数据)、LIMIT_DOWN(跌停板数据)、PLATE_MARKET(板块行情数据)、INDEX(指数数据)、INDEX_DAILY(指数日K数据)
     * @return 删除结果
     */
    @DeleteMapping("/manual/delete")
    public AjaxResult manualDeleteData(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate tradeDate,
            @RequestParam String dataType) {
        try {
            // 验证数据类型
            DataTypeEnum dataTypeEnum;
            try {
                dataTypeEnum = DataTypeEnum.valueOf(dataType);
            } catch (IllegalArgumentException e) {
                return AjaxResult.error("无效的数据类型：" + dataType + "，支持的类型：LIMIT_UP、LIMIT_DOWN、PLATE_MARKET、INDEX、INDEX_DAILY");
            }

            int deletedCount = dataSyncStatusService.manualDeleteData(tradeDate, dataTypeEnum);
            
            if (deletedCount > 0) {
                log.info("手动删除数据成功，日期：{}，类型：{}，删除条数：{}", tradeDate, dataTypeEnum.getDesc(), deletedCount);
                return AjaxResult.success("删除成功，共删除 " + deletedCount + " 条" + dataTypeEnum.getDesc());
            } else {
                return AjaxResult.success("未找到需要删除的数据");
            }
        } catch (Exception e) {
            log.error("手动删除数据失败，日期：{}，类型：{}", tradeDate, dataType, e);
            return AjaxResult.error("删除失败：" + e.getMessage());
        }
    }

    /**
     * 手动重新同步指定日期的特定类型数据
     * 
     * @param tradeDate 交易日期，格式：yyyy-MM-dd
     * @param dataType 数据类型：LIMIT_UP(涨停板数据)、LIMIT_DOWN(跌停板数据)、PLATE_MARKET(板块行情数据)、INDEX(指数数据)、INDEX_DAILY(指数日K数据)
     * @param forceUpdate 是否强制更新（删除已有数据后重新同步），默认false
     * @return 同步结果
     */
    @PostMapping("/manual/sync")
    public AjaxResult manualSyncData(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate tradeDate,
            @RequestParam String dataType,
            @RequestParam(defaultValue = "false") Boolean forceUpdate) {
        try {
            // 验证数据类型
            DataTypeEnum dataTypeEnum;
            try {
                dataTypeEnum = DataTypeEnum.valueOf(dataType);
            } catch (IllegalArgumentException e) {
                return AjaxResult.error("无效的数据类型：" + dataType + "，支持的类型：LIMIT_UP、LIMIT_DOWN、PLATE_MARKET、INDEX、INDEX_DAILY");
            }

            var result = dataSyncStatusService.manualSyncData(tradeDate, dataTypeEnum, forceUpdate);
            
            if (result.isSuccess()) {
                log.info("手动同步数据成功，日期：{}，类型：{}，结果：{}", tradeDate, dataTypeEnum.getDesc(), result.getMessage());
                return AjaxResult.success(result.getMessage())
                        .put("successCount", result.getSuccessCount())
                        .put("failCount", result.getFailCount());
            } else {
                log.warn("手动同步数据失败，日期：{}，类型：{}，原因：{}", tradeDate, dataTypeEnum.getDesc(), result.getMessage());
                return AjaxResult.error("同步失败：" + result.getMessage());
            }
        } catch (Exception e) {
            log.error("手动同步数据异常，日期：{}，类型：{}", tradeDate, dataType, e);
            return AjaxResult.error("同步异常：" + e.getMessage());
        }
    }

    /**
     * 手动执行指定日期的完整收盘任务（同步所有类型数据）
     * 
     * @param tradeDate 交易日期，格式：yyyy-MM-dd
     * @param forceUpdate 是否强制更新（删除已有数据后重新同步），默认false
     * @return 执行结果
     */
    @PostMapping("/manual/full-sync")
    public AjaxResult manualFullSync(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate tradeDate,
            @RequestParam(defaultValue = "false") Boolean forceUpdate) {
        try {
            log.info("开始手动执行完整收盘任务，日期：{}，强制更新：{}", tradeDate, forceUpdate);
            
            if (forceUpdate) {
                // 强制更新：先删除所有类型的数据
                for (DataTypeEnum dataType : DataTypeEnum.values()) {
                    try {
                        int deletedCount = dataSyncStatusService.manualDeleteData(tradeDate, dataType);
                        log.info("删除{}数据：{} 条", dataType.getDesc(), deletedCount);
                    } catch (Exception e) {
                        log.warn("删除{}数据失败：{}", dataType.getDesc(), e.getMessage());
                    }
                }
            }
            
            // 执行完整同步
            dataSyncScheduler.executeAllSync(tradeDate);
            
            // 查询同步结果
            List<DataSyncStatusResponse> statusList = dataSyncStatusService.getSyncStatusByTradeDate(tradeDate);
            
            log.info("手动完整收盘任务执行完成，日期：{}", tradeDate);
            return AjaxResult.success("完整收盘任务执行完成", statusList);
            
        } catch (Exception e) {
            log.error("手动执行完整收盘任务失败，日期：{}", tradeDate, e);
            return AjaxResult.error("执行失败：" + e.getMessage());
        }
    }

    /**
     * 获取支持的数据类型列表
     * 
     * @return 数据类型列表
     */
    @GetMapping("/data-types")
    public AjaxResult getSupportedDataTypes() {
        try {
            var dataTypes = new java.util.ArrayList<java.util.Map<String, String>>();
            for (DataTypeEnum dataType : DataTypeEnum.values()) {
                var typeInfo = new java.util.HashMap<String, String>();
                typeInfo.put("code", dataType.name());
                typeInfo.put("desc", dataType.getDesc());
                dataTypes.add(typeInfo);
            }
            return AjaxResult.success("查询成功", dataTypes);
        } catch (Exception e) {
            log.error("获取数据类型列表失败", e);
            return AjaxResult.error("查询失败：" + e.getMessage());
        }
    }
}