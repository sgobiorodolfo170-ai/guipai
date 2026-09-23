package com.gsxi.trading.tradeinsight.controller;

import com.gsxi.trading.tradeinsight.entity.SimSingleTraining;
import com.gsxi.trading.tradeinsight.entity.User;
import com.gsxi.trading.tradeinsight.service.SimSingleTrainingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/9/4
 * @description 单人K线模拟训练控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/sim-training")
@RequiredArgsConstructor
public class SimSingleTrainingController {

    private final SimSingleTrainingService singleService;

    /**
     * 提交模拟结果（交易结束一次性传所有数据）
     * 前端请求体示例：
     * {
     *   "userId": 123,
     *   "stockName": "张家界",
     *   "stockCode": "000430.SZ",
     *   "startTime": "2016-05-18",
     *   "endTime": "2016-10-17",
     *   "initialCapital": 101083.22,
     *   "finalCapital": 101513.26,
     *   "stockRangeProfitRate": 0.1524,
     *   "tradeDatas": [
     *     {"tradeType":"sell","price":56.2725,"amount":1800,"total":101290.5,"klineIndex":xxx,"tradeDate":"2016-06-01"},
     *     {"tradeType":"buy","price":56.2725,"amount":1800,"total":101290.5,"klineIndex":xxx,"tradeDate":"2016-06-02"}
     *   ]
     * }
     *
     * @param training 模拟训练数据
     * @return 保存后的模拟训练数据
     */
    @PostMapping("/submit")
    public ResponseEntity<SimSingleTraining> submitResult(@RequestBody SimSingleTraining training) {
        log.info("收到提交模拟结果请求，用户ID: {}", training.getUserId());
        return ResponseEntity.ok(singleService.submitTrainingResult(training));
    }

    /**
     * 查询用户历史模拟记录
     *
     * @param userId 用户ID
     * @return 模拟记录列表
     */
    @GetMapping("/history")
    public ResponseEntity<List<SimSingleTraining>> getHistory(@RequestParam Long userId) {
        log.info("收到查询用户历史模拟记录请求，用户ID: {}", userId);
        return ResponseEntity.ok(singleService.getUserTrainingHistory(userId));
    }

    /**
     * 查询单条模拟详情（含所有交易记录）
     *
     * @param trainingId 模拟记录ID
     * @return 模拟记录详情
     */
    @GetMapping("/detail/{trainingId}")
    public ResponseEntity<SimSingleTraining> getDetail(@PathVariable Long trainingId) {
        log.info("收到查询单条模拟详情请求，模拟记录ID: {}", trainingId);
        return ResponseEntity.ok(singleService.getTrainingDetail(trainingId));
    }

    /**
     * 获取本地用户信息（桌面版无登录模式，返回模拟资金等）
     *
     * @return 本地用户
     */
    @GetMapping("/local-user")
    public ResponseEntity<User> getOrCreateLocalUser() {
        return ResponseEntity.ok(singleService.getOrCreateLocalUser());
    }
}