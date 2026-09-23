package com.gsxi.trading.tradeinsight.service.impl;

import com.gsxi.trading.tradeinsight.dolphindb.PlateMarketDolphinDBRepository;
import com.gsxi.trading.tradeinsight.entity.PlateMarketQuotation;
import com.gsxi.trading.tradeinsight.service.PlateMarketService;
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
 * @description 板块行情实现类（数据持久化于 DolphinDB）
 */
@Service
@RequiredArgsConstructor
public class PlateMarketServiceImpl implements PlateMarketService {

    private final PlateMarketDolphinDBRepository plateMarketDolphinDBRepository;

    @Transactional(rollbackFor = Exception.class)
    @Override
    public int batchSave(List<PlateMarketQuotation> list) {
        if (list.isEmpty()) {
            return 0;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDate tradeDate = list.get(0).getTradeDate(); // 所有数据应为同一日期

        // 过滤已存在的数据（按日期+板块）
        list.removeIf(item -> {
            item.setCreateTime(now);
            return existsByDateAndPlate(tradeDate, item.getPlate());
        });

        return list.isEmpty() ? 0 : plateMarketDolphinDBRepository.batchInsert(list);
    }

    @Override
    public long existsByTradeDate(LocalDate tradeDate) {
        return plateMarketDolphinDBRepository.countByTradeDate(tradeDate);
    }

    @Override
    public boolean existsByDateAndPlate(LocalDate tradeDate, String plate) {
        return plateMarketDolphinDBRepository.countByDateAndPlate(tradeDate, plate) > 0;
    }

    @Override
    public List<PlateMarketQuotation> getByTradeDate(LocalDate tradeDate) {
        return plateMarketDolphinDBRepository.selectByTradeDate(tradeDate);
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public int deleteByTradeDate(LocalDate tradeDate) {
        return plateMarketDolphinDBRepository.deleteByTradeDate(tradeDate);
    }
}

