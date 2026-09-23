package com.gsxi.trading.tradeinsight.service.impl;

import com.gsxi.trading.tradeinsight.entity.SimSingleTraining;
import com.gsxi.trading.tradeinsight.entity.User;
import com.gsxi.trading.tradeinsight.mapper.SimSingleTrainingMapper;
import com.gsxi.trading.tradeinsight.mapper.UserMapper;
import com.gsxi.trading.tradeinsight.service.SimSingleTrainingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/9/4
 * @description 单人K线模拟训练服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SimSingleTrainingServiceImpl implements SimSingleTrainingService {

    private final SimSingleTrainingMapper trainingMapper;
    private final UserMapper userMapper;

    /**
     * 提交模拟结果（交易结束时调用，一次性存储所有数据）
     *
     * @param training 模拟训练数据
     * @return 保存后的模拟训练数据
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public SimSingleTraining submitTrainingResult(SimSingleTraining training) {
        log.info("提交模拟训练结果，用户ID: {}", training.getUserId());

        // 1. 自动计算总盈利（避免前端传错）
        BigDecimal totalProfit = training.getFinalCapital().subtract(training.getInitialCapital());
        training.setTotalProfit(totalProfit);

        // 2. 自动计算操作收益率（总盈利/初始资金，保留4位小数）
        BigDecimal operationRate = totalProfit
                .divide(training.getInitialCapital(), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal("100")); // 转成百分比（如0.43%存为0.4300）
        training.setOperationProfitRate(operationRate);

        // 3. 自动计算超额收益率（操作收益率 - 股票区间涨跌幅）
        BigDecimal excessRate = operationRate.subtract(training.getStockRangeProfitRate());
        training.setExcessProfitRate(excessRate);

        // 4. 补全默认值
        training.setStatus(1); // 标记为"已完成"
        training.setCreatedAt(LocalDateTime.now());
        training.setTradeTimes(training.getTradeDatas().size()); // 交易次数 = tradeDatas长度

        // 5. 更新用户表：模拟次数+1，总模拟资金更新为本次最终资金（无登录模式：自动获取/创建本地用户）
        User user = userMapper.selectById(training.getUserId());
        if (user == null) {
            // 桌面版无登录：若用户不存在则自动创建一个默认用户
            user = User.builder()
                    .username("local")
                    .password("")
                    .status(1)
                    .totalSimulationAssets(new BigDecimal("100000"))
                    .totalTransactionCount(0)
                    .build();
            userMapper.insert(user);
            training.setUserId(user.getId());
        }
        // 注意：根据User实体类的字段名称更新，而不是用户要求的service层代码中的字段名称
        if (user.getTotalTransactionCount() == null) {
            user.setTotalTransactionCount(1);
        } else {
            user.setTotalTransactionCount(user.getTotalTransactionCount() + 1);
        }
        user.setTotalSimulationAssets(training.getFinalCapital());
        userMapper.updateById(user);

        // 6. 存储模拟记录
        trainingMapper.insert(training);
        return training;
    }

    /**
     * 查询用户历史模拟记录（个人中心查看）
     *
     * @param userId 用户ID
     * @return 模拟记录列表
     */
    @Override
    public List<SimSingleTraining> getUserTrainingHistory(Long userId) {
        log.info("查询用户历史模拟记录，用户ID: {}", userId);
        return trainingMapper.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * 查询单条模拟详情（查看某次模拟的所有交易记录）
     *
     * @param trainingId 模拟记录ID
     * @return 模拟记录详情
     */
    @Override
    public SimSingleTraining getTrainingDetail(Long trainingId) {
        log.info("查询单条模拟详情，模拟记录ID: {}", trainingId);
        return trainingMapper.findById(trainingId)
                .orElseThrow(() -> new RuntimeException("模拟记录不存在"));
    }

    /**
     * 获取或创建本地用户（桌面版无登录模式，返回第一个用户或自动创建）
     *
     * @return 本地用户
     */
    @Override
    public User getOrCreateLocalUser() {
        List<User> users = userMapper.selectList(null);
        if (!users.isEmpty()) {
            return users.get(0);
        }
        User user = User.builder()
                .username("local")
                .password("")
                .status(1)
                .totalSimulationAssets(new BigDecimal("100000"))
                .totalTransactionCount(0)
                .build();
        userMapper.insert(user);
        return user;
    }
}