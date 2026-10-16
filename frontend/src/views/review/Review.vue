<template>
  <div class="stock-review">
    <!-- 数据概览区 -->
    <div class="stock-dashboard">
      <!-- 数据概览区 - 全新设计 -->
      <div class="dashboard-card">
        <!-- 标题栏 -->
        <div class="dashboard-header">
          <h2 class="header-title">
            {{
              'A股复盘 -- ' + (recentTradingDay + '').slice(0, 4) + '年' + parseInt((recentTradingDay + '').slice(4, 6)) + '月' + parseInt((recentTradingDay + '').slice(6, 8)) + '日'
            }}
          </h2>
          <div class="header-actions">
<!--            <button class="test-btn" @click="testHistoryModal" style="margin-right: 10px; padding: 5px 10px; background: #52c41a; color: white; border: none; border-radius: 4px; cursor: pointer;">-->
<!--              测试图表-->
<!--            </button>-->
            <button class="refresh-btn" @click="refreshData">
              <svg t="1755854574418" class="icon" viewBox="0 0 1024 1024" version="1.1"
                   xmlns="http://www.w3.org/2000/svg" p-id="1800" width="200" height="200">
                <path
                    d="M958.681412 457.499032c-6.170072-50.632177-20.854483-99.563886-43.643361-145.434552-45.779694-92.144205-122.249797-166.333021-215.325711-208.898719-20.083724-9.18513-43.810309-0.349891-52.995439 19.734833-9.18413 20.082724-0.349891 43.810309 19.733833 52.996438 159.26323 72.834239 245.755201 249.640987 205.658732 420.410622-30.735395 130.876101-129.201624 233.321087-256.187941 270.333521l-0.262918-70.800875-196.843487 114.650172 197.690222 113.176632-0.275914-74.43274c75.398438-17.911403 144.809747-54.929834 202.084849-108.039237 65.597501-60.827991 111.122274-139.186504 131.651859-226.606186 12.170197-51.828803 15.10328-104.683286 8.715276-157.089909zM408.299406-0.001l0.271915 74.43374c-75.404436 17.911403-144.820744 54.931834-202.099843 108.046235-65.6005 60.83099-111.124274 139.191503-131.651859 226.616183-7.987504 34.034364-11.994252 68.507591-11.994252 103.010809 0 17.994377 1.090659 35.996751 3.271978 53.946142 6.152077 50.59119 20.803499 99.48891 43.545392 145.333583 45.678725 92.080225 122.012871 166.270041 214.936832 208.900718 20.071728 9.209122 43.810309 0.401874 53.018432-19.670852 9.210122-20.076726 0.400875-43.810309-19.671853-53.019432-158.963324-72.92821-245.278351-249.658982-205.24886-420.22368 30.732396-130.883099 129.201624-233.333083 256.195939-270.345517l0.259919 70.801874 196.850484-114.640174L408.299406-0.001z"
                    fill="#1296db" p-id="1801"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- 核心指标区 -->
        <div class="core-indicators">
          <div class="core-item">
            <div class="core-label">上证指数</div>
            <div class="core-value-group">
              <span class="core-value">{{ indexValue }}</span>
              <span class="core-change" :class="{ up: indexChange > 0, down: indexChange < 0 }">
              {{ indexChange > 0 ? '+' : '' }}{{ indexChange }}%
            </span>
            </div>
          </div>
          <div class="core-item">
            <div class="core-label">深证指数</div>
            <div class="core-value-group">
              <span class="core-value">{{ shenzhenIndexValue }}</span>
              <span class="core-change" :class="{ up: shenzhenIndexChange > 0, down: shenzhenIndexChange < 0 }">
              {{ shenzhenIndexChange > 0 ? '+' : '' }}{{ shenzhenIndexChange }}%
            </span>
            </div>
          </div>
          <div class="core-item">
            <div class="core-label">创业板指数</div>
            <div class="core-value-group">
              <span class="core-value">{{ chinextIndexValue }}</span>
              <span class="core-change" :class="{ up: chinextIndexChange > 0, down: chinextIndexChange < 0 }">
              {{ chinextIndexChange > 0 ? '+' : '' }}{{ chinextIndexChange }}%
            </span>
            </div>
          </div>
          <div class="core-item">
            <div class="core-label">最高板</div>
            <div class="core-value">{{ maxLimitUpLevel }}板</div>
          </div>
        </div>

        <!-- 详细指标网格 -->
        <div class="indicators-grid">
          <div class="indicator-card clickable" @click="showHistoryModal('limitUp')">
            <img src="/images/up.png" alt="" class="indicator-icon">
            <div class="indicator-info">
              <div class="indicator-name">涨停股</div>
              <div class="indicator-value up">{{ limitUpCount }} 只</div>
            </div>
            <div class="click-hint">点击查看历史</div>
          </div>

          <div class="indicator-card clickable" @click="showHistoryModal('limitDown')">
            <img src="/images/down.png" alt="" class="indicator-icon">
            <div class="indicator-info">
              <div class="indicator-name">跌停股</div>
              <div class="indicator-value down">{{ limitDownCount }} 只</div>
            </div>
            <div class="click-hint">点击查看历史</div>
          </div>

          <div class="indicator-card clickable" @click="showHistoryModal('oneWord')">
            <img src="/images/oneWord.png" alt="" class="indicator-icon">
            <div class="indicator-info">
              <div class="indicator-name">一字板数量</div>
              <div class="indicator-value">{{ oneWordLimitUpCount }}</div>
            </div>
            <div class="click-hint">点击查看历史</div>
          </div>

          <div class="indicator-card clickable" @click="showHistoryModal('continuousRate')">
            <img src="/images/continuousLimitUpRate.png" alt="" class="indicator-icon">
            <div class="indicator-info">
              <div class="indicator-name">连板率</div>
              <div class="indicator-value">{{ continuousLimitUpRate }}%</div>
            </div>
            <div class="click-hint">点击查看历史</div>
          </div>

          <div class="indicator-card clickable" @click="showHistoryModal('breakAndRecover')">
            <img src="/images/kLine.png" alt="" class="indicator-icon">
            <div class="indicator-info">
              <div class="indicator-name">炸板回封数</div>
              <div class="indicator-value">{{ breakAndRecoverCount }}</div>
            </div>
            <div class="click-hint">点击查看历史</div>
          </div>

          <div class="indicator-card clickable" @click="showHistoryModal('maxLevel')">
            <img src="/images/maxLimitUpLevel.png" alt="" class="indicator-icon">
            <div class="indicator-info">
              <div class="indicator-name">最高连板</div>
              <div class="indicator-value">{{ maxLimitUpLevel }}</div>
            </div>
            <div class="click-hint">点击查看历史</div>
          </div>

