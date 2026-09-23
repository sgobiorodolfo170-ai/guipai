package com.gsxi.trading.tradeinsight.service.impl;

import com.gsxi.trading.tradeinsight.dolphindb.StockLimitPoolDolphinDBRepository;
import com.gsxi.trading.tradeinsight.entity.StockLimitPool;
import com.gsxi.trading.tradeinsight.service.StockLimitPoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/25
 * @description 涨停池数据Service实现类（数据持久化于 DolphinDB）
 */
@Service
@RequiredArgsConstructor
public class StockLimitPoolServiceImpl implements StockLimitPoolService {

    private final StockLimitPoolDolphinDBRepository stockLimitPoolDolphinDBRepository;

    /**
     * 判断指定日期的涨跌停池数据是否存在
     * @param tradeDate 交易日期
     * @return 存在返回>0，否则返回0
     */
    @Override
    public Long existsByTradeDate(LocalDate tradeDate, String type) {
        return (long) stockLimitPoolDolphinDBRepository.countByTradeDateAndType(tradeDate, type);
    }

    /**
     * 批量保存涨停池数据
     * @param list 涨停池数据列表
     * @return 保存成功的数量
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public int batchSaveStockLimitUp(List<StockLimitPool> list) {
        if (list == null || list.isEmpty()) {
            return 0;
        }

        LocalDateTime now = LocalDateTime.now();
        // 批量设置创建时间
        list.forEach(stock -> stock.setCreateTime(now));

        return stockLimitPoolDolphinDBRepository.batchInsert(list);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int deleteByTradeDateAndType(LocalDate tradeDate, String dataType) {
        return stockLimitPoolDolphinDBRepository.deleteByTradeDateAndType(tradeDate, dataType);
    }
}
