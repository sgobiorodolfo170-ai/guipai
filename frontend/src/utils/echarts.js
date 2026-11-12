/**
 * ECharts 按需引入（统一入口）。
 *
 * 为什么要有这个文件：
 *   项目原先 6 个文件各自 `import * as echarts from 'echarts'`——全量引入会把
 *   所有图表类型 + 所有坐标系 + 所有交互组件打进同一个 1.1MB chunk（gzip 371KB），
 *   而实际只用到 line / bar / pie / treemap / candlestick 五种图。
 *   改为按需注册后，未用到的图表类型（map / radar / sankey / graph / gauge…）
 *   与组件（timeline / brush / calendar…）不再进入产物。
 *
 * 用法：调用方 `import echarts from '@/utils/echarts'` 后照常 `echarts.init(...)`，
 * 与全量引入的 API 完全一致（导出的就是已注册好组件的 echarts 命名空间）。
 *
 * 维护约束：**新增图表类型时必须在这里补注册**，否则运行时表现为
 * "图表空白、控制台提示 series type xxx 未注册"。这是按需引入唯一的代价，
 * 集中在一处比散落 6 个文件更容易发现。
 */

import * as echarts from 'echarts/core'

// 图表类型：与当前代码实际使用的一一对应（见各视图的 series.type）
import { LineChart, BarChart, PieChart, TreemapChart, CandlestickChart } from 'echarts/charts'

// 通用组件：标题/提示框/图例/网格/数据集/标记/工具栏/缩放/视觉映射
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  MarkLineComponent,
  MarkPointComponent,
  ToolboxComponent,
  DataZoomComponent,
  VisualMapComponent,
  GraphicComponent
} from 'echarts/components'

// 渲染器：Canvas 是默认且兼容性最好的选择（SVG 渲染器本项目未使用，不注册）
import { LabelLayout, UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  TreemapChart,
  CandlestickChart,

  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  MarkLineComponent,
  MarkPointComponent,
  ToolboxComponent,
  DataZoomComponent,
  VisualMapComponent,
  GraphicComponent,

  LabelLayout,
  UniversalTransition,
  CanvasRenderer
])

export default echarts