<!--          昨日涨停平均涨幅-->
          <div class="indicator-card clickable" @click="showHistoryModal('yesterdayAvgChange')">
            <div class="indicator-icon">
              <img src="/images/highFlagStock.png" alt="" class="indicator-icon">
            </div>
            <div class="indicator-info">
              <div class="indicator-name">昨日涨停涨幅</div>
              <div class="indicator-value">{{ yesterdayLimitUpAvgChange }}%</div>
            </div>
            <div class="click-hint">点击查看历史</div>
          </div>

<!--          <div class="indicator-card ">-->
<!--            <div class="indicator-icon">-->
<!--              <img src="/images/highFlagStock.png" alt="" class="indicator-icon">-->
<!--            </div>-->
<!--            <div class="indicator-info">-->
<!--              <div class="indicator-name">高标股</div>-->
<!--              <div class="indicator-value">{{ highFlagStock }}</div>-->
<!--            </div>-->
<!--          </div>-->
          <!--          <div class="indicator-card">-->
          <!--            <div class="indicator-icon">-->
          <!--              <i class="fa fa-history"></i>-->
          <!--            </div>-->
          <!--            <div class="indicator-info">-->
          <!--              <div class="indicator-name">昨日涨停</div>-->
          <!--              <div class="indicator-value">{{ yesterdayLimitUp }}</div>-->
          <!--            </div>-->
          <!--          </div>-->
        </div>
      </div>
    </div>
  </div>

  <!-- 内容主体区 -->
  <div class="main-content">
    <div class="left-sidebar" v-loading="loading">
      <div>
        <div class="slider-filters-container mb-8">
          <SliderFilter
              v-model="selectedMarket"
              :options="marketOptions"
              :maxWidth="500"
              @change="handleMarketChange"
          />
          <SliderFilter
              v-model="selectedMarket2"
              :options="marketOptions2"
              :maxWidth="250"
              @change="handleMarketChange"
          />
        </div>
        <div v-for="(category, index) in displayData" :key="index" class="category">


          <div v-if="category.count >0 " class="category-title">
            <span style="font-weight: bold; font-size: 1.5em;">{{ category.name }}</span>
            <span class="count">{{ category.count }}只</span>
          </div>


          <div class="stock-list" v-if="category.count >0 ">
            <div v-for="(stock) in category.stocks" :key="stock.code" class="stock-card"
                 :class="{ 'active': stock.showKline }"
                 >
              <div @click="toggleKline(stock)" style="cursor: pointer">
                <div class="stock-level" style="display: flex; align-items: center; gap: 5px;">{{ stock.level }}
                  <span class="stock-tag"> {{ stock.specialTag }}</span>  <div style="flex: 1;"></div>
                  <img v-if="!stock.showKline" src="/images/big.png" alt="" style="width: 20px;height: 20px; display: inline-block; vertical-align: middle;">
                  <img v-else src="/images/small.png" alt="" style="width: 20px;height: 20px; display: inline-block; vertical-align: middle;">
                </div>

                <div class="stock-name">{{ stock.name }} ({{ stock.code }})



                  <span v-if="yesterdayLimitUpData !== null" class="stock-change"
                        :style="{ color: stock.change >= 0 ? '#ff4d4f' : '#52c41a' }">
                                    {{ stock.change > 0 ? '+' : '' }}{{ stock.change.toFixed(2) }}%
                                  </span>
                  <span v-if="yesterdayLimitUpData == null" class="stock-change"
                        :style="{ color: stock.change >= 0 ? '#ff4d4f' : '#52c41a' }">
                  {{ stock.current.toFixed(2) }}
                </span></div>
              </div>
              <div


                  :ref="'kline_'+stock.code"
                  :id="'kline_'+stock.code">
              </div>

              <KLine
                  v-if="stock.showKline"
                  :key="stock.code"
                  :stock-code="stock.code"
                  class="mini-kline"
                  :show-period-switcher="false"
                  :show-adjust-switcher="false"
                  :show-drawing-tools="false"
                  :show-volume="true"
                  height="250px"
              />
              <div class="stock-info">
                <span class="volume">成交额: {{ formatAmount(stock.amount) }}</span>
                <span class="turnover">换手: <span>{{ stock.turnover }}%</span></span>
              </div>
              <div class="stock-concept">{{ stock.concept }}</div>


            </div>
          </div>
        </div>
      </div>
    </div>


    <!--行业板块-->
    <!--      <div class="right-content">-->
    <!--        <div class="industry-panel">-->
    <!--          <h3 class="panel-title">行业板块涨幅榜</h3>-->
    <!--          <div v-if="industryLoading" class="loading-small">-->
    <!--            <el-loading size="small"/>-->
    <!--          </div>-->
    <!--          <div v-else class="industry-list">-->
    <!--            <div v-for="(industry, index) in industryData" :key="index" class="industry-item">-->
    <!--              <div class="industry-rank">{{ index + 1 }}</div>-->
    <!--              <div class="industry-info">-->
    <!--                <div class="industry-name">-->
    <!--                  {{ industry.name }}-->
    <!--                  <span class="industry-meta">-->
    <!--              (成交: {{ industry.amount .toFixed(2) }}亿 · 净流入: {{-->
    <!--                      industry.netInflow .toFixed(2)-->
    <!--                    }}亿)-->
    <!--            </span>-->
    <!--                </div>-->
    <!--                <div class="industry-leader">-->
    <!--                  领涨: {{ industry.leader }}-->
    <!--                  <span :style="{ color: industry.leaderPercent >= 0 ? '#ff4d4f' : '#52c41a' }">-->
    <!--              ({{ industry.leaderPercent > 0 ? '+' : '' }}{{ industry.leaderPercent.toFixed(2) }}%)-->
    <!--            </span>-->
    <!--                </div>-->
    <!--              </div>-->
    <!--              <div class="industry-change" :style="{ color: industry.change >= 0 ? '#ff4d4f' : '#52c41a' }">-->
    <!--                {{ industry.change > 0 ? '+' : '' }}{{ industry.change.toFixed(2) }}%-->
    <!--              </div>-->
    <!--            </div>-->
    <!--          </div>-->
    <!--        </div>-->
    <!--      </div>-->

  </div>

  <!-- 历史数据弹窗 -->
  <HistoryDataModal
    v-model:visible="historyModalVisible"
    :data-type="currentDataType"
    :current-value="getCurrentValue()"
    :today-date="recentTradingDay"
    @close="handleHistoryModalClose"
  />

