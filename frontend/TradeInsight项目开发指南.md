# TradeInsight 项目开发指南

## 📋 目录
- [项目概述](#项目概述)
- [项目架构](#项目架构)
- [目录结构详解](#目录结构详解)
- [开发流程](#开发流程)
- [新增页面指南](#新增页面指南)
- [开发规范](#开发规范)
- [常见问题](#常见问题)

## 🎯 项目概述

TradeInsight 是一个基于 Vue 3 的股票复盘分析平台，采用现代化的前端技术栈，提供股票数据展示、自选股管理、复盘笔记、分析模板等功能。

### 技术栈
- **框架**: Vue 3 + Composition API
- **UI库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **构建工具**: Vite
- **样式**: SCSS
- **HTTP客户端**: Axios
- **图表**: ECharts

## 🏗️ 项目架构

```
TradeInsight (龟派 · A股复盘洞察桌面应用)
├── 仪表盘模块 (Dashboard)
├── 复盘模块 (Review)
├── 股票数据模块 (Stock Data)
├── 自选股管理模块 (Watchlist)
├── 复盘笔记模块 (Notes)
├── 分析模板模块 (Templates)
├── K线实战模块 (Kline Practice)
└── 数据管理模块 (Admin / Settings)
```

> 说明：桌面版已移除登录/认证模块，本地用户自动创建。

### 架构设计原则
- **模块化**: 按业务功能划分模块
- **组件化**: 可复用的UI组件
- **桌面优先**: 内嵌于 Electron，前端经内嵌后端（Express）访问本地数据与 AKTools 行情
- **数据本地化**: 复盘数据可持久化到 localStorage，打开页面读缓存、刷新拉取最新
- **性能优化**: 路由懒加载、组件按需加载

## 📁 目录结构详解

### 根目录文件
```
├── .env                    # 环境变量配置
├── .env.production         # 生产环境配置
├── package.json            # 项目依赖和脚本
├── vite.config.js          # Vite构建配置
├── index.html              # HTML入口文件
└── README.md               # 项目说明文档
```

### src/ 源码目录

#### 📂 src/assets/ - 静态资源
```
assets/
├── styles/                 # 样式文件
│   ├── variables.scss      # SCSS变量定义
│   ├── mixins.scss         # SCSS混入工具
│   └── global.scss         # 全局样式
├── images/                 # 图片资源 (待创建)
└── fonts/                  # 字体文件 (待创建)
```

**用途**: 存放项目的静态资源文件
- `variables.scss`: 定义颜色、尺寸等设计变量
- `mixins.scss`: 可复用的样式混入
- `global.scss`: 全局样式和重置样式

#### 📂 src/components/ - 公共组件
```
components/
├── common/                 # 通用业务组件
│   └── StockCard.vue       # 股票卡片组件
├── layout/                 # 布局组件
│   ├── AppHeader.vue       # 顶部导航栏
│   ├── AppSidebar.vue      # 侧边栏菜单
│   └── AppFooter.vue       # 底部信息栏
└── icons/                  # 图标组件
    └── ...                 # 各种图标组件
```

**用途**: 存放可复用的UI组件
- `common/`: 业务相关的通用组件
- `layout/`: 页面布局相关组件
- `icons/`: 图标组件库

#### 📂 src/composables/ - 组合式函数
```
composables/
├── useReview.js            # 复盘页逻辑（含缓存读写）
├── useStockData.js         # 股票数据逻辑
├── useWatchlist.js         # 自选股逻辑
├── useNotes.js             # 笔记逻辑
└── useTemplates.js         # 模板逻辑
```

**用途**: 封装可复用的业务逻辑
- 每个文件对应一个业务模块
- 提供响应式数据和方法
- 统一错误处理和状态管理

#### 📂 src/router/ - 路由配置
```
router/
└── index.js                # 路由配置文件
```

**用途**: 定义应用的路由规则
- 页面路由映射
- 路由守卫配置
- 权限控制逻辑

#### 📂 src/services/ - API服务层
```
services/
├── aktools.service.js      # AKTools行情API（指数、涨跌停池、K线等）
├── stock.service.js        # 股票API
├── watchlist.service.js    # 自选股API
├── note.service.js         # 笔记API
├── template.service.js     # 模板API
└── limitBoardStatistics.service.js  # 涨跌停统计API
```

**用途**: 封装后端API调用
- 每个文件对应一个业务模块的API
- 统一的请求格式和错误处理
- 数据转换和验证

#### 📂 src/store/ - 状态管理
```
store/
├── stock.store.js          # 股票数据状态
├── watchlist.store.js      # 自选股状态
├── note.store.js           # 笔记状态
└── template.store.js       # 模板状态
```

**用途**: 使用Pinia管理全局状态
- 每个文件对应一个业务模块的状态
- 响应式数据和计算属性
- 异步操作和状态更新

#### 📂 src/utils/ - 工具函数
```
utils/
├── api.js                  # HTTP客户端配置
├── cacheStorage.js         # 本地缓存工具（localStorage）
├── date.js                 # 日期处理工具
├── stock.js                # 股票数据工具
└── StockDateUtil.js        # 交易日工具
```

**用途**: 通用工具函数库
- `api.js`: Axios配置和拦截器
- `cacheStorage.js`: 本地缓存工具（localStorage）
- `date.js`: 日期格式化和处理
- `stock.js`: 股票数据格式化
- `StockDateUtil.js`: 交易日计算工具

#### 📂 src/views/ - 页面组件
```
views/
├── dashboard/              # 仪表盘
│   └── Dashboard.vue       # 主仪表盘
├── review/                 # 复盘页
│   └── Review.vue          # 复盘分析
├── stock/                  # 股票页面
│   ├── StockList.vue       # 股票列表
│   ├── StockDetail.vue     # 股票详情
│   └── StockAnalysis.vue   # 股票分析
├── watchlist/              # 自选股页面
│   └── Watchlist.vue       # 自选股管理
├── note/                   # 笔记页面
│   ├── NoteList.vue        # 笔记列表
│   └── NoteDetail.vue      # 笔记详情/编辑
├── template/               # 模板页面
│   ├── TemplateList.vue    # 模板列表
│   └── TemplateEdit.vue    # 模板编辑
├── user/                   # 用户中心
│   └── Profile.vue         # 个人资料
├── settings/               # 设置
│   └── Settings.vue        # 应用设置
├── admin/                  # 数据管理
│   ├── DataManagement.vue  # 复盘数据任务表
│   └── ErrorLog.vue        # 报错日志
├── kline-practice/         # K线实战
│   └── RandomStockPractice.vue
├── error/                  # 错误页面
│   └── NotFound.vue        # 404页面
└── test/                   # 测试页面
    ├── ApiTest.vue         # API测试工具
    ├── KTest.vue           # K线模版
    └── DataManagementTest.vue
```

**用途**: 应用的页面组件
- 按业务模块组织目录
- 每个页面对应一个Vue组件
- 页面级别的状态和逻辑

#### 📂 核心文件
```
src/
├── App.vue                 # 根组件
└── main.js                 # 应用入口文件
```

**用途**: 应用的核心文件
- `App.vue`: 应用的根组件，定义整体布局
- `main.js`: 应用入口，配置Vue实例和插件

## 🔄 开发流程

### 1. 项目启动流程
```
main.js (入口) 
    ↓
创建Vue应用实例
    ↓
注册Pinia状态管理
    ↓
注册Vue Router路由
    ↓
注册Element Plus UI库
    ↓
挂载到DOM (#app)
    ↓
App.vue (根组件)
    ↓
渲染对应页面组件
```

### 2. 页面渲染流程
```
用户访问URL
    ↓
Vue Router匹配路由
    ↓
懒加载页面组件
    ↓
组件初始化 (setup)
    ↓
调用composables获取数据
    ↓
composables调用store
    ↓
store调用service
    ↓
service发送API请求
    ↓
更新响应式数据
    ↓
组件重新渲染
```

### 3. 数据流向
```
用户操作 → 组件事件 → Composables → Store → Service → API
                                                    ↓
UI更新 ← 响应式数据 ← Composables ← Store ← Service ← API响应
```

## 🆕 新增页面指南

### 步骤1: 创建页面组件
```bash
# 在对应的业务模块目录下创建Vue文件
src/views/[模块名]/[页面名].vue
```

### 步骤2: 页面组件模板
```vue
<script setup>
import { ref, onMounted } from 'vue'
import { use[模块名] } from '@/composables/use[模块名]'

// 使用对应的composable
const { 
  loading, 
  data, 
  fetchData,
  // ... 其他方法
} = use[模块名]()

// 页面状态
const pageLoading = ref(false)

// 生命周期
onMounted(() => {
  fetchData()
})

// 页面方法
const handleAction = () => {
  // 处理用户操作
}
</script>

<template>
  <div class="[页面名称]">
    <div class="page-header">
      <h1 class="page-title">页面标题</h1>
      <p class="page-description">页面描述</p>
    </div>
    
    <!-- 页面内容 -->
    <el-card v-loading="loading">
      <!-- 具体内容 -->
    </el-card>
  </div>
</template>

<style scoped>
.[页面名称] {
  padding: 20px;
}

@media (max-width: 768px) {
  .[页面名称] {
    padding: 10px;
  }
}
</style>
```

### 步骤3: 添加路由配置
```javascript
// src/router/index.js
const [页面名] = () => import('@/views/[模块名]/[页面名].vue')

// 在routes数组中添加路由
{
  path: '/[路径]',
  name: '[页面名]',
  component: [页面名],
  meta: {
    title: '页面标题',
    icon: 'IconName',
    hideInMenu: false   // 是否在菜单中隐藏
  }
}
```

### 步骤4: 添加菜单项 (可选)
```javascript
// src/components/layout/AppSidebar.vue
// 在menuItems数组中添加菜单项
{
  index: '/[路径]',
  title: '菜单标题',
  icon: 'IconName'
}
```

### 步骤5: 创建对应的API服务 (如需要)
```javascript
// src/services/[模块名].service.js
import api from '@/utils/api'

export const get[数据名] = (params) => {
  return api.get('/api/[接口路径]', { params })
}

export const create[数据名] = (data) => {
  return api.post('/api/[接口路径]', data)
}
```

### 步骤6: 创建状态管理 (如需要)
```javascript
// src/store/[模块名].store.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as [模块名]Service from '@/services/[模块名].service'

export const use[模块名]Store = defineStore('[模块名]', () => {
  // 状态
  const data = ref([])
  const loading = ref(false)
  
  // 计算属性
  const count = computed(() => data.value.length)
  
  // 方法
  const fetchData = async () => {
    try {
      loading.value = true
      const response = await [模块名]Service.get[数据名]()
      data.value = response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }
  
  return {
    data,
    loading,
    count,
    fetchData
  }
})
```

### 步骤7: 创建组合式函数 (如需要)
```javascript
// src/composables/use[模块名].js
import { ref, computed } from 'vue'
import { use[模块名]Store } from '@/store/[模块名].store'
import { ElMessage } from 'element-plus'

export function use[模块名]() {
  const [模块名]Store = use[模块名]Store()
  
  const loading = ref(false)
  const error = ref(null)
  
  const fetchData = async () => {
    try {
      loading.value = true
      await [模块名]Store.fetchData()
    } catch (err) {
      error.value = err.message
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }
  
  return {
    loading,
    error,
    data: computed(() => [模块名]Store.data),
    fetchData
  }
}
```

## 📝 开发规范

### 1. 命名规范
- **文件名**: 使用PascalCase (如: `UserProfile.vue`)
- **组件名**: 使用PascalCase (如: `<UserProfile>`)
- **变量名**: 使用camelCase (如: `userName`)
- **常量名**: 使用UPPER_SNAKE_CASE (如: `API_BASE_URL`)
- **CSS类名**: 使用kebab-case (如: `.user-profile`)

### 2. 目录规范
- 按业务模块组织目录结构
- 相关文件放在同一目录下
- 使用有意义的目录名称

### 3. 代码规范
- 使用Vue 3 Composition API
- 优先使用`<script setup>`语法
- 使用TypeScript类型注解 (可选)
- 添加适当的注释说明

### 4. 样式规范
- 使用scoped样式避免污染
- 使用SCSS变量保持一致性
- 实现响应式设计
- 遵循移动端优先原则

### 5. API规范
- 统一使用service层调用API
- 统一错误处理机制
- 使用适当的HTTP状态码
- 实现请求和响应拦截

## 🔧 常见开发任务

### 1. 添加新的业务模块
1. 创建对应的目录结构
2. 实现API服务层
3. 创建状态管理
4. 实现组合式函数
5. 创建页面组件
6. 配置路由和菜单

### 2. 修改现有页面
1. 找到对应的页面组件文件
2. 修改组件逻辑或模板
3. 如需要，更新对应的store或composable
4. 测试功能是否正常

### 3. 添加新的API接口
1. 在对应的service文件中添加方法
2. 在store中添加对应的状态和方法
3. 在composable中封装业务逻辑
4. 在组件中使用新的功能

### 4. 修改样式主题
1. 修改`src/assets/styles/variables.scss`
2. 更新相关的样式文件
3. 确保响应式设计正常

## 🐛 常见问题

### 1. 路由跳转问题
```javascript
// 正确的路由跳转方式
import { useRouter } from 'vue-router'

const router = useRouter()
router.push('/target-path')
router.push({ name: 'RouteName' })
router.push({ path: '/target-path', query: { id: 1 } })
```

### 2. 状态管理问题
```javascript
// 正确使用Pinia store
import { useStockStore } from '@/store/stock.store'

const stockStore = useStockStore()
// 访问状态
console.log(stockStore.marketData)
// 调用方法
stockStore.fetchMarketData()
```

### 3. API调用问题
```javascript
// 正确的API调用方式
import * as stockService from '@/services/stock.service'

try {
  const response = await stockService.getStockSpot()
  // 处理成功响应
} catch (error) {
  // 处理错误
  console.error(error)
}
```

### 4. 组件通信问题
```javascript
// 父子组件通信
// 父组件
<ChildComponent :prop="value" @event="handleEvent" />

// 子组件
const props = defineProps(['prop'])
const emit = defineEmits(['event'])
emit('event', data)
```

## 🚀 部署和构建

### 开发环境
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 📚 学习资源

- [Vue 3 官方文档](https://vuejs.org/)
- [Element Plus 文档](https://element-plus.org/)
- [Pinia 文档](https://pinia.vuejs.org/)
- [Vue Router 文档](https://router.vuejs.org/)
- [Vite 文档](https://vitejs.dev/)

---

这个开发指南涵盖了TradeInsight项目的完整开发流程。如果你有任何问题或需要添加新功能，请参考相应的章节或联系开发团队。