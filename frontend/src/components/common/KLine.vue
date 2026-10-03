<template>
  <div class="stock-chart-container">


    <!-- 图表容器 -->
    <div ref="chartRef" :style="containerStyle"></div>
    <!-- 指标切换按钮组 -->
    <div class="indicator-buttons" v-if="showIndicatorButtons && props.tooltipDisplayItems.indicator">
      <button
          v-for="indicator in indicators"
          :key="indicator.value"
          @click="currentIndicator = indicator.value"
          :class="{ active: currentIndicator === indicator.value }"
      >
        {{ indicator.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

// 接收外部传入的参数
const props = defineProps({
  // 图表容器样式
  style: {
    type: Object,
    default: () => ({ height: '1000px', width: '100%' })
  },
  // 股票数据（格式: [日期, 开盘价, 收盘价, 最高价, 最低价, 成交量]）
  data: {
    type: Array,
    default: () => []
  },
  // 上涨颜色
  upColor: {
    type: String,
    default: '#ec0000'
  },
  // 下跌颜色
  downColor: {
    type: String,
    default: '#00da3c'
  },
  // 均线配置
  mas: {
    type: Array,
    default: () => [5, 10, 20, 30] // 默认5/10/20/30日均线
  },
  showMA: {
    type: Boolean,
    default: true // 是否显示均线
  },
  showVolume: {
    type: Boolean,
    default: true // 是否显示成交量
  },
  showLegendData: {
    type: Boolean,
    default: true
  },
  // 是否显示指标切换按钮
  showIndicatorButtons: {
    type: Boolean,
    default: false
  },
  // 默认显示的指标
  defaultIndicator: {
    type: String,
    default: 'MACD'
  },
  tooltipDisplayItems: {
    type: Object,
    default: () => ({
      kline: true,    // 是否显示K线核心数据（开盘/收盘/最高/最低）
      volume: true,   // 是否显示成交量
      indicator: false // 是否显示技术指标数据
    })
  }
});

// 技术指标类型
const indicators = [
  { label: 'MACD', value: 'MACD' },
  { label: 'RSI', value: 'RSI' },
  { label: 'BIAS', value: 'BIAS' },
  // { label: 'OBV', value: 'OBV' },
  // { label: '无', value: 'NONE' }
];

// 图表实例和DOM引用
const chartRef = ref(null);
let myChart = null;
const containerStyle = computed(() => props.style);
const currentIndicator = ref(props.defaultIndicator);
const dataZoomRangeSize = ref(100); // 保存缩放范围大小

// 处理原始数据
function splitData(rawData) {
  const categoryData = [];
  const kData = [];
  const volumes = [];
  const closePrices = []; // 用于计算技术指标的收盘价数组

  for (let i = 0; i < rawData.length; i++) {
    categoryData.push(rawData[i][0]);

    const itemData = rawData[i].slice(1);
    kData.push(itemData);
    closePrices.push(itemData[1]); // 收盘价

    volumes.push([
      i,
      itemData[4], // 成交量
      itemData[0] > itemData[1] ? 1 : -1 // 涨跌标识
    ]);
  }

  return { categoryData, kData, volumes, closePrices };
}

// 计算移动平均线
function calculateMA(dayCount, data) {
  const result = [];
  for (let i = 0, len = data.kData.length; i < len; i++) {
    if (i < dayCount - 1) {
      result.push('-');
      continue;
    }
    let sum = 0;
    for (let j = 0; j < dayCount; j++) {
      sum += data.kData[i - j][1];
    }
    result.push(+(sum / dayCount).toFixed(3));
  }
  return result;
}

// 技术指标计算函数

// 1. MACD计算
function calculateMACD(closePrices, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
  const emaShort = [];
  const emaLong = [];
  const dif = [];
  const dea = [];
  const macd = [];

  // 计算EMA
  for (let i = 0; i < closePrices.length; i++) {
    if (i === 0) {
      emaShort.push(closePrices[i]);
      emaLong.push(closePrices[i]);
    } else {
      emaShort.push((2 * closePrices[i] + (shortPeriod - 1) * emaShort[i - 1]) / (shortPeriod + 1));
      emaLong.push((2 * closePrices[i] + (longPeriod - 1) * emaLong[i - 1]) / (longPeriod + 1));
    }

    // 计算DIF (EMA12 - EMA26)
    dif.push(+(emaShort[i] - emaLong[i]).toFixed(3));

    // 计算DEA (MACD的9日EMA)
    if (i === 0) {
      dea.push(dif[i]);
    } else {
      dea.push(+(2 * dif[i] + (signalPeriod - 1) * dea[i - 1]) / (signalPeriod + 1));
    }

    // 计算MACD (DIF - DEA) * 2
    macd.push(+((dif[i] - dea[i]) * 2).toFixed(3));
  }

  return { dif, dea, macd };
}

// 2. BOLL计算
function calculateBOLL(closePrices, period = 20, stdDev = 2) {
  const boll = { upper: [], middle: [], lower: [] };

  for (let i = 0; i < closePrices.length; i++) {
    if (i < period - 1) {
      boll.upper.push('-');
      boll.middle.push('-');
      boll.lower.push('-');
      continue;
    }

    // 计算中轨线（N日收盘价的移动平均）
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += closePrices[i - j];
    }
    boll.middle.push(+(sum / period).toFixed(3));

    // 计算标准差
    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      varianceSum += Math.pow(closePrices[i - j] - boll.middle[i], 2);
    }
    const std = Math.sqrt(varianceSum / period);

    // 计算上轨和下轨
    boll.upper.push(+(boll.middle[i] + stdDev * std).toFixed(3));
    boll.lower.push(+(boll.middle[i] - stdDev * std).toFixed(3));
  }

  return boll;
}

