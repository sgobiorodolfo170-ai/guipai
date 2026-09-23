package com.gsxi.trading.tradeinsight.service;

import com.gsxi.trading.tradeinsight.common.enums.DataTypeEnum;
import com.gsxi.trading.tradeinsight.dto.SyncResult;
import com.gsxi.trading.tradeinsight.dto.response.DataSyncStatusResponse;
import com.gsxi.trading.tradeinsight.dto.response.SyncStatusStatistics;
import com.gsxi.trading.tradeinsight.entity.DataSyncStatus;

import java.time.LocalDate;
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/26
 * @description 数据同步状态服务接口
 */
public interface DataSyncStatusService {

    /**
     * 保存或更新同步状态（存在则更新，不存在则插入）
     * @param status 同步状态实体
     * @return 保存后的实体
     */
    DataSyncStatus saveOrUpdate(DataSyncStatus status);

    /**
     * 根据日期查询所有类型的同步状态
     * @param tradeDate 交易日期
     * @return 同步状态列表
     */
    List<DataSyncStatus> findByTradeDate(LocalDate tradeDate);

    /**
     * 根据数据类型和日期查询状态
     * @param dataType 数据类型（DataTypeEnum的name()）
     * @param tradeDate 交易日期
     * @return 同步状态实体（可能为null）
     */
    DataSyncStatus findByDataTypeAndTradeDate(String dataType, LocalDate tradeDate);

    /**
     * 批量更新状态
     * @param statusList 状态列表
     */
    void batchSaveOrUpdate(List<DataSyncStatus> statusList);

    // ========== 新增的Controller相关方法 ==========

    /**
     * 查询所有数据同步状态，按同步时间倒序排列
     * @return 数据同步状态响应列表
     */
    List<DataSyncStatusResponse> getAllSyncStatusOrderByTime();

    /**
     * 根据交易日期查询数据同步状态
     * @param tradeDate 交易日期
     * @return 数据同步状态响应列表
     */
    List<DataSyncStatusResponse> getSyncStatusByTradeDate(LocalDate tradeDate);

    /**
     * 查询最近N天的数据同步状态
     * @param days 天数
     * @return 数据同步状态响应列表
     */
    List<DataSyncStatusResponse> getRecentSyncStatus(Integer days);

    /**
     * 根据数据类型查询最近N天的同步状态
     * @param dataType 数据类型
     * @param days 天数
     * @return 数据同步状态响应列表
     */
    List<DataSyncStatusResponse> getSyncStatusByDataType(String dataType, Integer days);

    /**
     * 获取数据同步状态统计信息
     * @param days 统计最近几天的数据
     * @return 统计信息
     */
    SyncStatusStatistics getSyncStatusStatistics(Integer days);

    // ========== 手动数据管理方法 ==========

    /**
     * 手动删除指定日期的特定类型数据
     * @param tradeDate 交易日期
     * @param dataType 数据类型
     * @return 删除的数据条数
     */
    int manualDeleteData(LocalDate tradeDate, DataTypeEnum dataType);

    /**
     * 手动同步指定日期的特定类型数据
     * @param tradeDate 交易日期
     * @param dataType 数据类型
     * @param forceUpdate 是否强制更新（删除已有数据后重新同步）
     * @return 同步结果
     */
    SyncResult manualSyncData(LocalDate tradeDate, DataTypeEnum dataType, Boolean forceUpdate);
}