</template>

<script setup>
import {computed, onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useReview} from '@/composables/useReview'
import * as echarts from 'echarts'
import SliderFilter from "@/components/common/SliderFilter.vue";
import StockDateUtil from "@/utils/StockDateUtil.js";
import KLine from "@/components/common/KLineChart.vue";
import HistoryDataModal from "@/components/common/HistoryDataModal.vue";

const router = useRouter()

// 使用Review composable
const {
  yesterdayLimit,
  loading,
  stockCategories,
  indexData,
  highFlagStock,
  limitUpData,
  limitDownData,
  formatAmount,
  getTradeDates,
  yesterdayStockCategories,
  loadCachedReview,
  fetchAndCacheReview,
} = useReview()

//刷新按钮相关
const isButtonEnabled = ref(true);
const countdown = ref(0);

// 在组件外部或data外部定义普通对象来存储chart实例
const chartInstances = {}; // 普通对象，不是响应式的

const chooseStockCategories = ref()

//昨日涨停数据
const yesterdayLimitUpData = ref()

//最新交易日
const recentTradingDay = ref('')

// 历史数据弹窗相关
const historyModalVisible = ref(false)
const currentDataType = ref('')

// 数据概览区
const currentDate = ref('')
const yesterdayLimitUp = ref('--')
const maxLimitUpLevel = ref('--')
const continuousLimitUpRate = ref('--')
const oneWordLimitUpCount = ref('--')
const breakAndRecoverCount = ref('--')
const indexValue = ref('--')
const indexChange = ref('')
const shenzhenIndexValue = ref('--')
const shenzhenIndexChange = ref('')
const chinextIndexValue = ref('--')
const chinextIndexChange = ref('')
const yesterdayLimitUpAvgChange = ref('--')