// 3. KDJ计算
function calculateKDJ(prices, period = 9, kPeriod = 3, dPeriod = 3) {
  const kdj = { k: [], d: [], j: [] };
  const lows = [];
  const highs = [];
  const rsv = [];

  // 提取最高价和最低价
  for (let i = 0; i < prices.length; i++) {
    highs.push(prices[i][3]); // 最高价
    lows.push(prices[i][4]);  // 最低价
  }

  // 计算RSV
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      rsv.push(50); // 初始值
      continue;
    }

    // 找到最近period天的最高价和最低价
    let minLow = Infinity;
    let maxHigh = -Infinity;
    for (let j = 0; j < period; j++) {
      minLow = Math.min(minLow, lows[i - j]);
      maxHigh = Math.max(maxHigh, highs[i - j]);
    }

    // 计算RSV
    if (maxHigh === minLow) {
      rsv.push(50);
    } else {
      rsv.push(+(((prices[i][1] - minLow) / (maxHigh - minLow)) * 100).toFixed(3));
    }
  }

  // 计算K值和D值
  for (let i = 0; i < rsv.length; i++) {
    if (i === 0) {
      kdj.k.push(50);
      kdj.d.push(50);
    } else {
      kdj.k.push(+((2 / 3) * kdj.k[i - 1] + (1 / 3) * rsv[i]).toFixed(3));
      kdj.d.push(+((2 / 3) * kdj.d[i - 1] + (1 / 3) * kdj.k[i]).toFixed(3));
    }
    // 计算J值
    kdj.j.push(+(3 * kdj.k[i] - 2 * kdj.d[i]).toFixed(3));
  }

  return kdj;
}

// 4. RSI计算
function calculateRSI(closePrices, period = 14) {
  const rsi = [];
  const changes = [];

  // 计算价格变动
  for (let i = 1; i < closePrices.length; i++) {
    changes.push(closePrices[i] - closePrices[i - 1]);
  }

  // 计算RSI
  for (let i = 0; i < closePrices.length; i++) {
    if (i < period) {
      rsi.push('-');
      continue;
    }

    let upSum = 0;
    let downSum = 0;

    // 计算最近period天的上涨和下跌总和
    for (let j = 0; j < period; j++) {
      const change = changes[i - 1 - j]; // changes比closePrices少一个元素
      if (change > 0) {
        upSum += change;
      } else {
        downSum += Math.abs(change);
      }
    }

    if (downSum === 0) {
      rsi.push(100);
    } else {
      const rs = upSum / downSum;
      rsi.push(+(100 - (100 / (1 + rs))).toFixed(3));
    }
  }

  return rsi;
}

