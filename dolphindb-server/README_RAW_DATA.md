# DolphinDB 原始日K基线（daily_k_raw）— 官方数据包每日增量维护

## 数据来源
- 通达信官网数据包（每日 `g3day/YYYYMMDD.zip` + `bjlday.zip`；全量 `hsjday.zip`；指数 `shzsday/szzsday.zip`）
- 本地通达信 V64 数据（备用 / 全量重建）：`C:\new_tdx64\vipdoc\{sh,sz,bj}\lday\*.day`
- 工具：`electron/dolphindb/import-package.js`（CLI）、`electron/dolphindb/package-import.js`（编排库）、
  `electron/dolphindb/tdx-import.js`（本地 .day 遍历/导入库）

## 数据范围
| 维度 | 值 |
|---|---|
| 时间范围 | 1998-01-05 起；每日 18:10 自动追加当日，启动时补跑最近 5 个交易日 |
| 股票数量 | 约 5,500 只 A 股/日（沪 6xxxxx、深 00/30、北交所 43/83/87/88/92） |
| 记录数 | 约 2,000 万（以 `select count(*)` 为准） |
| 数据格式 | 不复权原始价格（价格单位：元，成交量：手，成交额：元） |

> **口径说明**：早期历史数据曾混入基金/债券（15/16/50/51 等前缀）与指数。现行链路只写 A 股个股，
> 指数一律走独立表 `stock_zh_index_daily` + `/api/market/index-kline`；覆盖率统计也按 A 股口径过滤。

## 数据边界（重要约定）
- **每日快照**：`g3day` 的 `mdt/cod` 提供当日全市场个股快照（不含北交所），按日期“先删后插”写入
  `daily_k_raw`，保证同日重跑幂等。
- **北交所**：`bjlday.zip` 每日整包更新，逐文件取当日末条；停牌/退市自然缺失。
- **指数**：`stock_zh_index_daily` 只写 000001/399001/399006，且只写 2024-01-01 起
  （`dfs://tradeinsight` 分区起点，更早写入会被 DolphinDB 静默丢弃）。
- **全量重建**：可用 `hsjday.zip`（含沪深北）或本地 vipdoc 目录；已有历史需补深/纠错时用 `--refresh`。
- **前复权查询层**：`daily_k` 仍由行情源增量维护，与 raw 表独立。

## 导入工具（幂等）
```
node electron/dolphindb/import-package.js status
node electron/dolphindb/import-package.js daily [YYYY-MM-DD] [--days 5] [--force]
node electron/dolphindb/import-package.js full [--start 1990-01-01] [--end YYYY-MM-DD] [--refresh]
node electron/dolphindb/import-package.js index [--from 2024-01-01]
node electron/dolphindb/import-package.js financial [--from 2010-01-01] [--data-dir <sqlite数据目录>]
```
- 定时任务：`electron/server/package-sync.js` 每天 18:10 执行；页面「数据管理 → 收盘数据同步」可手动补跑/停止。
- 缓存目录：`<userData>/tdx-packages`（可用 `TDX_PACKAGE_CACHE` 覆盖）；每日包默认保留 30 天。
- 本地 vipdoc 导入仍可用 `tdx-import.js`（full/incremental/refresh/verify）。

## 存储位置
- DolphinDB 库：`dfs://tradeinsight_raw`（独立库，RANGE 分区 1990-2031 年度）
- 表名：`daily_k_raw`
- 分区列：`trade_date`

## 表结构
| 列名 | 类型 | 说明 |
|---|---|---|
| symbol | SYMBOL | 股票代码（纯数字，如 600519） |
| trade_date | DATE | 交易日期 |
| open | DOUBLE | 开盘价（不复权，元） |
| close | DOUBLE | 收盘价（不复权，元） |
| high | DOUBLE | 最高价（不复权，元） |
| low | DOUBLE | 最低价（不复权，元） |
| volume | LONG | 成交量（手） |
| amount | DOUBLE | 成交额（元） |

## ⚠️ 维护约定
- 本表由数据包链路维护：**允许按日期删除并重写**（幂等），但不得删除整表、不得写入前复权数据。
- 前复权数据只进 `dfs://tradeinsight` / `daily_k`（查询层）。
- 每日写入前先删当日再批量插入；异常中断后重新执行同日同步即可恢复。
- 覆盖/验证统计见「收盘数据同步 → 数据可视化」，或 `/api/market-sync/completeness`、`/api/market-sync/validate`。

## 与 daily_k 的关系
- `daily_k_raw`（本表）：不复权原始数据，历史基线 + 每日增量。
- `daily_k`（`dfs://tradeinsight`）：前复权（qfq）数据，前端查询优先使用；数据不足时由 `daily_k_raw` 兜底。
