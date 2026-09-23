# TradeInsight - 股票复盘分析平台

一个基于 Vue 3 + Element Plus 的股票复盘分析平台，帮助投资者记录和分析股票投资心得。

## 功能特性

- 📊 **股票数据展示** - 实时股票价格、K线图表
- ⭐ **自选股管理** - 添加、分组管理自选股票
- 📝 **复盘笔记** - 记录投资心得和分析思路
- 📋 **分析模板** - 自定义复盘分析模板
- 🔍 **股票搜索** - 快速搜索股票信息
- 📱 **响应式设计** - 支持移动端访问

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **UI组件库**: Element Plus
- **图表库**: ECharts
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **构建工具**: Vite
- **样式**: SCSS

## 项目结构

```
src/
├── assets/                         # 静态资源
│   ├── images/                     # 图片资源
│   └── styles/                     # 全局样式
├── components/                     # 公共组件
│   ├── common/                     # 通用组件
│   ├── layout/                     # 布局组件
│   └── auth/                       # 认证相关组件
├── composables/                    # 组合式函数
├── router/                         # 路由配置
├── store/                          # Pinia状态管理
├── services/                       # API服务
├── utils/                          # 工具函数
├── views/                          # 页面视图
│   ├── auth/                       # 认证页面
│   ├── dashboard/                  # 仪表盘
│   ├── stock/                      # 股票页面
│   ├── note/                       # 笔记页面
│   ├── template/                   # 模板页面
│   ├── watchlist/                  # 自选股页面
│   └── user/                       # 用户中心
├── App.vue                         # 根组件
└── main.js                         # 入口文件
```

## 开发指南

### 环境要求

- Node.js >= 20.19.0
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发环境启动

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 核心功能模块

### 1. 认证系统
- 用户登录/注册
- JWT Token 管理
- 路由权限控制

### 2. 股票数据
- 实时股价展示
- K线图表分析
- 技术指标计算
- 股票搜索功能

### 3. 自选股管理
- 添加/移除自选股
- 分组管理
- 价格提醒设置
- 实时数据更新

### 4. 复盘笔记
- 富文本编辑器
- 分类标签管理
- 搜索和筛选
- 附件上传

### 5. 分析模板
- 自定义模板创建
- 模板分享功能
- 基于模板创建笔记

## API 接口

项目使用 RESTful API 设计，主要接口包括：

- `/api/auth/*` - 认证相关
- `/api/stocks/*` - 股票数据
- `/api/watchlist/*` - 自选股管理
- `/api/notes/*` - 笔记管理
- `/api/templates/*` - 模板管理

## 环境变量

```bash
# API 基础地址
VITE_API_BASE_URL=http://localhost:8080/api

# 应用信息
VITE_APP_TITLE=TradeInsight
VITE_APP_VERSION=1.0.0
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。
