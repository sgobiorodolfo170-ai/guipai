package com.gsxi.trading.tradeinsight.task.impl;

import com.gsxi.trading.tradeinsight.common.enums.DataTypeEnum;
import com.gsxi.trading.tradeinsight.dto.SyncResult;
import com.gsxi.trading.tradeinsight.entity.PlateMarketQuotation;
import com.gsxi.trading.tradeinsight.service.AktoolsApiService;
import com.gsxi.trading.tradeinsight.service.PlateMarketService;
import com.gsxi.trading.tradeinsight.task.DataSyncService;
import com.gsxi.trading.tradeinsight.util.dataTransformation.PlateDataConverter;
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
 * @description 板块行情数据同步服务（实现定时任务逻辑）
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlateMarketSyncServiceImpl implements DataSyncService {

    private final AktoolsApiService aktoolsApiService;
    private final PlateMarketService plateMarketService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SyncResult syncData(LocalDate tradeDate) {

        try {
            // 1. 检查是否已存在当日板块行情数据
            long exists = plateMarketService.existsByTradeDate(tradeDate);
            if (exists >0 ) {
                return SyncResult.builder()
                        .success(true)
                        .message("当日数据已存在  "+exists+" 条，跳过同步")
                        .build();
            }

            // 2. 调用接口获取原始数据
            List<Map<String, Object>> rawData = aktoolsApiService.getStockIndustry();
            if (rawData == null || rawData.isEmpty()) {
                return SyncResult.builder()
                        .success(false)
                        .message("未获取到板块行情数据")
                        .build();
            }

            // 3. 转换为实体类
            List<PlateMarketQuotation> entityList = PlateDataConverter.convertToEntityList(rawData, tradeDate);

            // 4. 批量保存
            int savedCount = plateMarketService.batchSave(entityList);
            int failCount = rawData.size() - savedCount;

            return SyncResult.builder()
                    .success(true)
                    .successCount(savedCount)
                    .failCount(failCount)
                    .message("板块行情同步完成：成功" + savedCount + "条，失败" + failCount + "条")
                    .build();

        } catch (Exception e) {
            log.error("同步失败：{}" ,e.getMessage());
            e.printStackTrace();
            return SyncResult.builder()
                    .success(false)
                    .message("板块行情同步失败：" + e.getMessage())
                    .build();
        }
    }

    @Override
    public DataTypeEnum getDataType() {
        return DataTypeEnum.PLATE_MARKET;
    }
}
