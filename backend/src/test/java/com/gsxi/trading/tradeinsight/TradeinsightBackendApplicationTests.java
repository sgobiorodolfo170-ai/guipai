package com.gsxi.trading.tradeinsight;

import com.gsxi.trading.tradeinsight.service.AktoolsApiService;
import com.gsxi.trading.tradeinsight.service.DataSyncStatusService;
import com.gsxi.trading.tradeinsight.task.DataSyncScheduler;
import com.gsxi.trading.tradeinsight.task.StockScheduledTask;
import com.gsxi.trading.tradeinsight.task.impl.RealtimeStockRedisServiceImpl;
import com.gsxi.trading.tradeinsight.util.StockTimeUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;


@SpringBootTest
@Slf4j
class TradeinsightBackendApplicationTests {

    private StockScheduledTask stockScheduledTask;

    @Autowired
    DataSyncScheduler dataSyncScheduler;
    @Autowired
    DataSyncStatusService statusService;
    @Autowired
    AktoolsApiService aktoolsApiService;
    @Autowired
    RealtimeStockRedisServiceImpl realtimeStockService;


//    @BeforeEach
//    void setUp() {
//        // 初始化服务（如果需要Spring上下文，可用@SpringBootTest）
//        stockScheduledTask = new StockScheduledTask(dataSyncScheduler,statusService,aktoolsApiService,realtimeStockService);
//        stockScheduledTask.startScheduler();
//        // 重置测试模式
//        StockTimeUtil.setTestMode(false, null);
//    }
//
//    @AfterEach
//    void tearDown() {
//        stockScheduledTask.stopScheduler();
//    }
//
//    /**
//     * 测试场景1：闭盘后（15:30）
//     */
//    @Test
//    void testAfterTradingTime() throws InterruptedException {
//        // 模拟时间：2025-01-02 15:30（交易日闭盘后）
//        LocalDateTime testTime = LocalDateTime.of(2025, 8, 26, 15, 1);
//        StockTimeUtil.setTestMode(true, testTime);
//
//        // 触发任务调度
//        stockScheduledTask.scheduleThreeThirtyTask();
//
//        // 等待1秒，观察控制台输出是否为"今日交易已结束..."
//        TimeUnit.SECONDS.sleep(1);
//    }
//
//    /**
//     * 测试场景2：交易中（10:00，距离收盘还有5小时）
//     */
//    @Test
//    void testInTradingTime() throws InterruptedException {
//        // 模拟时间：2025-01-2 10:00（交易中）
//        LocalDateTime testTime = LocalDateTime.of(2025, 8, 25, 10, 0);
//        StockTimeUtil.setTestMode(true, testTime);
//
//        // 用计数器等待2次打印（初始1次 + 3分钟后1次）
//        CountDownLatch latch = new CountDownLatch(2);
//
//        // 替换打印方法为计数（通过子类或反射，这里简化为手动观察）
//        stockScheduledTask.scheduleIntradayTask();
//
//        // 等待6分钟（模拟3分钟间隔执行2次）
//        // 实际测试可缩短时间（需配合修改period为1秒）
//        latch.await(6, TimeUnit.MINUTES);
//    }
//
//    /**
//     * 测试场景3：即将闭盘（14:58，距离收盘2分钟）
//     */
//    @Test
//    void testBeforeClose() throws InterruptedException {
//        // 模拟时间：2025-01-2 14:58（距离收盘2分钟）
//        LocalDateTime testTime = LocalDateTime.of(2025, 8, 26, 15, 0, 59);
//        StockTimeUtil.setTestMode(true, testTime);
//
//        stockScheduledTask.scheduleIntradayTask();
//
//        // 等待3分钟，观察是否在15:00打印最后一次
//        TimeUnit.MINUTES.sleep(3);
//    }

    public static void main(String[] args) {
        LocalDateTime testTime = LocalDateTime.of(2025, 8, 27, 14, 58, 59);
        StockTimeUtil.setTestMode(true, testTime);
        System.out.println("距离闭盘还有：" + StockTimeUtil.getMillisToNextTradingTime()/1000/60);


    }

}
