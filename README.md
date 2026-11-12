# 龟派（guipai）

A 股交易洞察桌面应用。面向个人投资者的本地工具：行情看盘、涨停复盘、自选股、股票笔记、模拟持仓与风控、K 线实战训练。

**它是桌面软件，不是网站** —— 数据、数据库、服务全部跑在本机，不依赖任何云端账号。

---

## 快速开始

```bash
# 1. 安装依赖（根目录 + 前端两处）
npm install
npm --prefix frontend install

# 2. 开发模式（同时拉起 Vite dev server 与 Electron）
npm run dev

# 3. 打 Windows 安装包
npm run build
```

首次启动会较慢（约 1 分钟）：需要拉起 DolphinDB 引擎并预热行情连接。

### 质量门禁

```bash
npm test        # 领域逻辑单元测试（28 项，零依赖零网络）
npm run lint    # ESLint（no-undef / no-unused-vars）
npm run smoke   # 行情源真机冒烟（需要网络）
```

> 改动代码后至少跑 `npm test` + `npm run lint` + `npm run build:frontend`。
> 这三个信号都是确定性的，不依赖"人眼看页面"。

---

## 它依赖哪些外部环境

这是本地项目最容易踩的坑：**它不是装完就能用，还需要本机有数据源**。缺哪一项，对应能力就降级。

| 依赖 | 用途 | 缺失时的表现 |
| --- | --- | --- |
| **DolphinDB**（随包分发，8848） | 历史日K（约 2400 万行）、复权因子、权息事件、复盘指标 | 日K/复盘/板块/驾驶舱行情为空，界面顶部会提示"历史行情库未连接" |
| **通达信客户端**（可选，17709） | 实时行情与财务数据的本地源 | 自动降级到腾讯或 tqs，功能不受影响但可能慢一些 |
| **Python + tdxaidata**（可选，8889） | tqs 数据桥，免客户端的通达信数据 | 自动降级，无需手工干预 |
| **网络** | 腾讯行情（全市场快照约 5580 只） | 只能看库内已有数据 |

数据源优先级：**腾讯 + 通达信三路（本地 .day / tdx_quant / tqs）**，多源自动切换并熔断。
东方财富、新浪、AKShare 已永久弃用（见 `AGENTS.md` 数据源红线），代码中不应再出现。

---

## 目录结构

```
electron/
├── main.js               Electron 主进程：窗口、DolphinDB 进程管理、服务启动
├── preload.js            安全桥（contextIsolation 开、nodeIntegration 关）
├── server/
│   ├── index.js          内嵌 Express（仅监听 127.0.0.1 + token 鉴权）
│   ├── db.js             sql.js（SQLite WASM）持久化、每日备份、完整性校验
│   ├── domain/           纯计算层（持仓回放、盈亏公式）—— 可单测，不碰 DB
│   ├── routes/           HTTP 路由（135 个端点）
│   ├── sources/          行情源与多源调度（registry）
│   └── limit-board-derive.js  涨停/连板/复盘指标推导
├── dolphindb/            DolphinDB 仓储层（含脚本注入白名单 params.js）
└── test/                 单元测试（node:test）

frontend/src/
├── views/                20 个业务页面
├── components/           通用组件（KLineChart、ErrorBoundary 等）
├── composables/          组合式逻辑
├── services/             API 适配层
├── utils/                api.js（axios + token）、echarts.js（按需注册）
└── store/                Pinia
```

---

## 数据口径（改指标前必读）

同一指标可能存在多张表、多种复权口径，历史上多次出现"两个页面数字对不上"。改之前先确认权威来源：

| 指标 | 权威数据 | 说明 |
| --- | --- | --- |
| 日K（展示/计算） | `daily_k_qfq` | 前复权物化表，复盘指标的唯一口径 |
| 日K（原始） | `daily_k_raw` | 不复权原始收盘，复权因子的计算基准 |
| 实时快照 | `stock_spot` | 盘中由腾讯写入，盘后回落库内 |
| 涨停/连板 | `limit-board-derive.js` 实时推导 | 按前复权涨跌幅 + 板块阈值判定，**不读** `stock_limit_pool` 成员 |
| 持仓/盈亏 | `trade` 表回放（`domain/position.js`） | `trade` 是唯一事实源，`position` 是物化结果，勿手工改 |

字段变更必须同步 `electron/server/routes/data-mgmt.js` 的 `FIELD_DEFS` 与 `SQLITE_COVERAGE`，
否则「数据管理 → 数据总览」会与库结构脱节。

---

## 安全

本地服务不是"只有本机能访问"就等于安全——用户浏览器里的任意网页同样能访问 `127.0.0.1`。
因此设置了三层防护：

1. 只监听 `127.0.0.1`（局域网不可达）
2. CORS 白名单（仅本机 dev server 与 `file://` 渲染进程）
3. 启动时生成的随机 token，浏览器发起的请求必须带 `X-App-Token`

本地脚本（node 冒烟、curl 调试）不受 token 限制，无需额外配置。

---

## 版本与变更

- 版本号规则：`主.次.修订`（`feat` 升次版本、`fix`/`refactor` 升修订号）
- **唯一来源**：根 `package.json` 的 `version`，前端构建时注入页脚
- 每次迭代在 `CHANGELOG.md` 记一行：版本号、日期、根因 → 方案 → 实测数据 → 验证结论

---

## 已知限制

- 仅 Windows（通达信数据源与 DolphinDB 二进制均为 Windows 版）
- 无多用户、无鉴权体系：定位是单机单人工具
- 仓库含 DolphinDB 发行版（约 1.7GB），clone 较慢
