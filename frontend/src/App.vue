<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const route = useRoute()

const showLayout = computed(() => !route.meta.hideLayout)
</script>

<template>
  <div id="app">
    <div v-if="showLayout" class="app-layout">
      <AppHeader />
      <div class="app-body">
        <AppSidebar />
        <main class="app-main">
          <router-view />
        </main>
      </div>
      <AppFooter />
    </div>

    <div v-else class="no-layout">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  background-color: var(--el-bg-color-page);
}

.no-layout {
  height: 100vh;
}
</style>
