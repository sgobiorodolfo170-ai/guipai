package com.gsxi.trading.tradeinsight.service.impl;

import com.gsxi.trading.tradeinsight.dolphindb.IndexDailyDolphinDBRepository;
import com.gsxi.trading.tradeinsight.entity.StockZhIndexDaily;
import com.gsxi.trading.tradeinsight.service.IndexDailyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/26
 * @description 指数同步服务接口（数据持久化于 DolphinDB）
 */

@Service
@RequiredArgsConstructor
public class IndexDailyServiceImpl implements IndexDailyService {

    private final IndexDailyDolphinDBRepository indexDailyDolphinDBRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int batchSave(List<StockZhIndexDaily> list) {
        if (list.isEmpty()) {
            return 0;
        }

        LocalDateTime now = LocalDateTime.now();
        // 过滤已存在的数据（按指数代码+日期）
        list.removeIf(item -> {
            // 设置创建/更新时间
            item.setCreateTime(now);
            item.setUpdateTime(now);
            // 检查是否已存在
            return existsBySymbolAndTradeDate(item.getSymbol(), item.getTradeDate());
        });

        return list.isEmpty() ? 0 : indexDailyDolphinDBRepository.batchInsert(list);
    }

    @Override
    public LocalDate getLatestTradeDate(String symbol) {
        return indexDailyDolphinDBRepository.selectLatestTradeDate(symbol);
    }

    @Override
    public List<StockZhIndexDaily> getBySymbolAndDateRange(String symbol, LocalDate startDate, LocalDate endDate) {
        return indexDailyDolphinDBRepository.selectBySymbolAndDateRange(symbol, startDate, endDate);
    }

    @Override
    public boolean existsBySymbolAndTradeDate(String symbol, LocalDate tradeDate) {
        return indexDailyDolphinDBRepository.countBySymbolAndTradeDate(symbol, tradeDate) > 0;
    }

    @Override
    public int deleteByTradeDate(LocalDate tradeDate) {
        return indexDailyDolphinDBRepository.deleteByTradeDate(tradeDate);
    }
}
