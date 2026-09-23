package com.gsxi.trading.tradeinsight.service;

import com.gsxi.trading.tradeinsight.entity.SimSingleTraining;
import com.gsxi.trading.tradeinsight.entity.User;

import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/9/4
 * @description 单人K线模拟训练服务接口
 */
public interface SimSingleTrainingService {

    /**
     * 提交模拟结果（交易结束时调用，一次性存储所有数据）
     *
     * @param training 模拟训练数据
     * @return 保存后的模拟训练数据
     */
    SimSingleTraining submitTrainingResult(SimSingleTraining training);

    /**
     * 查询用户历史模拟记录（个人中心查看）
     *
     * @param userId 用户ID
     * @return 模拟记录列表
     */
    List<SimSingleTraining> getUserTrainingHistory(Long userId);

    /**
     * 查询单条模拟详情（查看某次模拟的所有交易记录）
     *
     * @param trainingId 模拟记录ID
     * @return 模拟记录详情
     */
    SimSingleTraining getTrainingDetail(Long trainingId);

    /**
     * 获取或创建本地用户（桌面版无登录模式）
     *
     * @return 本地用户
     */
    User getOrCreateLocalUser();
}