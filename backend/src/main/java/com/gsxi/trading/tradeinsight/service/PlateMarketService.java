package com.gsxi.trading.tradeinsight.service;

import com.gsxi.trading.tradeinsight.entity.PlateMarketQuotation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/26
 * @description 板块行情
 */
public interface PlateMarketService {
    @Transactional(rollbackFor = Exception.class)
    int batchSave(List<PlateMarketQuotation> list);

    long existsByTradeDate(LocalDate tradeDate);

    boolean existsByDateAndPlate(LocalDate tradeDate, String plate);

    List<PlateMarketQuotation> getByTradeDate(LocalDate tradeDate);

    @Transactional(rollbackFor = Exception.class)
    int deleteByTradeDate(LocalDate tradeDate);
}
