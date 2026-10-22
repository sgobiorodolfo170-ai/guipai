'use strict'

/**
 * 数据管理总览路由 —— 给前端「数据总览」页提供一站式存储视图。
 *
 * 覆盖两个存储：
 *   - sql.js (tradeinsight.db)：业务元数据（用户/自选/笔记/模板/模拟训练/同步状态）。
 *     已迁移至 DolphinDB 的表（stock_limit_pool / stock_zh_index_daily / plate_market_quotation）
 *     不在 sql.js 表单中展示，仅在 DolphinDB 表单显示。
 *   - DolphinDB (dfs://tradeinsight)：时序行情（daily_k / stock_limit_pool /
 *     plate_market_quotation / stock_zh_index_daily / stock_basic / tick）。
 *     未连接时返回 connected:false + 各表计数为 null，由前端展示提示，不影响 sql.js 部分。
 */

const express = require('express')
const fs = require('fs')
const path = require('path')
const { getDb, getDataDir } = require('../db')
const ddb = require('../../dolphindb/client')
const aktools = require('../aktools')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

/** 已迁移至 DolphinDB 的表——不在 sql.js 表单中展示 */
const SQLITE_MIGRATED_TABLES = new Set(['stock_limit_pool', 'stock_zh_index_daily', 'plate_market_quotation'])

/** 已废弃的表——不再写入但旧库可能残留，从总览隐藏避免裸名展示 */
const SQLITE_DISCONTINUED_TABLES = new Set(['data_sync_status'])

/** sql.js 各表的中文说明（表名 → 用途），仅含未迁移的表 */
const SQLITE_TABLE_LABELS = {
  user: '用户',
  watchlist: '自选股',
  watchlist_group: '自选分组',
  price_alert: '价格提醒',
  note: '股票笔记',
  note_alert: '笔记提醒',
  template: '复盘模板',
  template_category: '模板分类',
  sim_single_training: '模拟训练记录',
  stock_basic: '股票基础信息(元数据)',
  stock_financial: '定期财报(三大表+指标)',
  stock_indicator: '估值指标快照',
  board_constituents: '板块成分股',
  data_fetch_log: '数据流转日志',
  trade: '交易流水',
  position: '持仓快照',
  risk_snapshot: '风控快照'
}

/** DolphinDB 各表及日期列（stock_basic 无日期列） */
const DDB_TABLES = [
  { name: 'daily_k', label: '个股日K(前复权)', dateCol: 'trade_date', db: 'dfs://tradeinsight' },
  { name: 'daily_k_raw', label: '原始日K(不复权,只读基线)', dateCol: 'trade_date', db: 'dfs://tradeinsight_raw' },
  { name: 'stock_spot', label: '全市场实时行情', dateCol: 'trade_date', db: 'dfs://tradeinsight' },
  { name: 'stock_index_spot', label: '指数实时行情', dateCol: 'trade_date', db: 'dfs://tradeinsight' },
  { name: 'stock_limit_pool', label: '涨跌停池', dateCol: 'trade_date', db: 'dfs://tradeinsight' },
  { name: 'zt_pool_previous', label: '昨日涨停池', dateCol: 'trade_date', db: 'dfs://tradeinsight' },
  { name: 'plate_market_quotation', label: '板块行情', dateCol: 'trade_date', db: 'dfs://tradeinsight' },
  { name: 'stock_zh_index_daily', label: '指数日K', dateCol: 'trade_date', db: 'dfs://tradeinsight' },
  { name: 'review_statistics', label: '复盘日统计(最高板/涨停/跌停/一字板等)', dateCol: 'trade_date', db: 'dfs://tradeinsight' },
  { name: 'minute_k', label: '分钟K线', dateCol: 'trade_date', db: 'dfs://tradeinsight' },
  { name: 'stock_holding', label: '十大股东', dateCol: 'trade_date', db: 'dfs://tradeinsight' },
  { name: 'stock_dividend', label: '权息事件(分红送转配)', dateCol: 'ex_date', db: 'dfs://tradeinsight_raw' },
  { name: 'stock_basic', label: '股票基础信息', dateCol: null, db: 'dfs://tradeinsight' },
  { name: 'tick', label: 'Tick(预留,暂无数据)', dateCol: 'trade_date', db: 'dfs://tradeinsight' }
]

