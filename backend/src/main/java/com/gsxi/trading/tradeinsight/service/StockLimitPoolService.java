package com.gsxi.trading.tradeinsight.service;

import com.gsxi.trading.tradeinsight.entity.StockLimitPool;

import java.time.LocalDate;
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/25
 * @description 涨停池数据Service接口
 */
public interface StockLimitPoolService {
    /**
     * 检查指定日期的涨停池数据是否存在
     * @param tradeDate 交易日期
     * @return >0即为存在
     */
    Long existsByTradeDate(LocalDate tradeDate,String type);


    /**
     * 批量保存涨停池数据
     * @param list 涨停池数据列表
     * @return 保存成功的数量
     */
    int batchSaveStockLimitUp(List<StockLimitPool> list);

    /**
     * 根据日期和类型删除数据
     * @param tradeDate 交易日期
     * @param dataType 数据类型（LIMIT_UP/LIMIT_DOWN）
     * @return 删除成功的数量
     */
    int deleteByTradeDateAndType(LocalDate tradeDate, String dataType);
}
