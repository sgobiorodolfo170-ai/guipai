package com.gsxi.trading.tradeinsight.mapper;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gsxi.trading.tradeinsight.entity.SimSingleTraining;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Optional;
/**
 * @author gsxi
 * @version 1.0
 * @date 2025/9/4
 * @description 单人K线模拟记录数据访问层(MyBatis实现)
 */
@Mapper
public interface SimSingleTrainingMapper extends BaseMapper<SimSingleTraining> {

    /**
     * 查用户所有模拟记录（按创建时间倒序，最新的在前）
     *
     * @param userId 用户ID
     * @return 模拟记录列表
     */
    default List<SimSingleTraining> findByUserIdOrderByCreatedAtDesc(Long userId) {
        return selectList(new LambdaQueryWrapper<SimSingleTraining>()
                .eq(SimSingleTraining::getUserId, userId)
                .orderByDesc(SimSingleTraining::getCreatedAt));
    }

    /**
     * 根据ID查询模拟记录
     *
     * @param trainingId 模拟记录ID
     * @return 模拟记录
     */
    default Optional<SimSingleTraining> findById(Long trainingId) {
        return Optional.ofNullable(selectById(trainingId));
    }

//
//    /**
//     * 插入模拟记录
//     * @param training 模拟记录
//     * @return 插入数量
//     */
//    @Insert("INSERT INTO sim_single_training (" +
//            "user_id, stock_name, stock_code, start_time, end_time, " +
//            "initial_capital, final_capital, total_profit, operation_profit_rate, " +
//            "excess_profit_rate, stock_range_profit_rate, trade_times, trade_datas, status, created_at" +
//            ") VALUES (" +
//            "#{training.userId}, #{training.stockName}, #{training.stockCode}, #{training.startTime}, #{training.endTime}, " +
//            "#{training.initialCapital}, #{training.finalCapital}, #{training.totalProfit}, #{training.operationProfitRate}, " +
//            "#{training.excessProfitRate}, #{training.stockRangeProfitRate}, #{training.tradeTimes}, " +
//            "#{training.tradeDatas,typeHandler=com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler,jdbcType=JSON}, " +
//            "#{training.status}, #{training.createdAt}" +
//            ")")
//    int insert(@Param("training") SimSingleTraining training);
}