<script setup>
/**
 * StockNoteSummary —— 盈亏汇总统计卡片。
 *
 * 数据来自 /notes/summary（按股票分组的服务端聚合）。
 * 展示：每只股票的投入额/回收额/净额/笔数，以及总计。
 * 浮动盈亏不在此卡（需逐笔取现价），在列表卡片按笔记实时展示。
 */
import { computed } from 'vue'

const props = defineProps({
  summary: { type: Object, default: null }
})

const stocks = computed(() => props.summary?.stocks || [])
const grand = computed(() => props.summary?.grand || { totalInvested: 0, totalProceeds: 0, totalNotes: 0 })
const net = computed(() => (grand.value.totalProceeds || 0) - (grand.value.totalInvested || 0))

const fmt = (n) => (n == null ? '-' : Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 2 }))
</script>

<template>
  <el-card shadow="never" class="sns" v-if="stocks.length || summary">
    <template #header><span>盈亏汇总</span></template>
    <div class="sns-stat">
      <div class="stat-item"><span>投入</span><b class="out">¥{{ fmt(grand.totalInvested) }}</b></div>
      <div class="stat-item"><span>回收</span><b class="in">¥{{ fmt(grand.totalProceeds) }}</b></div>
      <div class="stat-item"><span>净额</span><b :class="net >= 0 ? 'in' : 'out'">¥{{ fmt(net) }}</b></div>
      <div class="stat-item"><span>笔数</span><b>{{ grand.totalNotes }}</b></div>
    </div>
    <el-table v-if="stocks.length" :data="stocks" size="small" border>
      <el-table-column label="股票" min-width="140">
        <template #default="{ row }">{{ row.code }} {{ row.name || '' }}</template>
      </el-table-column>
      <el-table-column label="投入" width="120" align="right">
        <template #default="{ row }">¥{{ fmt(row.totalInvested) }}</template>
      </el-table-column>
      <el-table-column label="回收" width="120" align="right">
        <template #default="{ row }">¥{{ fmt(row.totalProceeds) }}</template>
      </el-table-column>
      <el-table-column label="净额" width="120" align="right">
        <template #default="{ row }">
          <span :class="(row.totalProceeds - row.totalInvested) >= 0 ? 'in' : 'out'">¥{{ fmt(row.totalProceeds - row.totalInvested) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="笔数" width="80" align="center" prop="totalNotes" />
    </el-table>
  </el-card>
</template>

<style scoped>
.sns { margin-bottom: 16px; }
.sns-stat { display: flex; gap: 24px; margin-bottom: 12px; flex-wrap: wrap; }
.stat-item { display: flex; flex-direction: column; gap: 2px; }
.stat-item span { font-size: 12px; color: var(--el-text-color-secondary); }
.stat-item b { font-size: 18px; }
.in { color: var(--el-color-danger); }
.out { color: var(--el-color-success); }
</style>
