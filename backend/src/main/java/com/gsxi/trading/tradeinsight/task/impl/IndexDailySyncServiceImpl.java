package com.gsxi.trading.tradeinsight.task.impl;

import com.gsxi.trading.tradeinsight.common.enums.DataTypeEnum;
import com.gsxi.trading.tradeinsight.dto.SyncResult;
import com.gsxi.trading.tradeinsight.entity.StockZhIndexDaily;
import com.gsxi.trading.tradeinsight.service.AktoolsApiService;
import com.gsxi.trading.tradeinsight.service.IndexDailyService;
import com.gsxi.trading.tradeinsight.task.DataSyncService;
import com.gsxi.trading.tradeinsight.util.dataTransformation.IndexDataConverter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/26
 * @description 指数日K数据同步服务（支持全量初始化和增量更新）
 */
@Service
@RequiredArgsConstructor
public class IndexDailySyncServiceImpl implements DataSyncService {

    private final AktoolsApiService aktoolsApiService;
    private final IndexDailyService indexDailyService;

    // 需同步的指数列表（上证+创业板+科创板）
    private static final List<String> INDEX_SYMBOLS = List.of(
            // 上证综指sh
            "000001",
            // 创业板指sz
            "399006",
            // 科创50sh
            "000688"
    );

    @Override
    public SyncResult syncData(LocalDate tradeDate) {
        int totalSuccess = 0;
        int totalFail = 0;
        StringBuilder message = new StringBuilder();

        try {
            for (String symbol : INDEX_SYMBOLS) {
                // 1. 查询数据库中该指数的最新日期
                LocalDate lastSyncDate = indexDailyService.getLatestTradeDate(symbol);

                // 2. 首次同步（无历史数据）：全量获取
                //    增量同步：只获取lastSyncDate之后的数据
                LocalDate startDate = lastSyncDate == null ? LocalDate.of(1990, 12, 19) : lastSyncDate.plusDays(1);

                if (startDate.isAfter(tradeDate)) {
                    message.append(symbol).append("无新增数据；");
                    continue;
                }

                // 3. 调用接口获取数据（按日期区间）
                List<Map<String, Object>> rawData = aktoolsApiService.getIndexDailyData(symbol, startDate.toString(), tradeDate.toString());
                if (rawData == null || rawData.isEmpty()) {
                    message.append(symbol).append("无数据；");
                    continue;
                }

                // 4. 转换为实体类
                List<StockZhIndexDaily> entityList = IndexDataConverter.convertToEntityList(rawData, symbol);

                // 5. 批量保存（自动过滤重复数据）
                int savedCount = indexDailyService.batchSave(entityList);
                int failCount = rawData.size() - savedCount;

                totalSuccess += savedCount;
                totalFail += failCount;
                message.append(symbol).append("成功").append(savedCount).append("条，失败").append(failCount).append("条；");
            }

            return SyncResult.builder()
                    .success(true)
                    .successCount(totalSuccess)
                    .failCount(totalFail)
                    .message("指数同步完成：" + message)
                    .build();

        } catch (Exception e) {
            return SyncResult.builder()
                    .success(false)
                    .message("指数同步失败：" + e.getMessage())
                    .build();
        }
    }

    @Override
    public DataTypeEnum getDataType() {
        return DataTypeEnum.INDEX_DAILY;
    }
}
