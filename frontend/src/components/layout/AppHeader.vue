<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchKeyword = ref('')

const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  router.push({
    name: 'StockList',
    query: { search: searchKeyword.value }
  })
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <div class="logo" @click="router.push('/')">
        <el-icon size="24" color="#409eff">
          <TrendCharts />
        </el-icon>
        <span class="logo-text">龟派</span>
      </div>
    </div>

    <div class="header-center">
      <el-input v-model="searchKeyword" placeholder="搜索股票代码或名称" class="search-input" @keyup.enter="handleSearch">
        <template #prefix>
          <el-icon>
            <Search />
          </el-icon>
        </template>
        <template #append>
          <el-button @click="handleSearch">
            搜索
          </el-button>
        </template>
      </el-input>
    </div>

    <div class="header-right">
      <el-badge :value="0" :hidden="true" class="header-item">
        <el-button circle>
          <el-icon>
            <Bell />
          </el-icon>
        </el-button>
      </el-badge>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.header-left {
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.logo-text {
  margin-left: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 40px;
}

.search-input {
  max-width: 400px;
  width: 100%;
}

.header-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-item {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .header-center {
    padding: 0 20px;
  }

  .search-input {
    max-width: 300px;
  }
}
</style>