// 5. BIAS计算 (乖离率)
function calculateBIAS(closePrices, periods = [6, 12, 24]) {
  const bias = {};

  periods.forEach(period => {
    bias[`bias${period}`] = [];
    for (let i = 0; i < closePrices.length; i++) {
      if (i < period - 1) {
        bias[`bias${period}`].push('-');
        continue;
      }

      // 计算移动平均
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += closePrices[i - j];
      }
      const ma = sum / period;

      // 计算乖离率
      bias[`bias${period}`].push(+(((closePrices[i] - ma) / ma) * 100).toFixed(3));
    }
  });

  return bias;
}

// 6. OBV计算 (能量潮指标)
function calculateOBV(closePrices, volumes) {
  const obv = [];
  obv.push(0); // 第一个值为0

  for (let i = 1; i < closePrices.length; i++) {
    if (closePrices[i] > closePrices[i - 1]) {
      // 上涨，加上成交量
      obv.push(+(obv[i - 1] + volumes[i][1]).toFixed(3));
    } else if (closePrices[i] < closePrices[i - 1]) {
      // 下跌，减去成交量
      obv.push(+(obv[i - 1] - volumes[i][1]).toFixed(3));
    } else {
      // 平盘，保持不变
      obv.push(obv[i - 1]);
    }
  }

  return obv;
}

