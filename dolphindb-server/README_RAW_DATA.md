# DolphinDB 原始数据基线（daily_k_raw）— 不可变，禁止删除/修改

## 数据来源
- 通达信 V64 本地数据（`.day` 二进制文件）
- 路径：`C:\new_tdx64\vipdoc\{sh,sz,bj}\lday\*.day`
- 导入工具：`electron/dolphindb/import-tdx.js`

## 数据范围
| 维度 | 值 |
|---|---|
| 时间范围 | 1998-01-05 ~ 2026-10-08 |
| 股票数量 | 9,482 只（沪深京 A 股全部） |
| 总记录数 | ~2,427 万条 |
| 数据格式 | 不复权原始价格（价格单位：元，成交量：手，成交额：元） |

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