//k线天数
const kTradeDates = ref(30)
const tradeDates = ref(null)

// 计算属性
const limitUpCount = computed(() => limitUpData.value.length)
const limitDownCount = computed(() => limitDownData.value.length)

// 市场选项（4个）
const marketOptions = [
  {label: '全部市场', value: 'all'},
  {label: '主板', value: 'main'},
  {label: '科创板', value: 'star'},
  {label: '创业板', value: 'growth'}
];
const marketOptions2 = [
  {label: '今日数据', value: 'day'},
  {label: '昨日表现', value: 'yesterday'},
];
// 选中的值
const selectedMarket = ref('all');
// 查看今天或昨日数据选中的值
const selectedMarket2 = ref('day');


// 三大指数卡片赋值：从 indexData 中提取上证/深证成指/创业板指
// 独立成函数并由 applyLoadedData 无条件调用，避免被"涨停池是否为空"的条件拦截（指数数据与涨停池无依赖）
const applyIndexCards = () => {
  indexData.value.forEach(item => {
    if (item.代码 === '000001') {
      indexValue.value = item.最新价
      indexChange.value = item.涨跌幅
    }
    if (item.代码 === '399001') {
      shenzhenIndexValue.value = item.最新价
      shenzhenIndexChange.value = item.涨跌幅
    }
    if (item.代码 === '399006') {
      chinextIndexValue.value = item.最新价
      chinextIndexChange.value = item.涨跌幅
    }
  })
}

