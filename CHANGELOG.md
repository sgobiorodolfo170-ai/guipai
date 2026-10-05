## 版本迭代记录

| 版本号 | 日期 | 摘要 |
| --- | --- | --- |
| v1.3.0 | 2026-10-03 | 数据管理功能完善：新增「数据总览」页（sql.js 13 表行数+文件大小+DolphinDB 5 表行数/最新日期/连接状态/一键重连）与「收盘数据同步」页（近7/14/30天状态矩阵、单日同步/强制重刷/删除、完整收盘、区间批量）；后端新增 /api/data-mgmt/overview；sync.js 补板块/指数幂等查重 + sync-range 区间批量（在途锁、周末免请求、非交易日记跳过、已同步自动跳过、单次上限62天前端切片） |
| v1.2.1 | 2026-10-03 | 修复"DolphinDB 连接失败"弹窗用 showErrorBox 同步阻塞主进程导致内嵌 Express 整体假死（所有接口无响应）；开发端口 5173→5174 并支持自动顺延+占用检测（不再误连他人 dev server）；上游冷启动预热（腾讯/同花顺/东财push2ex/Tushare 并行长超时+慢则补打）；腾讯 K线/分时改短超时+并发对冲、count 下限 200；全市场快照进程内记忆化+在途去重（/stocks 与 /market/hot 复用，不再重复拉 28 页）；Tushare 日K 改用 daily+adj_factor 自算前复权（原 pro_bar 接口不存在恒报错）；DolphinDB 未连接时读库快速短路+连接失败冷却 30s；/stocks/:code/kline 补 300s 缓存 |
| v1.2.0 | 2026-10-03 | 指数卡片修复（指数取数三源竞速、空缓存不存并自愈）；"一并修"修复 getStockSpot/getStockIndustry 误读 data.list 恒为空的 bug；新增跨厂商兜底：K线/分时/指数→腾讯、全市场→腾讯榜单、行业板块→同花顺，主源报错时自动降级并 warn 留痕（count 上限 2000） |
| v1.1.0 | 2026-10-02 | 复盘页第一行卡片重构（涨停/跌停→深证指数/创业板指数，修复最高板标题）；新增复盘数据本地缓存持久化（localStorage，打开读缓存、刷新拉取最新）；AGENTS.md 固化验收流程（编码后自动 npm run build） |
| v1.0.0 | 2026-09-23 | 项目更名龟派（guipai），完成 Electron + Node.js 方案 B 改造（去 Java 后端，sql.js 数据库，进程内缓存），适配 AGENTS.md |
| v0.9.0 | 2026-09-23 | 移除账户登录功能（Sa-Token + jbcrypt），新增本地用户自动创建 |
| v0.8.0 | 2026-09-22 | Electron 桌面版方案 A 改造（Electron + Spring Boot JAR + H2 + 内置 JRE），Windows NSIS 安装包 177MB |
| v0.7.0 | 2026-09-22 | 从远程 Web+Java 改为 Electron 桌面版，新增加载页、后端管理器、JRE 打包 |
| v0.6.0 | 2026-09-22 | 前端适配桌面版（hash 路由、相对路径、API 指向本地） |
