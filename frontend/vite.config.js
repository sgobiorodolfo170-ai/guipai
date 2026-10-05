import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

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