// 计算连板转换数据
const calculateBoardTransition = (limitUpData) => {
  // 总涨停数
  const totalLimitUp = limitUpData.length;
  maxLimitUpLevel.value = totalLimitUp > 0
      ? Math.max(...limitUpData.map(item => item.连板数))
      : 0;

  // 2. 连板率（continuousLimitUpRate）
  // 连板股：连板数 ≥ 2 的股票
  const continuousLimitUpCount = limitUpData.filter(item => item.连板数 >= 2).length;
  continuousLimitUpRate.value = totalLimitUp > 0
      ? (continuousLimitUpCount / totalLimitUp * 100).toFixed(2)
      : '0.00';

  // 3. 一字板数量（oneWordLimitUpCount）
  // 一字板判定：首次封板时间为 09:25:00（开盘即涨停）且未炸板
  oneWordLimitUpCount.value = limitUpData.filter(item =>
      item.首次封板时间  <= '092504'  && item.炸板次数 === 0
  ).length;

  // 4. 炸板回封数（breakAndRecoverCount）
  // 炸板回封：炸板次数 ≥ 1 且最后封板时间存在（最终封板）
  breakAndRecoverCount.value = limitUpData.filter(item =>
      item.炸板次数 >= 1 && item.最后封板时间
  ).length;

  //5. 昨日涨停数
  yesterdayLimitUp.value = yesterdayLimit.value.length

  // 计算昨日涨停平均涨幅
  if (yesterdayLimit.value.length > 0) {
    const totalChange = yesterdayLimit.value.reduce((sum, stock) => sum + stock.涨跌幅, 0)
    yesterdayLimitUpAvgChange.value = (totalChange / yesterdayLimit.value.length).toFixed(2)
  } else {
    yesterdayLimitUpAvgChange.value = '--'
  }
}

// 设置当前日期
const setCurrentDate = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  currentDate.value = `${month}-${day}`
}

// 处理市场筛选变化
const handleMarketChange = async () => {
// 遍历 displayData 数组中的所有元素（未加载时为空数组，避免 undefined.forEach 崩溃）
  (displayData.value || []).forEach(item => {
    // 遍历每个 item 中的 stocks 数组
    item.stocks.forEach(stock => {
      // 将 showKline 设置为 false
      stock.showKline = false;
    });
  });
  let stockData = null
  if (selectedMarket2.value === 'day') {
    stockData = stockCategories
  } else {
    stockData = yesterdayStockCategories
  }
  if (selectedMarket2.value === 'yesterday') {
    yesterdayLimitUpData.value = yesterdayStockCategories.value
  } else {
    yesterdayLimitUpData.value = null
  }
  // 步骤1：先通过map处理所有分类，生成包含筛选后股票的新对象
  const processedCategories = stockData.value.map(category => {
    // 筛选当前分类下符合条件的股票
    const filteredStocks = category.stocks.filter(stock => {
      if (selectedMarket.value === 'all') {
        return true; // 全部市场
      } else if (selectedMarket.value === 'main') {
        return /^60|^00/.test(stock.code); // 主板
      } else if (selectedMarket.value === 'growth') {
        return /^300/.test(stock.code); // 创业板
      } else if (selectedMarket.value === 'star') {
        return /^688/.test(stock.code); // 科创板
      }
      return false;
    });
    // 返回新的分类对象（必须创建新对象，不能修改原对象）
    return {
      ...category, // 复制原有属性
      stocks: filteredStocks, // 替换为筛选后的股票
      count: filteredStocks.length // 更新股票数量
    };
  });

  // 步骤2：过滤掉没有股票的分类
  if (yesterdayLimitUpData.value !== null) {
    yesterdayLimitUpData.value = processedCategories.filter(
        category => category.stocks.length > 0
    );
  } else {
    chooseStockCategories.value = processedCategories.filter(
        category => category.stocks.length > 0
    );
  }

  // await handleMarketChange(selectedMarket.value);
}

// 计算属性：决定使用哪个数据源
const displayData = computed(() => {
  // 如果 yesterdayLimitUpData 有值（且不是 null），则使用它
  if (yesterdayLimitUpData.value !== null) {
    return yesterdayLimitUpData.value || [];
  }
  // 否则使用 chooseStockCategories
  return chooseStockCategories.value || [];
});