// 创建图表配置项
function createOption(data) {
  // 1. 初始化系列数组（先放入K线系列）
  const series = [
    {
      name: 'K线概览',
      type: 'candlestick',
      data: data.kData,
      itemStyle: {
        color: props.upColor,
        color0: props.downColor,
        borderColor: props.upColor,
        borderColor0: props.downColor
      }
    }
  ];

  // 2. 添加均线系列
  let maSeries = [];
  if (props.showMA && props.mas.length > 0) {
    maSeries = props.mas.map(day => ({
      name: `MA${day}`,
      type: 'line',
      data: calculateMA(day, data),
      smooth: true,
      showSymbol: false,
      symbol: 'none',
      lineStyle: { opacity: 0.5 }
    }));
    series.push(...maSeries);
  }

  // 3. 添加成交量系列
  let volumeSeriesIndex = -1;
  if (props.showVolume && data.volumes) {
    volumeSeriesIndex = series.length;
    series.push({
      name: '成交量',
      type: 'bar',
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: data.volumes
    });
  }

  // 4. 计算并添加技术指标系列
  let indicatorSeries = [];
  let indicatorGridIndex = props.showVolume ? 2 : 1;
  let indicatorYAxisIndex = props.showVolume ? 2 : 1;
  // 关键修复1：提前初始化macdSeriesIndex，避免未定义
  let macdSeriesIndex = -1;

  if (props.tooltipDisplayItems.indicator && currentIndicator.value !== 'NONE') {
    switch (currentIndicator.value) {
      case 'MACD':
        const macdData = calculateMACD(data.closePrices);
        macdSeriesIndex = series.length + 2; // 现在这里赋值不会导致未定义
        indicatorSeries = [
          {
            name: 'DIF',
            type: 'line',
            xAxisIndex: 2,
            yAxisIndex: indicatorYAxisIndex,
            data: macdData.dif,
            lineStyle: { color: '#ff9900' },
            showSymbol: false,  // 隐藏线上的点
            symbol: 'none'      // 确保不显示点标记

          },
          {
            name: 'DEA',
            type: 'line',
            xAxisIndex: 2,
            yAxisIndex: indicatorYAxisIndex,
            data: macdData.dea,
            lineStyle: { color: '#0066ff' },
            showSymbol: false,  // 隐藏线上的点
            symbol: 'none'      // 确保不显示点标记
          },
          {
            name: 'MACD',
            type: 'bar',
            xAxisIndex: 2,
            yAxisIndex: indicatorYAxisIndex,
            data: macdData.macd.map((val, idx) => [
              idx, val, val >= 0 ? 1 : -1
            ])
          }
        ];
        break;

      // case 'BOLL':
      //   const bollData = calculateBOLL(data.closePrices);
      //   indicatorSeries = [
      //     {
      //       name: '上轨',
      //       type: 'line',
      //       data: bollData.upper,
      //       lineStyle: { color: '#999999' }
      //     },
      //     {
      //       name: '中轨',
      //       type: 'line',
      //       data: bollData.middle,
      //       lineStyle: { color: '#ff6600' }
      //     },
      //     {
      //       name: '下轨',
      //       type: 'line',
      //       data: bollData.lower,
      //       lineStyle: { color: '#999999' }
      //     }
      //   ];
      //   break;

      // case 'KDJ':
      //   const kdjData = calculateKDJ(data.kData);
      //   indicatorSeries = [
      //     {
      //       name: 'K',
      //       type: 'line',
      //       xAxisIndex: 2,
      //       yAxisIndex: indicatorYAxisIndex,
      //       data: kdjData.k,
      //       lineStyle: { color: '#ff9900' }
      //     },
      //     {
      //       name: 'D',
      //       type: 'line',
      //       xAxisIndex: 2,
      //       yAxisIndex: indicatorYAxisIndex,
      //       data: kdjData.d,
      //       lineStyle: { color: '#0066ff' }
      //     },
      //     {
      //       name: 'J',
      //       type: 'line',
      //       xAxisIndex: 2,
      //       yAxisIndex: indicatorYAxisIndex,
      //       data: kdjData.j,
      //       lineStyle: { color: '#33cc33' }
      //     }
      //   ];
      //   break;

      case 'RSI':
        const rsiData = calculateRSI(data.closePrices);
        indicatorSeries = [
          {
            name: 'RSI',
            type: 'line',
            xAxisIndex: 2,
            yAxisIndex: indicatorYAxisIndex,
            data: rsiData,
            lineStyle: { color: '#ff6600' },
            showSymbol: false,  // 隐藏线上的点
            symbol: 'none'      // 确保不显示点标记
          }
        ];
        break;

      case 'BIAS':
        const biasData = calculateBIAS(data.closePrices);
        indicatorSeries = [
          {
            name: 'BIAS6',
            type: 'line',
            xAxisIndex: 2,
            yAxisIndex: indicatorYAxisIndex,
            data: biasData.bias6,
            lineStyle: { color: '#ff9900' },
            showSymbol: false,  // 隐藏线上的点
            symbol: 'none'      // 确保不显示点标记
          },
          {
            name: 'BIAS12',
            type: 'line',
            xAxisIndex: 2,
            yAxisIndex: indicatorYAxisIndex,
            data: biasData.bias12,
            lineStyle: { color: '#0066ff' },
            showSymbol: false,  // 隐藏线上的点
            symbol: 'none'      // 确保不显示点标记
          }
        ];
        break;

      case 'OBV':
        const obvData = calculateOBV(data.closePrices, data.volumes);
        indicatorSeries = [
          {
            name: 'OBV',
            type: 'line',
            xAxisIndex: 2,
            yAxisIndex: indicatorYAxisIndex,
            data: obvData,
            lineStyle: { color: '#33cc33' },
            showSymbol: false,  // 隐藏线上的点
            symbol: 'none'      // 确保不显示点标记
          }
        ];
        break;
    }

    series.push(...indicatorSeries);
  }


  let grid = [];
  // 5. 配置网格布局
  // K线区域
  // grid.push({ left: '3%', right: '1%', top: '8%', height: props.showVolume ? '45%' : '65%' });
  //
  // // 成交量区域
  // if (props.showVolume) {
  //   grid.push({ left: '3%', right: '1%', top: '55%', height: '15%' });
  // }

  grid.push({
    left: '3%',
    right: '1%',
    top: '8%',
    // 当不显示指标时，自动扩大K线区域高度
    height: props.showVolume
        ? (props.tooltipDisplayItems.indicator ? '45%' : '70%')
        : (props.tooltipDisplayItems.indicator ? '65%' : '90%')
  });

  // 成交量区域
  if (props.showVolume) {
    grid.push({
      left: '3%',
      right: '1%',
      top: props.tooltipDisplayItems.indicator ? '55%' : '80%',
      height: props.tooltipDisplayItems.indicator ? '15%' : '17%'
    });
  }

  // 指标区域（只有 indicator 为 true 时才添加指标网格）
  if (props.tooltipDisplayItems.indicator && currentIndicator.value !== 'NONE') {
    grid.push({
      left: '3%',
      right: '1%',
      top: props.showVolume ? '72%' : '70%',
      height: '25%'
    });
  }

  // 6. 配置x轴
  const xAxis = [
    {
      type: 'category',
      data: data.categoryData,
      boundaryGap: false,
      axisLine: { onZero: false },
      splitLine: { show: false },
      min: 'dataMin',
      max: 'dataMax',
      axisPointer: { z: 100 }
    }
  ];

  // 成交量x轴
  if (props.showVolume) {
    xAxis.push({
      type: 'category',
      gridIndex: 1,
      data: data.categoryData,
      boundaryGap: false,
      axisLine: { onZero: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      min: 'dataMin',
      max: 'dataMax'
    });
  }

  // 指标x轴
  if (currentIndicator.value !== 'NONE') {
    xAxis.push({
      type: 'category',
      gridIndex: indicatorGridIndex,
      data: data.categoryData,
      boundaryGap: false,
      axisLine: { onZero: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      min: 'dataMin',
      max: 'dataMax'
    });
  }

  // 7. 配置y轴
  const yAxis = [
    {
      scale: true,
      splitArea: { show: false }
    }
  ];

  // 成交量y轴
  if (props.showVolume) {
    yAxis.push({
      scale: true,
      gridIndex: 1,
      splitNumber: 2,
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false }
    });
  }

  // 指标y轴
  if (currentIndicator.value !== 'NONE') {
    yAxis.push({
      scale: true,
      gridIndex: indicatorGridIndex,
      splitNumber: 3,
      axisLine: { show: false },
      splitLine: { show: true, lineStyle: { color: '#eee' } }
    });
  }

  // 8. 配置图例
  const legendData = [];
  if (props.showLegendData) {
    legendData.push('K线概览');
    if (props.showMA && props.mas.length > 0) {
      legendData.push(...props.mas.map(day => `MA${day}`));
    }
    if (props.showVolume) {
      legendData.push('成交量');
    }

    // 添加指标图例
    if (currentIndicator.value !== 'NONE') {
      switch (currentIndicator.value) {
        case 'MACD':
          legendData.push('DIF', 'DEA', 'MACD');
          break;
        case 'BOLL':
          legendData.push('上轨', '中轨', '下轨');
          break;
        case 'KDJ':
          legendData.push('K', 'D', 'J');
          break;
        case 'RSI':
          legendData.push('RSI');
          break;
        case 'BIAS':
          legendData.push('BIAS6', 'BIAS12');
          break;
        case 'OBV':
          legendData.push('OBV');
          break;
      }
    }
  }

  // 9. 基础配置
  const option = {
    backgroundColor: '#ffffff',
    animation: false,
    legend: {
      x: 'center',
      y: 'top',
      padding: [10, 0, 0, 0],
      data: legendData
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      borderWidth: 1,
      borderColor: '#ccc',
      padding: 10,
      textStyle: { color: '#000' },
      position(pos, params, el, elRect, size) {
        const obj = { top: 10 };
        obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30;
        return obj;
      },
      // 重写formatter，解决卡顿+支持配置控制
      formatter: function (params) {
        if (!params || params.length === 0) return '';
        // 1. 提取日期（只取第一个有效项的日期，避免重复）
        const validParam = params.find(item => item.name);
        if (!validParam) return '';
        let result = `<div style="font-weight:bold;margin-bottom:5px;">${validParam.name}</div>`;

        // 2. 遍历有效参数，按配置渲染对应项
        params.forEach(item => {
          // 跳过无数据/无名称的项（减少无效渲染）
          if (!item.name || item.value === undefined || item.value === '-') return;

          // 2.1 渲染K线核心数据（开/收/高/低）- 按配置控制
          if (props.tooltipDisplayItems.kline &&
              item.seriesType === 'candlestick' &&
              item.seriesName === 'K线概览') {
            const [, open, close, low, high] = item.data || [];
            // 只在数据存在时渲染，避免undefined报错
            if (open !== undefined && close !== undefined) {
              result += `<div>${item.marker}开盘价: ${open.toFixed(2)}</div>`;
              result += `<div>${item.marker}收盘价: ${close.toFixed(2)}</div>`;
              result += `<div>${item.marker}最低价: ${low.toFixed(2)}</div>`;
              result += `<div>${item.marker}最高价: ${high.toFixed(2)}</div>`;
            }
          }

          // 2.2 渲染成交量 - 按配置控制
          else if (props.tooltipDisplayItems.volume &&
              item.seriesType === 'bar' &&
              item.seriesName === '成交量') {
            const [, volume] = item.data || [];
            if (volume !== undefined && volume !== -1) {
              const volumeInBillion = (volume / 100000000).toFixed(3);
              result += `<div>${item.marker}成交额度: ${volumeInBillion} 亿</div>`;
            }
          }

          // 2.3 渲染技术指标（MACD/KDJ等）- 按配置控制
          else if (props.tooltipDisplayItems.indicator &&
              !['K线概览', '成交量'].includes(item.seriesName)) {
            // 处理指标数据（兼容数组/单个值格式）
            const indicatorValue = Array.isArray(item.value) ? item.value[1] : item.value;
            if (indicatorValue !== undefined && indicatorValue !== '-') {
              result += `<div>${item.marker}${item.seriesName}: ${parseFloat(indicatorValue).toFixed(3)}</div>`;
            }
          }
        });

        return result;
      }
    },
    axisPointer: {
      link: [{ xAxisIndex: 'all' }],
      label: { backgroundColor: '#777' }
    },
    grid: grid,
    xAxis: xAxis,
    yAxis: yAxis,
    series: series,
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: Array.from({ length: xAxis.length }, (_, i) => i),
        start: Math.max(0, 100 - dataZoomRangeSize.value),
        end: 100
      }
    ],
    visualMap: []
  };

  // 添加MACD的视觉映射（作为独立的visualMap元素）
  if (props.tooltipDisplayItems.indicator && currentIndicator.value === 'MACD' && macdSeriesIndex > -1) {
    option.visualMap.push({
      show: false,
      seriesIndex: macdSeriesIndex,
      dimension: 2,
      pieces: [
        { value: 1, color: props.upColor },
        { value: -1, color: props.downColor }
      ]
    });
  }


  // 成交量的视觉映射（作为独立的visualMap元素）
  if (props.showVolume && volumeSeriesIndex > -1) {
    option.visualMap.push({
      show: false,
      seriesIndex: volumeSeriesIndex,
      dimension: 2,
      pieces: [
        { value: 1, color: 'rgba(0, 180, 0, 0.7)' },
        { value: -1, color: 'rgba(220, 0, 0, 0.7)' }
      ]
    });
  }

  return option;
}

