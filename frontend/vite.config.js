import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'

// 版本号单一来源：读 frontend/package.json（与根 package.json 同步维护，见 AGENTS.md 版本规则）。
// 页脚等处通过 __APP_VERSION__ 引用，避免"CHANGELOG 一个版本、package.json 一个版本、页面又一个版本"。
const pkgVersion = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
).version

// 开发端口的默认兜底值；真实值取自 frontend/.env 的 VITE_DEV_PORT（唯一来源，
// electron/dev-port.js 与 electron/dev-runner.js 也读同一个键，避免三处端口不一致）。
const DEFAULT_DEV_PORT = 5174

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // 前缀留空：VITE_DEV_PORT 虽以 VITE_ 开头，但需要在前端构建期之外的 dev-server 端口解析中使用
  const env = loadEnv(mode, process.cwd(), '')
  const devPort = Number(env.VITE_DEV_PORT) || DEFAULT_DEV_PORT
  return {
    base: command === 'build' ? './' : '/',
    // 不用 5173 的原因——本机常被其它项目占用该端口，会让本项目前端被"抢端口"或误连到别人的 dev server。
    // dev-runner 启动时会显式传入 --port（自动扫描到的空闲端口），此配置只作用于手动 npm run dev。
    server: {
      port: devPort,
      strictPort: false,
    },
    plugins: [
      vue(),
    ],
    define: {
      // 构建期把版本号内联成字面量：运行时不读文件、不受打包路径影响
      __APP_VERSION__: JSON.stringify(pkgVersion)
    },
    build: {
      // 拆包策略：此前两个 1.1MB chunk（gzip 372KB + 364KB）远超 Vite 500KB 告警线。
      // 原因是 element-plus、echarts、vue 全家桶全被塞进入口 chunk——它们很少变动，
      // 却和业务代码一起被打进同一个文件，既拖慢首屏，也让每次改代码都让整个 chunk 失效。
      //
      // 按「变动频率」而非「体积」分组：
      //   vue     —— vue/router/pinia，几乎不变
      //   element —— Element Plus 全量组件（本项目按需引入改造成本高，先独立成包）
      //   echarts —— 图表库，只在少数页面用到
      //   vendor  —— 其余 node_modules（axios/dayjs/nprogress 等小依赖）
      // 业务代码留在入口 chunk，改业务只让入口失效，上面几包命中浏览器缓存。
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('klinecharts')) return 'klinecharts'
            if (id.includes('echarts') || id.includes('zrender')) return 'echarts'
            if (id.includes('element-plus') || id.includes('@element-plus')) return 'element'
            if (id.includes('/vue/') || id.includes('vue-router') || id.includes('pinia')) return 'vue'
            return 'vendor'
          }
        }
      },
      // 单包上限：element/echarts 拆出来后仍会超过 500KB（这是库本身大小），
      // 但已独立成可长期缓存的包，故把告警线抬到 600KB 避免噪音。
      chunkSizeWarningLimit: 600
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },

    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
          @use "@/assets/styles/variables.scss" as *;
        `
        }
      }
    },
  }
})