// 切换K线显示
const toggleKline = async (stock) => {
  stock.showKline = !stock.showKline
}
//
// // 初始化图表
// const initChart = (stock, domId) => {
//   const dom = document.getElementById(domId)
//   if (!dom) {
//     return
//   }
//
//
//   chartInstances[stock.code] = echarts.init(dom)
//   chartInstances[stock.code].setOption({
//     // 图表布局配置
//     grid: {
//       top: 10,     // 图表距离容器上边距（像素）
//       right: 10,   // 距离右边距
//       bottom: 20,  // 距离下边距（为X轴标签留空间）
//       left: 40     // 距离左边距（为Y轴标签留空间）
//     },
//     tooltip: {
//       trigger: 'axis',
//       axisPointer: {
//         animation: false,
//         type: 'cross',
//         lineStyle: {
//           color: '#376df4',
//           width: 2,
//           opacity: 1
//         }
//       },
//       // 添加 formatter 配置，自定义中文提示
//       formatter: function (params) {
//         // params[0] 包含K线数据
//         const data = params[0].data;
//         return `
//       <div>${params[0].name}</div>
//       <div>开盘: ${data[1]} ¥</div>
//       <div>收盘: ${data[2]} ¥</div>
//       <div>最低: ${data[3]} ¥</div>
//       <div>最高: ${data[4]} ¥</div>
//     `;
//       }
//     },
//     // X轴配置（时间轴）
//     xAxis: {
//       type: 'category', // 类目轴（适用于离散数据如日期）
//       data: stock.klineData,
//     },
//
//     // Y轴配置（价格轴）
//     yAxis: {
//       type: 'value',  // 数值轴
//       scale: true,    // 自动根据数据范围缩放
//       axisLabel: {
//         formatter: '{value} ¥'  // 显示价格单位
//       }
//     },
//     // 数据系列配置
//     series: [{
//       type: 'candlestick',  // 图表类型：K线图
//       name: 'Day',
//       // K线数据 格式: [开盘价, 收盘价, 最低价, 最高价]
//       // data: stock.klinePrices,
//       // K线样式配置
//       itemStyle: {
//         color: '#ef232a',        // 阳线（上涨）填充色（红）
//         color0: '#14b143',       // 阴线（下跌）填充色（绿）
//         borderColor: '#ef232a',  // 阳线边框色
//         borderColor0: '#14b143'  // 阴线边框色
//       },
//     }]
//   })
// }

// 处理已载入内存的数据（缓存或网络均可）：渲染分类、计算指标、应用市场筛选
const applyLoadedData = async () => {
  chooseStockCategories.value = stockCategories.value
  // 三大指数卡片独立渲染：只要指数数据到位就显示，不依赖涨停池
  applyIndexCards()
  // 计算连板转换数据（最高板、连板率等指标依赖涨停池）
  if (limitUpData.value.length > 0) {
    calculateBoardTransition(limitUpData.value)
  }
  await handleMarketChange()
}

// 刷新（刷新按钮调用）：强制拉取最新数据并写入本地缓存
const refreshData = async () => {
  if (!isButtonEnabled.value) return;

  // 禁用按钮
  isButtonEnabled.value = false;
  countdown.value = 3;
  await refreshReview()
  // 设置倒计时
  const interval = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      clearInterval(interval);
      isButtonEnabled.value = true;
    }
  }, 1000);
}

// 刷新数据（强制网络拉取 + 更新缓存）
const refreshReview = async () => {
  setCurrentDate()
  yesterdayLimitUpData.value = null
  tradeDates.value = getTradeDates(kTradeDates)
  await fetchAndCacheReview()
  recentTradingDay.value = StockDateUtil.getRecentTradingDay()
  await applyLoadedData()
}

// 初始化数据（挂载时调用）：优先本地缓存直出，缓存未命中才拉取并落盘
const initializeData = async () => {
  setCurrentDate()
  yesterdayLimitUpData.value = null
  tradeDates.value = getTradeDates(kTradeDates)
  // 优先从本地缓存载入，避免每次打开都拉取实时数据
  const cached = loadCachedReview()
  if (cached) {
    recentTradingDay.value = cached.tradingDay || StockDateUtil.getRecentTradingDay()
    await applyLoadedData()
    return
  }
  // 缓存未命中（首次打开）：拉取并写入缓存
  await fetchAndCacheReview()
  recentTradingDay.value = StockDateUtil.getRecentTradingDay()
  await applyLoadedData()
}