// 初始化图表
function initChart(data) {
  if (myChart) {
    // 保存当前缩放范围的大小
    const chartOption = myChart.getOption();
    if (chartOption.dataZoom && chartOption.dataZoom.length > 0) {
      const targetZoom = chartOption.dataZoom[0];
      dataZoomRangeSize.value = Math.max(1, targetZoom.end - targetZoom.start);
    }
    myChart.dispose();
  }

  if (!chartRef.value) return;

  myChart = echarts.init(chartRef.value);
  const option = createOption(data);
  myChart.setOption(option);

  // 响应窗口大小变化（幂等注册：先移除再添加，避免重复监听累积）
  window.removeEventListener('resize', handleResize);
  window.addEventListener('resize', handleResize);
}

// 窗口大小变化处理（固定引用，供 initChart 与顶层卸载时共用）
const handleResize = () => {
  if (myChart) myChart.resize();
};

// 加载数据并初始化图表
async function loadAndInitChart() {
  try {
    if (props.data && props.data.length > 0) {
      const processedData = splitData(props.data);
      initChart(processedData);
    }
  } catch (error) {
    console.error('股票图表初始化失败:', error);
  }
}

// 监听数据变化
watch(
    () => props.data,
    (newData) => {
      if (newData && newData.length > 0) {
        loadAndInitChart();
      }
    },
    { deep: false }
);

// 监听指标切换和其他属性变化
watch(
    () => [props.mas, props.upColor, props.downColor, props.showMA, props.showVolume, currentIndicator.value],
    () => loadAndInitChart(),
    { deep: false }
);

// 组件挂载时初始化
onMounted(() => {
  loadAndInitChart();
});

// 组件卸载时销毁图表实例并移除 resize 监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (myChart) {
    myChart.dispose();
    myChart = null;
  }
});

// 暴露方法给父组件调用
defineExpose({
  refresh: () => loadAndInitChart(),
  getInstance: () => myChart,
  setIndicator: (indicator) => {
    if (indicators.some(item => item.value === indicator)) {
      currentIndicator.value = indicator;
    }
  }
});
</script>

<style scoped>
.stock-chart-container {
  width: 100%;
}

.indicator-buttons {
  display: flex;
  gap: 8px;
  padding: 10px;
  flex-wrap: wrap;
}

.indicator-buttons button {
  padding: 4px 12px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.indicator-buttons button.active {
  background-color: #42b983;
  color: white;
  border-color: #42b983;
}

.indicator-buttons button:hover {
  border-color: #42b983;
  color: #42b983;
}
</style>
