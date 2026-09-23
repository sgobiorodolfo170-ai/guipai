<script setup>
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-left">
        <span class="copyright">
          © {{ currentYear }} 龟派. A股交易洞察桌面应用
        </span>
      </div>
      
      <div class="footer-right">
        <span class="version">v1.0.0</span>
        <el-divider direction="vertical" />
        <el-link href="#" type="primary" :underline="false">
          使用教程
        </el-link>
        <el-divider direction="vertical" />
        <el-link href="#" type="primary" :underline="false">
          帮助文档
        </el-link>
        <el-divider direction="vertical" />
        <el-link href="#" type="primary" :underline="false">
          意见反馈
        </el-link>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  height: 50px;
  background: #fff;
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  padding: 0 20px;
  flex-shrink: 0;
}

.footer-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left {
  display: flex;
  align-items: center;
}

.copyright {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    gap: 8px;
  }
  
  .app-footer {
    height: auto;
    padding: 12px 20px;
  }
}
</style>