// 显示历史数据弹窗
const showHistoryModal = (dataType) => {
  currentDataType.value = dataType
  historyModalVisible.value = true
}

// 获取当前数值
const getCurrentValue = () => {
  switch (currentDataType.value) {
    case 'limitUp':
      return limitUpCount.value
    case 'limitDown':
      return limitDownCount.value
    case 'oneWord':
      return oneWordLimitUpCount.value
    case 'continuousRate':
      return continuousLimitUpRate.value
    case 'breakAndRecover':
      return breakAndRecoverCount.value
    case 'maxLevel':
      return maxLimitUpLevel.value
    case 'yesterdayAvgChange':
      return yesterdayLimitUpAvgChange.value
    default:
      return 0
  }
}

// 关闭历史数据弹窗
const handleHistoryModalClose = () => {
  historyModalVisible.value = false
  currentDataType.value = ''
}

// // 测试历史数据弹窗
// const testHistoryModal = () => {
//   console.log('测试历史数据弹窗...')
//   currentDataType.value = 'limitUp'
//   historyModalVisible.value = true
// }

onMounted(async () => {
  await initializeData()
})
</script>


<style scoped>
.stock-review {
  padding: 5px;
  font-family: 'Roboto', sans-serif;
  color: #333;
}

.data-overview .row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.data-overview .item {
  text-align: center;
  width: 18%;
}

.data-overview .label {
  font-size: 14px;
  color: #aaa;
  font-weight: 600;
}

.data-overview .value {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.data-overview .value .change {
  color: #ff4d4f;
}

.data-overview .highlight {
  color: #1890ff;
  font-weight: bold;
}

/* 主体内容区 */
.main-content {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  padding: 0 20px 20px 20px;

}

/* 左侧侧边栏 */
.left-sidebar {
  margin: 0 auto; /* 水平居中 */
  background-color: #ffffff;
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 30px 20px 20px 40px;
}

/* 类别区 */
.category {
  margin-bottom: 30px;
}

.category-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #4c4c4c;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.count {
  font-size: 1.2em;
  color: #888;
  margin-left: 10px;
}

/* 股票列表 */
.stock-list {
  margin-top: 10px;
  display: flex; /* 开启 Flex 布局 */
  flex-wrap: wrap; /* 允许卡片换行 */
  gap: 20px; /* 卡片之间的间距（水平和垂直间距） */
  padding: 20px; /* 容器内边距，避免边缘卡片贴边 */
}

.stock-card {
  background: #ffffff;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  /*cursor: pointer;*/
  /* 核心：设置宽度，一行显示 4 个 */
  flex: 1; /* 让卡片在剩余空间中平均分配 */
  min-width: calc(16.7% - 20px); /* 25% 宽度 - 间距的一半（gap 是 20px，左右各占 10px） */
  max-width: calc(16.7% - 20px); /* 限制最大宽度，避免拉伸过大 */
}

/* 鼠标悬停时的效果 */
.stock-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
}

/* 激活状态：2个卡片宽度 */
.stock-card.active {
  /* 2个卡片宽度 = 50%总宽度 - 间距补偿（gap为20px，左右各占10px） */
  min-width: calc(50% - 20px);
  max-width: calc(50% - 20px);
  /* 可选：添加激活状态的视觉区分（如深色阴影） */
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
}

.stock-level {
  font-size: 14px;
  font-weight: 600;
  color: #999;
}

.stock-name {
  font-size: 18px;
  font-weight: 700;
  margin-top: 8px;
  color: #333;
  /* 新增：开启 Flex 布局 */
  display: flex;
  /* 两端对齐（左侧文本靠左，右侧涨跌幅靠右） */
  justify-content: space-between;
  /* 垂直居中对齐 */
  align-items: center;
}

.stock-change {
  font-size: 18px;
  font-weight: 600;
  /* 移除不必要的 margin，避免影响布局 */
  margin: 0;
  /* 可选：添加右侧间距，与边缘保持距离 */
  padding-left: 5px;
}