/**
 * 字段定义 —— 数据总览页展示各表字段含义。
 * ⚠ 对齐规则（见 AGENTS.md「数据库字段变更对齐」）：每次 DB 字段新增/修改/删除，
 *   必须同步更新此定义 + DataOverview.vue 字段渲染，保持总览与库结构一致。
 *
 * 注意：sql.js 与 DolphinDB 都有名为 stock_basic 的表，但 schema 不同（sql.js 是元数据
 * 含 is_st/股本等；DDB 是维度表含 industry/exchange/status），故分两套定义避免串用。
 */
// sql.js 表字段定义
const SQLJS_FIELD_DEFS = {
  stock_basic: [
    { column: 'code', label: '股票代码', source: 'spot' },
    { column: 'name', label: '名称', source: 'spot' },
    { column: 'market', label: '市场', desc: '沪市主板/科创板/深市主板/创业板/北交所', source: '代码前缀派生' },
    { column: 'list_date', label: '上市日期', source: '通达信 base.dbf' },
    { column: 'delist_date', label: '退市日期', source: '通达信 base.dbf（无字段多为空）' },
    { column: 'is_st', label: '是否ST', desc: '0/1', source: '名称含ST' },
    { column: 'is_suspended', label: '是否停牌', desc: '0/1', source: '价=0启发' },
    { column: 'total_shares', label: '总股本', source: '通达信 base.dbf（精确）' },
    { column: 'float_shares', label: '流通股本', source: '通达信 base.dbf（精确）' }
  ],
  stock_financial: [
    { column: 'code', label: '股票代码' },
    { column: 'report_date', label: '报告期', desc: '季报日 YYYY-MM-DD' },
    { column: 'revenue', label: '营收', source: '利润表' },
    { column: 'net_profit', label: '净利润', source: '利润表' },
    { column: 'net_profit_excl_nonrec', label: '扣非净利润', source: '财务指标' },
    { column: 'total_assets', label: '总资产', source: '资产负债表' },
    { column: 'net_assets', label: '净资产', source: '资产负债表' },
    { column: 'debt_ratio', label: '资产负债率(%)', source: '财务指标/派生' },
    { column: 'operating_cashflow', label: '经营现金流', source: '现金流量表' },
    { column: 'gross_margin', label: '毛利率(%)', source: '财务指标/派生' },
    { column: 'roe', label: 'ROE(%)', source: '财务指标' },
    { column: 'roa', label: 'ROA(%)', source: '财务指标' }
  ],
  stock_indicator: [
    { column: 'code', label: '股票代码' },
    { column: 'trade_date', label: '快照日' },
    { column: 'pe_ttm', label: 'PE(TTM)', source: '已下线（原百度估值）' },
    { column: 'pb', label: 'PB', source: '已下线（原百度估值）' },
    { column: 'ps', label: 'PS', source: '已下线（原百度估值）' },
    { column: 'pcf', label: 'PCF', source: '已下线（原百度估值）' },
    { column: 'dividend_yield', label: '股息率', source: '已下线（原百度估值）' }
  ],
  note: [
    { column: 'id', label: 'ID' },
    { column: 'title', label: '标题', desc: '笔记标题' },
    { column: 'stock_code', label: '股票代码', source: '用户输入/搜索选择' },
    { column: 'stock_name', label: '股票名称' },
    { column: 'direction', label: '交易方向', desc: 'buy买入/sell卖出/add加仓/reduce减仓' },
    { column: 'trade_price', label: '成交价格' },
    { column: 'quantity', label: '数量' },
    { column: 'fee', label: '手续费' },
    { column: 'trade_date', label: '成交日期' },
    { column: 'cost', label: '成本', desc: '自动计算: buy/add=价格×数量+手续费' },
    { column: 'holding_status', label: '持仓状态', desc: 'open持仓/closed清仓/partial部分' },
    { column: 'content', label: '富文本内容', desc: 'HTML,买卖逻辑/复盘/经验' },
    { column: 'kline_blocks', label: 'K线块', desc: 'JSON数组:{code,period,startDate,endDate,imageBase64}' },
    { column: 'tags', label: '标签', desc: 'JSON数组' },
    { column: 'is_public', label: '是否公开', desc: '0/1' },
    { column: 'created_at', label: '创建时间' },
    { column: 'updated_at', label: '更新时间' }
  ],
  note_alert: [
    { column: 'id', label: 'ID' },
    { column: 'note_id', label: '笔记ID', desc: '关联note.id' },
    { column: 'user_id', label: '用户ID' },
    { column: 'alert_type', label: '提醒类型', desc: 'price价格/date日期/repeat重复' },
    { column: 'target_price', label: '目标价格', desc: '价格提醒用' },
    { column: 'direction', label: '方向', desc: 'above高于/below低于' },
    { column: 'trigger_date', label: '触发日期' },
    { column: 'trigger_time', label: '触发时间', desc: 'HH:MM' },
    { column: 'repeat_rule', label: '重复规则', desc: 'JSON:{type:daily/weekly/monthly,weekdays:[]}' },
    { column: 'enabled', label: '启用', desc: '0/1' },
    { column: 'last_triggered_at', label: '上次触发时间' },
    { column: 'status', label: '状态', desc: 'pending/triggered/dismissed' },
    { column: 'created_at', label: '创建时间' }
  ],
  data_fetch_log: [
    { column: 'id', label: 'ID' },
    { column: 'created_at', label: '记录时间' },
    { column: 'data_type', label: '数据类型', desc: 'kline/spot/financial/packageDaily 等' },
    { column: 'action', label: '操作', desc: '外部取数或导入动作' },
    { column: 'source_key', label: '数据源代码', desc: 'main/tencent/tdx_quant/akshare/tdx_package 等' },
    { column: 'source_label', label: '数据源', desc: '最终成功的渠道（东财/腾讯/同花顺/Tushare/AKShare 等）', source: '取数链路自动标记' },
    { column: 'status', label: '状态', desc: 'success成功/empty空结果/fail失败' },
    { column: 'row_count', label: '结果行数' },
    { column: 'duration_ms', label: '耗时(ms)' },
    { column: 'params', label: '请求参数', desc: 'JSON 摘要' },
    { column: 'attempts', label: '多源尝试', desc: 'JSON 数组：各源状态/耗时/渠道' },
    { column: 'error', label: '错误信息' },
    { column: 'detail', label: '明细', desc: 'JSON：导入文件数/子表行数等' }
  ],
  trade: [
    { column: 'id', label: 'ID' },
    { column: 'user_id', label: '用户ID' },
    { column: 'stock_code', label: '股票代码', source: '用户输入/搜索选择' },
    { column: 'stock_name', label: '股票名称' },
    { column: 'direction', label: '交易方向', desc: 'buy买入/sell卖出' },
    { column: 'trade_price', label: '成交价格' },
    { column: 'quantity', label: '数量' },
    { column: 'fee', label: '手续费' },
    { column: 'trade_date', label: '成交日期' },
    { column: 'note', label: '备注' },
    { column: 'is_demo', label: '示例标记', desc: '0/1，1=示例数据可一键清除' },
    { column: 'created_at', label: '创建时间' },
    { column: 'updated_at', label: '更新时间' }
  ],
  position: [
    { column: 'id', label: 'ID' },
    { column: 'user_id', label: '用户ID' },
    { column: 'stock_code', label: '股票代码' },
    { column: 'stock_name', label: '股票名称' },
    { column: 'quantity', label: '持仓数量' },
    { column: 'avg_cost', label: '加权平均成本', desc: '含买入费摊薄' },
    { column: 'total_invested', label: '累计买入金额', desc: '含费' },
    { column: 'total_proceeds', label: '累计卖出金额', desc: '扣费' },
    { column: 'realized_pnl', label: '已实现盈亏', desc: '卖出结转成本计算' },
    { column: 'updated_at', label: '更新时间' }
  ],
  risk_snapshot: [
    { column: 'id', label: 'ID' },
    { column: 'user_id', label: '用户ID' },
    { column: 'snapshot_date', label: '快照日期', desc: 'YYYY-MM-DD，每日最多一行' },
    { column: 'total_market_value', label: '总市值' },
    { column: 'total_pnl', label: '浮动盈亏' },
    { column: 'total_position_pct', label: '总仓位%' },
    { column: 'max_single_position_pct', label: '最大单票仓位%' },
    { column: 'heavy_count', label: '重仓股数' },
    { column: 'drawdown_from_peak', label: '回撤%', desc: '相对历史峰值' },
    { column: 'detail', label: '明细', desc: 'JSON：各股票市值/浮盈/仓位' },
    { column: 'created_at', label: '创建时间' }
  ]
}
// DolphinDB 表字段定义（与 sql.js 同名表 schema 不同，单独维护）
const DDB_FIELD_DEFS = {
  daily_k: [
    { column: 'symbol', label: '股票代码' },
    { column: 'trade_date', label: '交易日' },
    { column: 'open', label: '开盘', source: '东财/腾讯/新浪' },
    { column: 'high', label: '最高' },
    { column: 'low', label: '最低' },
    { column: 'close', label: '收盘' },
    { column: 'volume', label: '成交量(手)' },
    { column: 'amount', label: '成交额(元)' },
    { column: 'turnover_rate', label: '换手率(%)' },
    { column: 'pct_chg', label: '涨跌幅(%)' },
    { column: 'amplitude', label: '振幅(%)' }
  ],
  stock_dividend: [
    { column: 'symbol', label: '股票代码' },
    { column: 'ex_date', label: '除权除息日', desc: '分红送转配生效日', source: 'tqcenter get_divid_factors' },
    { column: 'event_type', label: '事件类型', desc: '实测恒为1，语义待确认' },
    { column: 'cash_per_10', label: '每10股派息(税前,元)' },
    { column: 'share_per_10', label: '每10股送股(股)' },
    { column: 'transfer_per_10', label: '每10股转增(股)' },
    { column: 'rights_per_10', label: '每10股配股(股)' },
    { column: 'create_time', label: '写入时间' }
  ],
  stock_basic: [
    { column: 'code', label: '股票代码', source: '东财' },
    { column: 'name', label: '名称' },
    { column: 'industry', label: '行业' },
    { column: 'list_date', label: '上市日期' },
    { column: 'exchange', label: '交易所' },
    { column: 'status', label: '状态' }
  ],
  review_statistics: [
    { column: 'trade_date', label: '交易日', source: '复盘日' },
    { column: 'max_continuous_level', label: '最高板', desc: '当日最高连板数（连板数=连续出现在涨停池的交易日数，自研推导）' },
    { column: 'limit_up_count', label: '涨停股', source: 'stock_limit_pool LIMIT_UP 计数' },
    { column: 'limit_down_count', label: '跌停股', source: 'stock_limit_pool LIMIT_DOWN 计数' },
    { column: 'one_word_count', label: '一字板', desc: '首次封板<=09:25:04 且炸板次数=0 的涨停股数' },
    { column: 'continuous_limit_rate', label: '连板率(%)', desc: '连板>=2 的涨停股 / 涨停股总数 × 100，两位小数' },
    { column: 'blast_reseal_count', label: '炸板回封数', desc: '炸板次数>=1 的涨停股数（涨停池行天然已回封）' },
    { column: 'yesterday_limitup_avg_change', label: '昨日涨停涨幅(%)', desc: '昨日涨停池 pct_chg 均值，两位小数；无数据为 NULL' },
    { column: 'create_time', label: '写入时间' }
  ]
}

