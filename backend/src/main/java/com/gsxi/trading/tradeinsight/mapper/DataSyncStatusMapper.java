package com.gsxi.trading.tradeinsight.mapper;

import com.gsxi.trading.tradeinsight.entity.DataSyncStatus;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/26
 * @description 数据同步状态Mapper接口
 */
@Mapper
public interface DataSyncStatusMapper {

    /**
     * 插入状态记录
     * @param status 状态实体
     * @return 影响行数
     */
    int insert(DataSyncStatus status);

    /**
     * 更新状态记录
     * @param status 状态实体
     * @return 影响行数
     */
    int update(DataSyncStatus status);

    /**
     * 根据日期查询
     * @param tradeDate 交易日期
     * @return 状态列表
     */
    List<DataSyncStatus> selectByTradeDate(LocalDate tradeDate);

    /**
     * 根据类型和日期查询
     * @param dataType 数据类型
     * @param tradeDate 交易日期
     * @return 状态实体
     */
    DataSyncStatus selectByDataTypeAndDate(@Param("dataType") String dataType, @Param("tradeDate") LocalDate tradeDate);

    /**
     * 批量插入或更新
     * @param list 状态列表
     * @return 影响行数
     */
    int batchInsertOrUpdate(@Param("list") List<DataSyncStatus> list);

    // ========== 新增的查询方法 ==========

    /**
     * 查询所有数据同步状态，按同步时间倒序排列
     * @return 状态列表
     */
    List<DataSyncStatus> selectAllOrderBySyncTimeDesc();

    /**
     * 根据日期范围查询，按同步时间倒序排列
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @return 状态列表
     */
    List<DataSyncStatus> selectByDateRangeOrderBySyncTimeDesc(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * 根据数据类型和日期范围查询
     * @param dataType 数据类型
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @return 状态列表
     */
    List<DataSyncStatus> selectByDataTypeAndDateRange(@Param("dataType") String dataType, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * 根据ID删除记录
     * @param id 主键ID
     * @return 影响行数
     */
    int deleteById(Long id);
}
