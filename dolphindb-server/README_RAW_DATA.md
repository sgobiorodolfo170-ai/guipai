# DolphinDB 原始数据基线（daily_k_raw）— 不可变，禁止删除/修改

## 数据来源
- 通达信 V64 本地数据（`.day` 二进制文件）
- 路径：`C:\new_tdx64\vipdoc\{sh,sz,bj}\lday\*.day`
- 导入工具：`electron/dolphindb/import-tdx.js`（CLI）+ `electron/dolphindb/tdx-import.js`（可复用库）

## 数据范围
| 维度 | 值 |
|---|---|
| 时间范围 | 1998-01-05 ~ **2026-10-08** |
| 股票数量 | 9,357 只（沪深京 A 股个股，区间内有数据） |
| 总记录数 | **23,566,963**（与本地 .day 区间内个股记录逐 symbol 一致，零缺口） |
| 数据格式 | 不复权原始价格（价格单位：元，成交量：手，成交额：元） |

> **数据规模变更说明（2026-10-14 清理）**：原导入曾混入 sh 上证指数（66 只 00xxxx，
> 如 000001=上证指数）与 sz 深证指数（104 只 399xxx，如 399001=深证成指）到 daily_k_raw，
> 导致 45 只 `00xxxx` 与深市同名个股（如 000001=平安银行）同 symbol 混叠。已按方案 A 清理：
> raw 表仅存**个股**；指数数据一律走独立表 `stock_zh_index_daily` + `/api/market/index-kline`。
> 清理后：删 170 只指数 symbol（冗余 275,540 行），行数 24,270,484 → 23,566,963，
> 重复(symbol,date)=0，逐 symbol 与本地个股零差异。

## 数据边界（重要约定）
- **daily_k_raw 只存 [1998-01-01, 2026-10-08] 的本地通达信基线**，之后（2026-10-09 起）的新交易日
  **一律走 aktools 网络接口**：由 `stock.js /:code/kline` 断点续传增量拉取，写入
  `dfs://tradeinsight` / `daily_k`（前复权查询层）。raw 表不追加网络数据，保持"本地基线"语义。
- 区间外无历史数据（1998 前）与区间后新数据（10-08 后上市的新股/新基金）不在本表，
  前者无意义、后者由网络层补齐。
- **daily_k_raw 只存个股，不存指数**：导入时跳过 `sh/000xxx`（上证指数系列）与
  `sz/399xxx`（深证指数系列），指数由 `stock_zh_index_daily` 表 + `/api/market/index-kline`
  提供。此规则由 `tdx-import.js` 的 `isIndexFile()` 强制保证。

## 导入工具（可复用，幂等）
```
node electron/dolphindb/import-tdx.js                       # 默认 full：19980101~20261008
node electron/dolphindb/import-tdx.js --mode=verify         # 只校验缺口（只读）
node electron/dolphindb/import-tdx.js --mode=full           # 全量（缺的补、已有的跳过）
node electron/dolphindb/import-tdx.js --mode=incremental    # 仅补库内缺失的 symbol
node electron/dolphindb/import-tdx.js --mode=refresh        # 强制重刷 [start,end]（先删后插）
node electron/dolphindb/import-tdx.js --start=19980101 --end=20261008
```
校验：`--mode=verify` 输出本地 vs 库内行数、缺失 symbol、逐 symbol 条数差异。

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

## ⚠️ 不可变声明
此表为项目**原始数据基线**，从通达信本地数据一次性导入。

- **禁止**删除此表或其中的任何数据。
- **禁止**修改已导入的任何记录。
- **禁止**用前复权数据覆盖此表——前复权数据存入 `dfs://tradeinsight` / `daily_k`（查询层）。
- 此表是**唯一的不复权数据源**，用于后续前复权计算、数据校验、回测基准。

如果需要更新数据（如通达信更新了新交易日数据），应**追加**新日期的数据，不得删除/修改已有日期的数据。

## 与 daily_k 的关系
- `daily_k_raw`（本表）：不复权原始数据，只读基线。
- `daily_k`（在 `dfs://tradeinsight` 中）：前复权（qfq）数据，前端查询用。通过东财/Tushare 的 `getStockHistory(adj='qfq')` 或 `pro_bar(adj='qfq')` 获取，与 `daily_k_raw` 独立维护。
