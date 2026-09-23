package com.gsxi.trading.tradeinsight.task;

import com.gsxi.trading.tradeinsight.common.enums.DataTypeEnum;
import com.gsxi.trading.tradeinsight.dto.SyncResult;

import java.time.LocalDate;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/26
 * @description 数据同步通用接口（所有类型数据同步都需实现）
 */
public interface DataSyncService {
    /**
     * 同步指定日期的数据
     * @param tradeDate 交易日期
     * @return 同步结果
     */
    SyncResult syncData(LocalDate tradeDate);

    /**
     * 获取数据类型（用于状态记录）
     * @return 数据类型枚举
     */
    DataTypeEnum getDataType();
}
