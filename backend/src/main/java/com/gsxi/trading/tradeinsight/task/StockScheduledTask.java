package com.gsxi.trading.tradeinsight.task;


import com.gsxi.trading.tradeinsight.common.enums.DataTypeEnum;
import com.gsxi.trading.tradeinsight.common.enums.SyncStatusEnum;
import com.gsxi.trading.tradeinsight.entity.DataSyncStatus;
import com.gsxi.trading.tradeinsight.service.AktoolsApiService;
import com.gsxi.trading.tradeinsight.service.DataSyncStatusService;
import com.gsxi.trading.tradeinsight.task.impl.RealtimeStockRedisServiceImpl;
import com.gsxi.trading.tradeinsight.util.StockTimeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/24
 * @description 股市行情定时任务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StockScheduledTask {

    private ScheduledExecutorService scheduler;
    private final DataSyncScheduler dataSyncScheduler;
    private final DataSyncStatusService statusService;

    private final AktoolsApiService aktoolsApiService;
    private final RealtimeStockRedisServiceImpl realtimeStockService;

    // 线程池配置常量
    private static final int CORE_POOL_SIZE = 4;
    //盘中定时任务几分钟一次？
    private static final int INTRADAY_PERIOD_MINUTES = 10;
    //等待现有任务完成时间
    private static final int SHUTDOWN_TIMEOUT_SECONDS = 20;


    @PostConstruct
    public void startScheduler() {
        // 配置线程池参数
        scheduler = new ScheduledThreadPoolExecutor(CORE_POOL_SIZE,
                new CustomThreadFactory("stock-scheduler-gsxi"),
                new CustomRejectedExecutionHandler());

        // 额外配置
        ScheduledThreadPoolExecutor scheduledExecutor = (ScheduledThreadPoolExecutor) scheduler;
        // 取消任务后从队列中移除
        scheduledExecutor.setRemoveOnCancelPolicy(true);
        // 关闭后不继续执行周期任务
        scheduledExecutor.setContinueExistingPeriodicTasksAfterShutdownPolicy(false);
        // 关闭后不执行延迟任务
        scheduledExecutor.setExecuteExistingDelayedTasksAfterShutdownPolicy(false);
        // 盘中的任务
        scheduleIntradayTask();
        //收盘后的任务
        scheduleThreeThirtyTask();
        log.info("股市定时任务调度器已启动，线程池大小：{}", CORE_POOL_SIZE);
    }

    /**
     * 调度任务
     */
    public void scheduleIntradayTask() {
        // 如果已经闭盘，不执行任务
        if (StockTimeUtil.isAfterTradingTime()) {
            log.warn("今日交易已结束，等待下一个交易日...");
            long delay = StockTimeUtil.getMillisToNextTradingTime();
            scheduler.schedule(this::scheduleIntradayTask, delay, TimeUnit.MILLISECONDS);
            return;
        }

        // 如果不在交易时间内，等待到交易时间再执行
        if (!StockTimeUtil.isInTradingTime()) {
            log.warn("未到交易时间，等待中...");
            long delay = StockTimeUtil.getMillisToNextTradingTime();
            scheduler.schedule(this::scheduleIntradayTask, delay, TimeUnit.MILLISECONDS);
            return;
        }

        // 执行任务！
        executeIntradayTask();

        // 计算下一次执行时间（10分钟后）
        long period = INTRADAY_PERIOD_MINUTES * 60 * 1000;
        long timeToClose = StockTimeUtil.getMillisToClose();
        // 如果已经闭盘，则等待到下一个交易时间
        if (period >= timeToClose) {
            long delay = StockTimeUtil.getMillisToNextTradingTime();
            scheduler.schedule(this::scheduleIntradayTask, delay, TimeUnit.MILLISECONDS);
        } else {
            // 否则3分钟后再次执行
            scheduler.schedule(this::scheduleIntradayTask, period, TimeUnit.MILLISECONDS);
        }
    }

    /**
     * 调度每天收盘后执行的任务
     */
    public void scheduleThreeThirtyTask() {
        log.info("收盘任务----------------");
        // 检查是否应该立即执行今日收盘任务
        if (shouldExecuteTodayTask()) {
            // 立即执行收盘任务
            log.info("检测到需要执行今日收盘任务，立即执行");
            scheduler.schedule(() -> {
                executeThreeThirtyTask();
                // 然后安排下一个交易日的任务
                scheduleNextThreeThirtyTask();
            }, 0, TimeUnit.MILLISECONDS);
        } else {
            // 按原计划安排任务
            long delay = StockTimeUtil.getMillisToThreeThirtyPM();
            scheduler.schedule(() -> {
                // 执行下午收盘后的任务
                executeThreeThirtyTask();
                // 安排下一个交易日的下午收盘后任务
                scheduleNextThreeThirtyTask();
            }, delay, TimeUnit.MILLISECONDS);
        }
    }

    /**
     * 安排下一个交易日的收盘任务
     */
    private void scheduleNextThreeThirtyTask() {
        long delay = StockTimeUtil.getMillisToThreeThirtyPM();
        scheduler.schedule(() -> {
            executeThreeThirtyTask();
            scheduleNextThreeThirtyTask();
        }, delay, TimeUnit.MILLISECONDS);
    }

    /**
     * 检查是否应该执行今天的收盘任务（项目启动时如果错过了当天的收盘任务）
     *
     * @return true 如果应该执行今天的任务，false 如果按原计划安排
     */
    private boolean shouldExecuteTodayTask() {
        LocalTime currentTime = LocalTime.now();
        LocalTime threeThirtyPM = LocalTime.of(15, 1);
        LocalTime nineAM = LocalTime.of(9, 15);

        return currentTime.isAfter(threeThirtyPM) || currentTime.isBefore(nineAM);
    }

    /**
     * 盘中的任务
     */
    private void executeIntradayTask() {
        log.info("开始执行盘中数据更新任务");

        try {
            // 调用接口获取盘中实时数据
            List<Map<String, Object>> realtimeData = aktoolsApiService.getStockSpotData();
            if (realtimeData == null || realtimeData.isEmpty()) {
                log.warn("未获取到盘中实时数据，跳过本次更新");
                return;
            }

            // 更新到Redis（5分钟过期）
            realtimeStockService.updateIntradayData(realtimeData);
            log.info("盘中数据更新完成，共更新 {} 条数据", realtimeData.size());

        } catch (Exception e) {
            log.error("盘中定时任务执行失败", e);
        }
    }

    /**
     * 下午3:30执行的任务
     */
    @Transactional(rollbackFor = Exception.class)
    public void executeThreeThirtyTask() {
        log.info("执行下午3点的定时任务-----------------------------------------------------");

        try {
            // 每日收盘后调用（可结合@Scheduled定时任务）
            String recentTradingDay = StockTimeUtil.getRecentTradingDay();
            LocalDate tradeDate = StockTimeUtil.parseDate(recentTradingDay);
            log.info("开始执行数据同步，交易日期：{}", tradeDate);
            dataSyncScheduler.executeAllSync(tradeDate);

            // 查看结果（查询数据库）
            List<DataSyncStatus> statusList = statusService.findByTradeDate(tradeDate);
            logSyncResults(statusList);
            // 3. 执行盘后归档任务
            executeAfterMarketArchive();
            log.info("收盘后任务执行完成");
        } catch (Exception e) {
            log.error("收盘后任务执行失败", e);

            // 记录失败状态到数据库
            recordTaskFailure("收盘后任务执行失败：" + e.getMessage());
        }
    }

    /**
     * 执行盘后归档任务
     */
    private void executeAfterMarketArchive() {
        try {
            log.info("开始执行盘后归档任务");

            // 检查当天是否已有归档数据
            String recentTradingDay = StockTimeUtil.getRecentTradingDay();
            if (realtimeStockService.hasArchiveData(recentTradingDay)) {
                log.info("  - 股票实时行情数据：  {}  已有归档数据，跳过归档任务",recentTradingDay);
                return;
            }

            // 获取盘后数据
            List<Map<String, Object>> afterMarketData = aktoolsApiService.getStockSpotData();

            if (afterMarketData == null || afterMarketData.isEmpty()) {
                log.warn("未获取到盘后数据，跳过归档");
                return;
            }

            // 归档到Redis（30天过期）
            realtimeStockService.archiveAfterMarket(afterMarketData);
            log.info("盘后归档任务完成，共归档 {} 条数据", afterMarketData.size());

        } catch (Exception e) {
            log.error("盘后归档任务失败", e);
            throw new RuntimeException("盘后归档任务失败", e);
        }
    }


    /**
     * 记录任务失败状态
     *
     */
    private void recordTaskFailure(String errorMessage) {
        try {
            DataSyncStatus failureStatus = DataSyncStatus.builder()
                    .dataType("SYSTEM_TASK")
                    .tradeDate(LocalDate.now())
                    .status(SyncStatusEnum.FAIL.getCode())
                    .successCount(0)
                    .failCount(1)
                    .message(errorMessage)
                    .syncTime(LocalDateTime.now())
                    .build();

            statusService.saveOrUpdate(failureStatus);
        } catch (Exception e) {
            log.error("记录任务失败状态时出错", e);
        }
    }

    /**
     * 记录同步结果日志
     */
    private void logSyncResults(List<DataSyncStatus> statusList) {
        if (statusList == null || statusList.isEmpty()) {
            log.warn("未找到数据同步状态记录");
            return;
        }

        log.info("数据同步结果汇总：");
        for (DataSyncStatus status : statusList) {
            String dataTypeDesc = getDataTypeDesc(status.getDataType());
            String statusDesc = getStatusDesc(status.getStatus());

            log.info("  - {}：{}，成功：{}，失败：{}，消息：{}",
                    dataTypeDesc, statusDesc,
                    status.getSuccessCount(), status.getFailCount(),
                    status.getMessage());
        }
    }

    /**
     * 获取数据类型描述
     */
    private String getDataTypeDesc(String dataType) {
        try {
            return DataTypeEnum.valueOf(dataType).getDesc();
        } catch (IllegalArgumentException e) {
            return dataType;
        }
    }

    /**
     * 获取状态描述
     */
    private String getStatusDesc(Integer statusCode) {
        for (SyncStatusEnum status : SyncStatusEnum.values()) {
            if (status.getCode() == statusCode) {
                return status.name();
            }
        }
        return "未知状态";
    }

    @PreDestroy
    public void stopScheduler() {
        if (scheduler != null) {
            log.info("开始关闭定时任务调度器");
            scheduler.shutdown();
            try {
                // 等待现有任务完成
                if (!scheduler.awaitTermination(SHUTDOWN_TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
                    log.warn("定时任务未能在 {} 秒内完成，强制关闭", SHUTDOWN_TIMEOUT_SECONDS);
                    scheduler.shutdownNow(); // 强制关闭
                    // 再次等待
                    if (!scheduler.awaitTermination(SHUTDOWN_TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
                        log.error("定时任务调度器未能完全关闭");
                    }
                }
                log.info("定时任务调度器已成功关闭");
            } catch (InterruptedException e) {
                log.warn("关闭定时任务调度器时被中断");
                scheduler.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }


    /**
     * 自定义线程工厂
     */
    private static class CustomThreadFactory implements ThreadFactory {
        private final AtomicInteger threadNumber = new AtomicInteger(1);
        private final String namePrefix;

        CustomThreadFactory(String namePrefix) {
            this.namePrefix = namePrefix;
        }

        @Override
        public Thread newThread(Runnable r) {
            Thread thread = new Thread(r, namePrefix + "-" + threadNumber.getAndIncrement());
            thread.setDaemon(false); // 非守护线程
            thread.setPriority(Thread.NORM_PRIORITY);
            return thread;
        }
    }

    /**
     * 自定义拒绝策略
     */
    private static class CustomRejectedExecutionHandler implements RejectedExecutionHandler {
        @Override
        public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
            log.error("任务被拒绝执行：{}，线程池状态：活跃线程数={}，队列大小={}，已完成任务数={}",
                    r.toString(),
                    executor.getActiveCount(),
                    executor.getQueue().size(),
                    executor.getCompletedTaskCount());

            // 可以在这里添加告警逻辑
            // 或者尝试重新提交任务
        }
    }

}
