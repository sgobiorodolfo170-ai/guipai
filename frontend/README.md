# 龟派（guipai）— A 股交易洞察桌面应用（前端）

基于 Electron + Vue 3 + Node.js 的 A 股交易复盘与洞察桌面应用前端部分。后端为 Node.js Express 服务（内嵌于 Electron 主进程），数据源使用 Python AKTools 行情接口。

> 完整项目说明见仓库根目录；本 README 仅描述 `frontend/` 前端子工程。

## 功能特性

- 📊 **仪表盘** - 市场概况、指数行情（上证/深证/创业板）
- 🔁 **复盘页** - 涨停池/跌停池分类、连板分析、三大指数概览、最高板；数据本地缓存持久化，点击刷新手动拉取最新
- 📈 **K线实战** - 随机股票 K 线复盘训练
- 📋 **复盘笔记 / 分析模板** - 自定义复盘记录与模板
- ⭐ **自选股管理** - 添加、分组管理自选股票
- 🔍 **股票列表 / 详情 / 分析** - 股票搜索与行情详情
- 🗄️ **数据管理** - 复盘数据任务表、报错日志
- 🧪 **API 测试** - 后端接口联调工具

## 技术栈

- **框架**: Vue 3 (Composition API / `<script setup>`)
- **UI 组件库**: Element Plus
- **图表库**: ECharts
- **状态管理**: Pinia
- **路由**: Vue Router 4（hash 模式，适配 Electron 本地加载）
- **构建工具**: Vite 7
- **样式**: SCSS
- **HTTP 客户端**: Axios（带网络重试与统一错误提示）

## 项目结构

```
frontend/
├── src/
│   ├── assets/styles/            # 全局样式（SCSS 变量、mixins）
│   ├── components/
│   │   ├── common/               # 通用组件（KLine、HistoryDataModal、SliderFilter 等）
│   │   ├── layout/               # 布局组件（AppSidebar 等）
│   │   └── admin/ icons/
│   ├── composables/              # 组合式函数（useReview、useStockData 等）
│   ├── router/                   # 路由配置（hash 路由）
│   ├── store/                    # Pinia 状态管理
│   ├── services/                 # API 服务层
│   ├── utils/                    # 工具函数（api.js、cacheStorage.js、StockDateUtil 等）
│   ├── views/                    # 页面视图
│   │   ├── dashboard/ review/ stock/ watchlist/
│   │   ├── note/ template/ user/ settings/ admin/
│   │   ├── kline-practice/ test/ error/
│   ├── App.vue
│   └── main.js
└── 后端API/                      # 后端接口文档
```

## 开发环境

### 环境要求

- Node.js >= 20.19.0（或 >= 22.12.0）

### 开发模式启动

前端建议通过仓库根目录统一启动（同时拉起 vite dev server 与 Electron）：

```bash
# 在仓库根目录
npm run dev        # 等价于 node electron/dev-runner.js
```

仅启动前端 vite dev server（浏览器调试用）：

```bash
cd frontend
npm run dev        # http://localhost:5174（端口取自 .env 的 VITE_DEV_PORT）
```

### 构建

```bash
# 仅构建前端产物（frontend/dist/）
cd frontend && npm run build

# 构建 Electron 安装包（根目录，会先构建前端）
npm run build
```

### 预览生产构建

```bash
cd frontend && npm run preview
```

## 环境变量

```bash
# API 基础地址（桌面版始终指向内嵌于 Electron 主进程的本地后端）
VITE_API_BASE_URL=http://localhost:8080/api

# 应用信息
VITE_APP_TITLE=龟派
VITE_APP_VERSION=1.0.0

# 开发端口（开发端口的唯一来源：vite dev server、dev-runner、Electron standalone 均读此值；
# 5173 常被本机其它项目占用，故默认 5174。dev-runner 会从此端口起向后扫描空闲端口；
# 也可用 GP_DEV_PORT 环境变量临时覆盖起始端口）
VITE_DEV_PORT=5174
```

## 核心模块说明

### 复盘页（Review）
- 数据概览区：上证指数 / 深证指数 / 创业板指数 / 最高板
- 涨停池分类：高位板、四连板、三连板、二连板、一连板
- 历史数据弹窗：涨停/跌停/一字板/连板率/炸板回封/最高连板/昨日涨停涨幅的 30 天趋势
- **缓存机制**：复盘数据持久化到 localStorage（`utils/cacheStorage.js`），打开页面优先读缓存直出，不主动拉取；点击刷新按钮才从后端拉取最新数据并更新缓存
- 行情数据来源：AKTools 指数/涨跌停池接口（经 Electron 内嵌后端 `/api/aktools/*` 转发）

## API 说明

后端路由统一挂载在 Electron 主进程 Express 服务（默认 `http://localhost:8080`）：

- `/api/health` - 健康检查
- `/api/aktools/*` - AKTools 行情（指数、涨跌停池、行业、K线、个股实时行情）
- `/api/limit-board-statistics/*` - 涨跌停板统计分析
- `/api/sync-status/*` - 数据同步状态
- `/api/sim-training/*` - 模拟训练
- `/api/kline/*` - K线数据
- `/api/stocks/*` - 自选股等
- `/api/market/*` - 市场数据
- `/api/settings/tushare` - Tushare token 配置

接口文档见 `后端API/` 目录。
