<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const collapsed = ref(false)

// 菜单项
const menuItems = [
  {
    index: '/dashboard',
    title: '仪表盘',
    icon: 'Odometer'
  },
  {
    index: '/Review',
    title: '复盘',
    icon: 'Search'
  },
  {
    index: '/watchlist',
    title: '自选股',
    icon: 'Star'
  },
  {
    index: '/stocks',
    title: '股票',
    icon: 'TrendCharts',
    children: [
      {
        index: '/stocks',
        title: '股票列表'
      },
      {
        index: '/stocks/boards',
        title: '行业板块'
      }
    ]
  },
  {
    index: '/notes',
    title: '笔记',
    icon: 'Document',
    children: [
      {
        index: '/notes',
        title: '笔记列表'
      },
      {
        index: '/notes/create',
        title: '创建笔记'
      }
    ]
  },
  {
    index: '/kline-practice',
    title: 'K线实战',
    icon: 'TrendCharts',
    children: [
      {
        index: '/kline-practice/random-stock',
        title: 'A股随机K线实战'
      }
    ]
  },
  {
    index: '/templates',
    title: '模板',
    icon: 'Files',
    children: [
      {
        index: '/templates',
        title: '模板列表'
      },
      {
        index: '/templates/create',
        title: '创建模板'
      }
    ]
  },
  
  {
    index: '/admin',
    title: '数据管理',
    icon: 'Setting',
    children: [
      {
        index: '/admin/data-overview',
        title: '数据总览'
      },
      {
        index: '/admin/close-data-sync',
        title: '收盘数据同步'
      },
      {
        index: '/admin/stock-data-pull',
        title: '股票数据拉取'
      }
    ]
  },
  {
    index: '/settings',
    title: '设置',
    icon: 'Tools'
  },
]

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

// 切换折叠状态
const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

// 菜单点击
const handleMenuClick = (index) => {
  router.push(index)
}
</script>

<template>
  <aside class="app-sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <el-button
        circle
        size="small"
        @click="toggleCollapse"
        class="collapse-btn"
      >
        <el-icon>
          <Fold v-if="!collapsed" />
          <Expand v-else />
        </el-icon>
      </el-button>
    </div>
    
    <el-menu
      :default-active="activeMenu"
      :collapse="collapsed"
      :unique-opened="true"
      class="sidebar-menu"
      @select="handleMenuClick"
    >
      <template v-for="item in menuItems" :key="item.index">
        <!-- 有子菜单 -->
        <el-sub-menu v-if="item.children" :index="item.index">
          <template #title>
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.title }}</span>
          </template>
          <el-menu-item
            v-for="child in item.children"
            :key="child.index"
            :index="child.index"
          >
            {{ child.title }}
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 无子菜单 -->
        <el-menu-item v-else :index="item.index">
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </template>
    </el-menu>
  </aside>
</template>

<style scoped>
.app-sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid var(--el-border-color-light);
  transition: width 0.3s;
  display: flex;
  flex-direction: column;
}

.app-sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.collapse-btn {
  border: none;
  background: transparent;
}

.sidebar-menu {
  flex: 1;
  border: none;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 240px;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
}

:deep(.el-menu-item.is-active) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

:deep(.el-menu-item.is-active)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: var(--el-color-primary);
}
</style>