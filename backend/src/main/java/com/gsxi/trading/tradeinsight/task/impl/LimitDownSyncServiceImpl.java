package com.gsxi.trading.tradeinsight.task.impl;

import com.gsxi.trading.tradeinsight.common.enums.DataTypeEnum;
import com.gsxi.trading.tradeinsight.dto.SyncResult;
import com.gsxi.trading.tradeinsight.entity.StockLimitPool;
import com.gsxi.trading.tradeinsight.service.AktoolsApiService;
import com.gsxi.trading.tradeinsight.service.StockLimitPoolService;
import com.gsxi.trading.tradeinsight.task.DataSyncService;
import com.gsxi.trading.tradeinsight.util.dataTransformation.StockDataConverter;
import com.gsxi.trading.tradeinsight.util.StockTimeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/26
 * @description 跌停板数据持久化
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LimitDownSyncServiceImpl implements DataSyncService {
    private final StockLimitPoolService limitService;
    private final AktoolsApiService aktoolsApiService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SyncResult syncData(LocalDate tradeDate) {
        String sTradeDate = StockTimeUtil.formatDate(tradeDate);
        try {
            // 1. 检查是否已存在当日数据
            Long exists = limitService.existsByTradeDate(tradeDate,"LIMIT_DOWN");
            if (exists >0 ) {
                return SyncResult.builder()
                        .success(true)
                        .message("当日数据已存在  "+exists+" 条，跳过同步")
                        .build();
            }

            // 2. 获取原始数据
            List<Map<String, Object>> rawData = aktoolsApiService.getStockDropPool(sTradeDate);
            if (rawData == null || rawData.isEmpty()) {
                return SyncResult.builder()
                        .success(false)
                        .message("未获取到跌停板数据")
                        .build();
            }

            // 3. 转换数据并批量保存
            List<StockLimitPool> entityList = StockDataConverter.convertToEntityList(rawData, tradeDate,"LIMIT_DOWN");
            int savedCount = limitService.batchSaveStockLimitUp(entityList);
            int failCount = rawData.size() - savedCount;

            return SyncResult.builder()
                    .success(failCount == 0)
                    .successCount(savedCount)
                    .failCount(failCount)
                    .message("同步完成，成功" + savedCount + "条，失败" + failCount + "条")
                    .build();

        } catch (Exception e) {
            log.error("同步失败：{}" ,e.getMessage());
            e.printStackTrace();
            // 4. 异常捕获（事务会回滚当前类型的所有数据）
            return SyncResult.builder()
                    .success(false)
                    .message("同步失败：" + e.getMessage())
                    .build();
        }
    }

    @Override
    public DataTypeEnum getDataType() {
        return DataTypeEnum.LIMIT_DOWN;
    }
}
