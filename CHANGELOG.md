## 版本迭代记录

| 版本号 | 日期 | 摘要 |
| --- | --- | --- |
| v1.8.0 | 2026-10-13 | 数据流全链路 DB-first 重构（C1-C5）：前端只从 sql.js + DolphinDB 取数，aktools 降级为纯写路径（write-on-miss：缓存 miss → DolphinDB 读 → 未命中则行情源取数 → 转换入库 → 读回 → 响应带"已入库"标识）。新增 5 张 DolphinDB 表（stock_spot/stock_index_spot/minute_k/stock_holding/zt_pool_previous）+ sql.js board_constituents；新增 spot/index-spot/minute/holding 四个 repository；routes 层 18 个端点改造（stock 5 + market 3 + boards 2 + kline 1 + aktools 7）。数据管理「数据总览」新增 5 表登记 |
| v1.7.1 | 2026-10-13 | 修复模拟盘 /random 不可用：daily_k 仅 9 只共 4852 行，84 只采样池抽中其余即报"缺数据"；新增 kline-repository.getDailyKRaw 读 daily_k_raw（9482 只/2427 万行）兜底，缺失的 turnover_rate/pct_chg/amplitude 以 null 返回不混算；修正回看窗口把交易日数当日历天用（250 交易日只回看 310 天≈207 交易日），改 1.5 倍+30 天缓冲 |
| v1.7.0 | 2026-10-13 | 修复 C1-C5 引入的 4 个运行时缺陷 + DolphinDB 脚本注入防护：补回被误删的 convertSpot 定义（C3 编辑事故，只留导出语句，导致 routes/aktools.js require 时 ReferenceError、整个 Express 起不来；node --check 属运行期错误查不出）；getSpotByCode 返回数组但调用方按单对象消费，价格全 0；/random 传紧凑日期 20260615 被 DolphinDB 当 LONG 解析致分区列比较报 S02040；tdx_quant.getSnapshot 收到 params 对象时走到 c.includes 抛 TypeError，顶掉整个 spot failover 聚合错误；registry.failover 抛 lastErr 丢失各源原因，改为聚合进 message。新增 params.js safeSymbol/safeDate 白名单——DolphinDB 脚本无参数绑定，原代码把 query 的 symbol/date 直接字符串拼接进脚本 |
| v1.6.0 | 2026-10-08 | K线图全面替换为 KLineCharts v10：新建 KLineChart.vue 通用组件（内置 MA/MACD/KDJ/RSI/BIAS/BOLL 等指标一键切换、画线工具栏水平线/趋势线/平行通道/斐波那契/矩形/文字、日周月K周期切换、前/后复权切换、十字光标价格标签、红涨绿跌A股主题、左滑分页加载更早数据）；删除旧 ECharts KLine.vue；StockDetail.vue 新增完整K线图（含周期/复权/画线/指标）；Watchlist.vue 新增图表 Drawer（懒加载 mini K线）；Dashboard.vue 新增指数K线 Tab（上证/深证/创业板）；Review.vue mini K线迁移到 KLineChart（组件自行拉数据，移除手动 fetch）；RandomStockPractice.vue 实战训练迁移（customDataLoader 渐进揭示：set​DataLoader 返回 [0,currentIndex] 切片 + resetData 每步重触发 getBars）；后端新增 GET /api/market/index-kline（调用已有 aktools.getIndexDailyData，东财→腾讯多源兜底）；新增 utils/klineData.js 数据转换工具；stock.service.js 新增 getIndexKLine |
| v1.5.0 | 2026-10-05 | K线断点续传：DolphinDB 已有区间只补缺口（起点回退 7 天重叠对账防复权锚点漂移），增量拉取受限时返回库内部分数据并注明恢复时长；上游多源全部失败时聚合各源原因并携带 retryAfterSec，路由层统一返回 code=429"请约 N 秒后重试"；前端拦截器对 429 用 warning 提示（6 秒展示）；Tushare 池新增恢复倒计时查询 |
| v1.4.0 | 2026-10-05 | Tushare 数据源升级为多账号池：设置页支持多账号增删改/启停/单账号连通性测试/调用统计展示；tushare.js 新增账号池（最久未用优先轮询 + 按错误类型故障转移：无效token停用、限频冷却60s、网络失败冷却10s、无权限换号不冷却、接口错误直接抛出）；settings.js 数组化存储并自动迁移旧单 token；aktools 涨跌停/跌停/日K 兜底改走账号池 |
| v1.3.1 | 2026-10-05 | 修复收盘同步页操作按钮 500：api.post(url, null) 被 axios 序列化为 "null"，body-parser 严格模式拒绝非 { 或 [ 开头的 JSON 体（Unexpected token 'n'）→ 改发 {} 空对象体 |
| v1.3.0 | 2026-10-03 | 数据管理功能完善：新增「数据总览」页（sql.js 13 表行数+文件大小+DolphinDB 5 表行数/最新日期/连接状态/一键重连）与「收盘数据同步」页（近7/14/30天状态矩阵、单日同步/强制重刷/删除、完整收盘、区间批量）；后端新增 /api/data-mgmt/overview；sync.js 补板块/指数幂等查重 + sync-range 区间批量（在途锁、周末免请求、非交易日记跳过、已同步自动跳过、单次上限62天前端切片） |
| v1.2.1 | 2026-10-03 | 修复"DolphinDB 连接失败"弹窗用 showErrorBox 同步阻塞主进程导致内嵌 Express 整体假死（所有接口无响应）；开发端口 5173→5174 并支持自动顺延+占用检测（不再误连他人 dev server）；上游冷启动预热（腾讯/同花顺/东财push2ex/Tushare 并行长超时+慢则补打）；腾讯 K线/分时改短超时+并发对冲、count 下限 200；全市场快照进程内记忆化+在途去重（/stocks 与 /market/hot 复用，不再重复拉 28 页）；Tushare 日K 改用 daily+adj_factor 自算前复权（原 pro_bar 接口不存在恒报错）；DolphinDB 未连接时读库快速短路+连接失败冷却 30s；/stocks/:code/kline 补 300s 缓存 |
| v1.2.0 | 2026-10-03 | 指数卡片修复（指数取数三源竞速、空缓存不存并自愈）；"一并修"修复 getStockSpot/getStockIndustry 误读 data.list 恒为空的 bug；新增跨厂商兜底：K线/分时/指数→腾讯、全市场→腾讯榜单、行业板块→同花顺，主源报错时自动降级并 warn 留痕（count 上限 2000） |
| v1.1.0 | 2026-10-02 | 复盘页第一行卡片重构（涨停/跌停→深证指数/创业板指数，修复最高板标题）；新增复盘数据本地缓存持久化（localStorage，打开读缓存、刷新拉取最新）；AGENTS.md 固化验收流程（编码后自动 npm run build） |
| v1.0.0 | 2026-09-23 | 项目更名龟派（guipai），完成 Electron + Node.js 方案 B 改造（去 Java 后端，sql.js 数据库，进程内缓存），适配 AGENTS.md |
| v0.9.0 | 2026-09-23 | 移除账户登录功能（Sa-Token + jbcrypt），新增本地用户自动创建 |
| v0.8.0 | 2026-09-22 | Electron 桌面版方案 A 改造（Electron + Spring Boot JAR + H2 + 内置 JRE），Windows NSIS 安装包 177MB |
| v0.7.0 | 2026-09-22 | 从远程 Web+Java 改为 Electron 桌面版，新增加载页、后端管理器、JRE 打包 |
| v0.6.0 | 2026-09-22 | 前端适配桌面版（hash 路由、相对路径、API 指向本地） |