.stock-concept {
  font-size: 16px;
  margin-top: 2px;
  color: #515151;
}

.stock-tag {
  font-size: 12px;
  background-color: #f1f3f5;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
  margin-top: 5px;
  margin-left: 15px;
  display: inline-block;
}

.stock-info {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 15px;
  color: #222121;
}

.volume,
.turnover {
  /*background: #f0f2f5;*/
  /*padding: 2px 6px;*/
  border-radius: 3px;
}


/* K线容器样式 */
.mini-kline {
  height: 250px;
  width: 100%;
  margin-top: 8px;
  border: 1px solid #f0f0f0;

}

.mb-8 {
  margin-bottom: 20px;
}

/* 关键修改：使用inline-flex而非flex，让容器宽度由内容决定 */
.slider-filters-container {
  display: flex; /* 只占据内容所需宽度 */
  gap: 20px; /* 两个组件之间的间距 */
}


@media (max-width: 600px) {
  .slider-filters-container {
    flex-direction: column;
    gap: 10px;
  }
}


/* 数据概览 */
.stock-dashboard {
  padding: 20px;

}

/* 卡片容器 */
.dashboard-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* 标题栏 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  /*标题栏下划线*/
  /* border-bottom: 1px solid #fafbff;*/
}

.header-title {
  margin: 0;
  font-size: 1.7rem;
  font-weight: 600;
  color: #1d2129;
  display: flex;
  align-items: center;
}

.header-icon {
  color: #165dff;
  margin-right: 10px;
  font-size: 1.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-btn {
  background: none;
  border: none;
  color: #86909c;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background-color: #f5f7fa;
  color: #165dff;
}

.update-time {
  font-size: 0.875rem;
  color: #86909c;
}

/* 核心指标区 */
.core-indicators {
  display: flex;
  padding: 5px 24px 24px 24px;
  gap: 16px;
  flex-wrap: wrap;
  border-bottom: 1px solid #f5f7fa;
}

.core-item {
  flex: 1;
  min-width: 160px;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 12px;
  transition: background-color 0.3s ease;
}

.core-item:hover {
  background-color: #f0f2f5;
}

.core-label {
  font-size: 0.875rem;
  color: #86909c;
  margin-bottom: 8px;
  display: block;
}

.core-value-group {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.core-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1d2129;
}

.core-change {
  font-size: 1rem;
  font-weight: 500;
}

/* 详细指标网格 */
.indicators-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, auto));
  gap: 20px;
  padding: 5px 24px 24px;
  box-sizing: border-box;
  height: 120px;
}

.indicator-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 12px;
  transition: all 0.3s ease;
  min-width: 0; /* 允许许最小宽度限制，允许收缩 */
  /* 强制卡片内容不换行，避免高度变化 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
}

.indicator-card:hover {
  transform: translateY(-2px);
  background-color: #f0f2f5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background-color: rgba(22, 93, 255, 0.06);
  border: 1px solid rgba(22, 93, 255, 0.15);
}

.indicator-card.clickable {
  cursor: pointer;
}

.indicator-card.clickable:hover .click-hint {
  opacity: 1;
  transform: translateY(0);
}

.click-hint {
  position: absolute;
  bottom: 4px;
  right: 8px;
  font-size: 10px;
  color: #1890ff;
  opacity: 0;
 /* transform: translateY(5px);*/
  /*transition: all 0.3s ease;*/
  pointer-events: none;
}

.indicator-card.highlight {
  background-color: rgba(22, 93, 255, 0.06);
  border: 1px solid rgba(22, 93, 255, 0.15);
}

.indicator-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.indicator-info {
  flex: 1;
  width: 5%;
}

.indicator-name {
  font-size: 0.875rem;
  color: #86909c;
  margin-bottom: 4px;
}

.indicator-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1d2129;

}

/* 状态颜色 */
.up {
  color: #f53f3f;
}

.down {
  color: #00b42a;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .indicators-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .core-indicators {
    flex-direction: column;
  }

  .core-item {
    min-width: auto;
  }

  .indicators-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}
</style>
