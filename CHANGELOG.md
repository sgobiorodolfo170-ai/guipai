## 版本迭代记录

| 版本号 | 日期 | 摘要 |
| --- | --- | --- |
| v1.2.0 | 2026-10-03 | 指数卡片修复（指数取数三源竞速、空缓存不存并自愈）；"一并修"修复 getStockSpot/getStockIndustry 误读 data.list 恒为空的 bug；新增跨厂商兜底：K线/分时/指数→腾讯、全市场→腾讯榜单、行业板块→同花顺，主源报错时自动降级并 warn 留痕（count 上限 2000） |
| v1.1.0 | 2026-10-02 | 复盘页第一行卡片重构（涨停/跌停→深证指数/创业板指数，修复最高板标题）；新增复盘数据本地缓存持久化（localStorage，打开读缓存、刷新拉取最新）；AGENTS.md 固化验收流程（编码后自动 npm run build） |
| v1.0.0 | 2026-09-23 | 项目更名龟派（guipai），完成 Electron + Node.js 方案 B 改造（去 Java 后端，sql.js 数据库，进程内缓存），适配 AGENTS.md |
| v0.9.0 | 2026-09-23 | 移除账户登录功能（Sa-Token + jbcrypt），新增本地用户自动创建 |
| v0.8.0 | 2026-09-22 | Electron 桌面版方案 A 改造（Electron + Spring Boot JAR + H2 + 内置 JRE），Windows NSIS 安装包 177MB |
| v0.7.0 | 2026-09-22 | 从远程 Web+Java 改为 Electron 桌面版，新增加载页、后端管理器、JRE 打包 |
| v0.6.0 | 2026-09-22 | 前端适配桌面版（hash 路由、相对路径、API 指向本地） |