/** sql.js 关键字段填充覆盖统计（表 → [字段]）——总览展示各字段实际填充率，暴露未同步字段 */
const SQLITE_COVERAGE = {
  stock_basic: ['list_date', 'total_shares', 'is_st', 'is_suspended'],
  stock_financial: ['revenue', 'total_assets', 'roe'],
  stock_indicator: ['pe_ttm', 'pb', 'pcf'],
  note: ['stock_code', 'direction', 'cost', 'holding_status'],
  note_alert: ['alert_type', 'status'],
  data_fetch_log: ['source_label', 'status', 'data_type'],
  trade: ['stock_code', 'direction', 'quantity'],
  position: ['stock_code', 'quantity', 'avg_cost'],
  risk_snapshot: ['snapshot_date', 'total_market_value']
}

/**
 * GET /api/data-mgmt/overview
 * 返回: { sqlite: { fileSize, tables: [{name,label,rows,legacy}] },
 *         dolphindb: { connected, tables: [{name,label,rows,latestDate}] } }
 */
router.get('/overview', async (req, res) => {
  try {
    // ---- sql.js：遍历 sqlite_master 所有用户表并计数 ----
    const db = getDb()
    const tables = db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
    ).all()
    const sqliteTables = tables
      .filter(({ name }) => !SQLITE_MIGRATED_TABLES.has(name) && !SQLITE_DISCONTINUED_TABLES.has(name))
      .map(({ name }) => {
        let rows = 0
        try { rows = db.prepare(`SELECT COUNT(*) AS c FROM "${name}"`).get()?.c || 0 } catch (_) { /* 单表失败不阻断整体 */ }
        const entry = { name, label: SQLITE_TABLE_LABELS[name] || name, rows, fields: SQLJS_FIELD_DEFS[name] || null }
        // 关键字段填充覆盖（非空计数），暴露"表有行但某字段未同步"的情况
        if (SQLITE_COVERAGE[name] && rows > 0) {
          entry.coverage = {}
          for (const col of SQLITE_COVERAGE[name]) {
            try {
              entry.coverage[col] = db.prepare(`SELECT COUNT(*) AS c FROM "${name}" WHERE "${col}" IS NOT NULL`).get()?.c || 0
            } catch (_) { entry.coverage[col] = null }
          }
        }
        return entry
      })
    // tradeinsight.db 文件大小（sql.js 是内存库+定时落盘，文件可能略滞后于内存）
    let fileSize = 0
    try {
      const p = path.join(getDataDir(), 'tradeinsight.db')
      if (fs.existsSync(p)) fileSize = fs.statSync(p).size
    } catch (_) { /* 取不到文件大小不影响其他数据 */ }

    // ---- DolphinDB：未连接时快速返回，避免每次打开总览页都等连接超时 ----
    const ddbTables = DDB_TABLES.map(t => ({ name: t.name, label: t.label, dateCol: t.dateCol, db: t.db, fields: DDB_FIELD_DEFS[t.name] || null, rows: null, latestDate: null }))
    const connected = ddb.isConnected()
    if (connected) {
      await Promise.all(ddbTables.map(async (t) => {
        try {
          const datePart = t.dateCol ? `, max(${t.dateCol}) as latestDate` : ''
          const r = await ddb.execute(
            `select count(*) as rows${datePart} from loadTable("${t.db}", "${t.name}")`
          )
          if (Array.isArray(r) && r.length) {
            t.rows = Number(r[0].rows) || 0
            t.latestDate = r[0].latestDate ? String(r[0].latestDate).replace(/\./g, '-') : null
          }
        } catch (e) {
          t.error = e.message // 单表失败（如表不存在）不阻断整体
        }
      }))
    }

    ok(res, {
      sqlite: { file: 'tradeinsight.db', fileSize, tables: sqliteTables },
      dolphindb: { connected, database: 'dfs://tradeinsight', tables: ddbTables },
      sources: typeof aktools.getSourceHealth === 'function' ? aktools.getSourceHealth() : []
    })
  } catch (e) { errMsg(res, e.message) }
})

module.exports = router
