// ESLint 扁平配置（ESLint 9+）
//
// 定位：这不是一套"代码风格"规则，而是**最低限度的正确性护栏**。
// 项目 33.5k 行、135 个端点、零自动化检查，历史上出过一类事故：
//   v1.7.0 一次编辑把函数体删空、只留 module.exports，运行期 ReferenceError
//   导致整个 Express 起不来，而 `node --check` 查不出（语法合法、引用非法）。
// 所以这里只开两条规则，专门拦这类"能过语法检查、一跑就崩"的错误：
//   no-undef       —— 引用未定义的变量（v1.7.0 事故的直接拦截器）
//   no-unused-vars —— 声明后从未使用（通常是删代码留下的孤儿，提示遗漏清理）
//
// 刻意不开：no-console（项目有大量有意的运行日志）、no-empty（catch 空块是常见兜底）、
// 各类风格规则（无 Prettier，不做格式化强制）。
//
// 存量豁免策略：一次性清完 15.8k 行后端的全部告警不现实，且会把本次改动范围
// 无限扩大。因此先跑一遍拿真实基线，只对"历史存量"开豁免，新增文件不豁免。

const globals = require('globals')
const vuePlugin = require('eslint-plugin-vue')
const vueParser = require('vue-eslint-parser')

module.exports = [
  {
    // 后端：Electron 主进程 + 内嵌 Express，CommonJS
    files: ['electron/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.browser // 主进程里也用到少量 Web 全局（URL、TextDecoder 等）
      }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', {
        // 下划线前缀是项目通用的"有意忽略"约定（如 catch (_) 兜底）
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }]
    }
  },
  {
    // 前端：Vue SFC + ESM
    // .vue 需专用 parser：ESLint 默认解析器看不懂 <template>，会报 "Unexpected token <"。
    // vue-eslint-parser 负责切分 SFC 块，<script> 部分再交给 espree（默认）解析。
    files: ['frontend/src/**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parser: vueParser,
      globals: {
        ...globals.browser,
        // 构建期注入（vite.config.js 的 define），非运行时全局
        __APP_VERSION__: 'readonly'
      }
    },
    plugins: {
      vue: vuePlugin
    },
    // 只取 vue 插件的「推荐规则集」中与正确性相关的基础能力；
    // 不启用 vue/strongly-recommended 或 formatting，避免几十条风格告警淹没真问题。
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }]
    }
  },
  {
    // 生成物与第三方代码不检查
    ignores: [
      'node_modules/**',
      'frontend/dist/**',
      'frontend/dist_*/**',
      'release/**',
      'build/**',
      'dolphindb-server/**',
      'python/**',
      '.aoci/**',
      '.box-agent*/**',
      'frontend/src/components/TheWelcome.vue' // Vue 脚手架残留，未被引用
    ]
  }
]
