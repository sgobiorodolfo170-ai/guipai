#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""AKShare 行情数据桥接服务。

由 Electron 主进程 spawn（打包态 exe）或开发态 `python server.py --port 8889` 直跑。
暴露 REST 端点，内部调用 akshare 函数，返回与东财口径一致的"中文键对象数组" JSON。
Node 端 sources/akshare.js 作为 registry 的末级兜底源调用本服务。

设计要点：
  - akshare DataFrame 列名本就是中文键（与东财输出一致），故只需 df.to_dict('records')
    + NaN/Timestamp 净化即可，几乎零字段映射。
  - Flask dev server 足够（本地单用户桌面应用，无并发压力）。
  - 日期参数兼容 'YYYY-MM-DD' / 'YYYYMMDD'，统一传给 akshare 的 'YYYYMMDD'。
"""

import argparse
import math
import re
import threading
import time
import traceback
from concurrent.futures import ThreadPoolExecutor

from flask import Flask, jsonify, request

app = Flask(__name__)

try:
    import akshare as ak
    AK_VERSION = getattr(ak, '__version__', 'unknown')
    AK_IMPORT_ERR = None
except Exception as e:  # akshare 未装/导入失败：服务仍可启动，端点返回不可用
    ak = None
    AK_VERSION = None
    AK_IMPORT_ERR = f'{type(e).__name__}: {e}'

# 通达信 tqs（tqserver/tdxaidata，免客户端，Key 鉴权）
try:
    from tdxaidata import tqs as _tqs
    TQS_OK = True
except Exception as _e:
    _tqs = None
    TQS_OK = False


def _tqs_kline_records(r, symbol):
    """tqs.get_market_data 返回 {field: DataFrame(code-col, date-index)} → 中文键记录数组。
    Amount 单位万元→元(×10000)；涨跌额/涨跌幅/振幅由前收推导。"""
    import pandas as pd
    if not isinstance(r, dict) or 'Close' not in r:
        return []
    close_df = r['Close']
    if not hasattr(close_df, 'index'):
        return []
    code = close_df.columns[0] if len(close_df.columns) else symbol
    dates = close_df.index
    out = []
    prev_close = None
    for i, d in enumerate(dates):
        day = d.strftime('%Y-%m-%d') if hasattr(d, 'strftime') else str(d)[:10]
        def gv(field):
            df = r.get(field)
            if df is None or i >= len(df):
                return None
            try:
                v = df.iloc[i][code]
                return float(v) if pd.notna(v) else None
            except Exception:
                return None
        close = gv('Close')
        open_ = gv('Open')
        high = gv('High')
        low = gv('Low')
        vol = gv('Volume')
        amt = gv('Amount')
        if amt is not None:
            amt = amt * 10000  # 万元 → 元
        chg = None if (prev_close is None or close is None) else round(close - prev_close, 2)
        out.append({
            '日期': day, '股票代码': symbol,
            '开盘': open_, '收盘': close, '最高': high, '最低': low,
            '成交量': vol, '成交额': amt,
            '振幅': None if (prev_close is None or prev_close == 0) else round((high - low) / prev_close * 100, 2),
            '涨跌幅': None if (chg is None or prev_close == 0) else round(chg / prev_close * 100, 2),
            '涨跌额': chg, '换手率': None
        })
        if close is not None:
            prev_close = close
    return out


def _tqs_code(symbol):
    """纯数字 → tqs 格式 600519.SH / 000001.SZ / 810011.BJ。
    已带后缀（如 600519.SH）直接返回，防止拼接出 .SH.SZ。"""
    s = str(symbol).strip()
    if '.' in s:
        return s
    if re.match(r'^(43|83|87|88|92)', s):
        return f'{s}.BJ'
    return f'{s}.SH' if s.startswith('6') else f'{s}.SZ'


def _tqs_index_code(symbol):
    """指数代码 → tqs 格式。000xxx→SH（上证系列），399xxx→SZ（深证系列）。
    与 _tqs_code 区别：000001 是上证指数(.SH) 不是平安银行(.SZ)。"""
    s = str(symbol).strip()
    if '.' in s:
        return s
    if s.startswith('399'):
        return f'{s}.SZ'
    return f'{s}.SH'


def _tqs_period(period):
    p = str(period or 'daily')
    return {'daily': '1d', 'day': '1d', 'weekly': '1w', 'week': '1w',
            'monthly': '1M', 'month': '1M'}.get(p, (p + 'm' if re.match(r'^\d+$', p) else '1d'))


def _safe(obj):
    """递归把 DataFrame→dict 中的 NaN/NaT/Timestamp 等 JSON 不安全值转 null/str。
    pandas 的 isna() 对标量返回 bool，对 array 报错；逐元素处理，异常跳过。"""
    try:
        import pandas as pd
    except Exception:
        pd = None
    if obj is None:
        return None
    if isinstance(obj, float) and math.isnan(obj):
        return None
    if pd is not None and isinstance(obj, pd.Timestamp):
        try:
            return None if pd.isna(obj) else obj.strftime('%Y-%m-%d %H:%M:%S')
        except Exception:
            return None
    if pd is not None:
        try:
            if pd.isna(obj):
                return None
        except (TypeError, ValueError):
            pass
    if isinstance(obj, dict):
        return {k: _safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_safe(x) for x in obj]
    return obj


def _records(df):
    """DataFrame -> JSON-safe list of dicts（中文键保留）。"""
    if df is None:
        return []
    try:
        if df.empty:
            return []
    except Exception:
        pass
    return _safe(df.to_dict('records'))


def _compact_date(v):
    """'YYYY-MM-DD' / 'YYYYMMDD' / '' -> 'YYYYMMDD'（akshare 用紧凑日期）。"""
    s = str(v or '').replace('-', '').strip()
    return s if len(s) == 8 else ''


def _err(msg, code=500):
    return jsonify({'code': code, 'msg': msg, 'data': None}), code


def _ok(data, msg='成功'):
    return jsonify({'code': 200, 'msg': msg, 'data': _safe(data)})


# ---- 健康检查 ----

@app.route('/health')
def health():
    if ak is None:
        return jsonify({'ok': False, 'akshare': None, 'error': AK_IMPORT_ERR})
    return jsonify({'ok': True, 'akshare': AK_VERSION})


# ---- 个股日K/周K/月K ----

@app.route('/kline')
def kline():
    if ak is None:
        return _err('akshare 不可用: ' + (AK_IMPORT_ERR or ''), 503)
    symbol = request.args.get('symbol', '').strip()
    period = request.args.get('period', 'daily')
    start_date = _compact_date(request.args.get('start_date', ''))
    end_date = _compact_date(request.args.get('end_date', ''))
    adjust = request.args.get('adjust', 'qfq')
    if not symbol:
        return _err('symbol 不能为空', 400)
    # 主路径：stock_zh_a_hist（东财 push2his，中文键直出）
    try:
        df = ak.stock_zh_a_hist(symbol=symbol, period=period, start_date=start_date, end_date=end_date, adjust=adjust)
        rows = _records(df)
        if rows:
            return _ok(rows)
    except Exception as e:
        traceback.print_exc()
        print(f'[aktools-server] stock_zh_a_hist 失败({e})，回退 stock_zh_a_daily(新浪)')
    # 兜底：stock_zh_a_daily（新浪源，英文列）→ 映射中文键 + 自算涨跌额/涨跌幅/振幅
    # 仅日K（新浪无周/月）；symbol 需带交易所前缀 sh/sz/bj
    if period in ('daily', 'day', None, ''):
        try:
            import re as _re
            prefix = 'bj' if _re.match(r'^(43|83|87|88|92)', symbol) else ('sh' if symbol.startswith('6') else 'sz')
            df2 = ak.stock_zh_a_daily(symbol=prefix + symbol, start_date=start_date, end_date=end_date, adjust=adjust)
            rows = _daily_to_cjkline(df2, symbol)
            if rows:
                return _ok(rows)
        except Exception as e:
            traceback.print_exc()
            return _err(f'akshare kline 兜底失败: {e}')
    return _ok([])


def _daily_to_cjkline(df, symbol):
    """stock_zh_a_daily(新浪) 英文列 → 中文键对象数组（与东财 stock_zh_a_hist 同构）。
    turnover(比率) → 换手率(%) ×100；涨跌额/涨跌幅/振幅由前收推导。"""
    if df is None or df.empty:
        return []
    import pandas as pd
    out = []
    prev_close = None
    for _, r in df.iterrows():
        d = r.get('date')
        day = d.strftime('%Y-%m-%d') if hasattr(d, 'strftime') else str(d)
        close = float(r['close']) if pd.notna(r['close']) else None
        open_ = float(r['open']) if pd.notna(r['open']) else None
        high = float(r['high']) if pd.notna(r['high']) else None
        low = float(r['low']) if pd.notna(r['low']) else None
        chg = None if (prev_close is None or close is None) else round(close - prev_close, 2)
        out.append({
            '日期': day, '股票代码': symbol,
            '开盘': open_, '收盘': close, '最高': high, '最低': low,
            '成交量': float(r['volume']) if pd.notna(r['volume']) else None,
            '成交额': float(r['amount']) if pd.notna(r['amount']) else None,
            '振幅': None if (prev_close is None or prev_close == 0) else round((high - low) / prev_close * 100, 2),
            '涨跌幅': None if (chg is None or prev_close == 0) else round(chg / prev_close * 100, 2),
            '涨跌额': chg,
            '换手率': round(float(r['turnover']) * 100, 4) if pd.notna(r.get('turnover')) else None,
        })
        if close is not None:
            prev_close = close
    return out


# ---- 全市场快照 ----

@app.route('/spot')
def spot():
    if ak is None:
        return _err('akshare 不可用', 503)
    try:
        df = ak.stock_zh_a_spot_em()
        return _ok(_records(df))
    except Exception as e:
        traceback.print_exc()
        return _err(f'akshare spot 失败: {e}')


# ---- 指数日K ----

@app.route('/index_daily')
def index_daily():
    if ak is None:
        return _err('akshare 不可用', 503)
    symbol = request.args.get('symbol', '').strip()
    start_date = _compact_date(request.args.get('start_date', ''))
    end_date = _compact_date(request.args.get('end_date', ''))
    if not symbol:
        return _err('symbol 不能为空', 400)
    try:
        # index_zh_a_hist 支持区间 + period；股票代码式指数（000001/399001）
        df = ak.index_zh_a_hist(symbol=symbol, period='daily', start_date=start_date, end_date=end_date)
        return _ok(_records(df))
    except Exception as e:
        traceback.print_exc()
        return _err(f'akshare index_daily 失败: {e}')


# ---- 涨停池 ----

@app.route('/limit_pool')
def limit_pool():
    if ak is None:
        return _err('akshare 不可用', 503)
    date = _compact_date(request.args.get('date', ''))
    if not date:
        return _err('date 不能为空', 400)
    try:
        df = ak.stock_zt_pool_em(date=date)
        return _ok(_records(df))
    except Exception as e:
        traceback.print_exc()
        return _err(f'akshare limit_pool 失败: {e}')


# ---- 跌停池 ----

@app.route('/drop_pool')
def drop_pool():
    if ak is None:
        return _err('akshare 不可用', 503)
    date = _compact_date(request.args.get('date', ''))
    if not date:
        return _err('date 不能为空', 400)
    try:
        df = ak.stock_zt_pool_dtgc_em(date=date)
        return _ok(_records(df))
    except Exception as e:
        traceback.print_exc()
        return _err(f'akshare drop_pool 失败: {e}')


# ---- 昨日涨停 ----

@app.route('/zt_prev')
def zt_prev():
    if ak is None:
        return _err('akshare 不可用', 503)
    date = _compact_date(request.args.get('date', ''))
    if not date:
        return _err('date 不能为空', 400)
    try:
        df = ak.stock_zt_pool_previous_em(date=date)
        return _ok(_records(df))
    except Exception as e:
        traceback.print_exc()
        return _err(f'akshare zt_prev 失败: {e}')


# ---- 行业板块 ----

@app.route('/industry')
def industry():
    if ak is None:
        return _err('akshare 不可用', 503)
    try:
        df = ak.stock_board_industry_summary_ths()
        return _ok(_records(df))
    except Exception as e:
        traceback.print_exc()
        return _err(f'akshare industry 失败: {e}')


# ---- 个股信息 ----

@app.route('/info')
def info():
    if ak is None:
        return _err('akshare 不可用', 503)
    symbol = request.args.get('symbol', '').strip()
    if not symbol:
        return _err('symbol 不能为空', 400)
    try:
        # stock_individual_info_em 返回 2 列 DataFrame(item,value)，reshape 为 [{item,value}]
        df = ak.stock_individual_info_em(symbol=symbol)
        records = []
        if df is not None and not df.empty:
            cols = list(df.columns)
            for _, row in df.iterrows():
                records.append({'item': str(row[cols[0]]), 'value': row[cols[1]] if len(cols) > 1 else None})
        return _ok(_safe(records))
    except Exception as e:
        traceback.print_exc()
        return _err(f'akshare info 失败: {e}')


# ---- 股票元数据批量（上市日，沪/深/北交所全量一次） ----

@app.route('/stock_meta_batch')
def stock_meta_batch():
    """合并沪/深/北交所 stock_info_*_name_code，返回 [{code, name, list_date, delist_date}]。
    akshare 各交易所函数列名略有差异（上交所 list_date、深交所 上市日期、北交所 上市日期），
    统一映射为 list_date；含退市股则标 delist_date。"""
    if ak is None:
        return _err('akshare 不可用', 503)
    out = []
    for fn_name in ('stock_info_sh_name_code', 'stock_info_sz_name_code', 'stock_info_bj_name_code'):
        try:
            fn = getattr(ak, fn_name)
            df = fn()
            if df is None or df.empty:
                continue
            cols = {str(c): c for c in df.columns}
            # 列名兼容各交易所：上交所 证券代码/证券简称/上市日期；深/北交所 代码/名称/上市日期
            code_col = cols.get('证券代码') or cols.get('代码') or cols.get('code') or cols.get('symbol')
            name_col = cols.get('证券简称') or cols.get('名称') or cols.get('name')
            ld_col = cols.get('上市日期') or cols.get('list_date')
            dd_col = cols.get('退市日期') or cols.get('delist_date')
            if not code_col:
                continue
            for _, r in df.iterrows():
                code = str(r[code_col]).strip()
                if not code or len(code) != 6:
                    continue
                out.append({
                    'code': code,
                    'name': str(r[name_col]).strip() if name_col and pd_notna(r.get(name_col)) else None,
                    'list_date': _fmt_day(r[ld_col]) if ld_col and pd_notna(r.get(ld_col)) else None,
                    'delist_date': _fmt_day(r[dd_col]) if dd_col and pd_notna(r.get(dd_col)) else None,
                })
        except Exception as e:
            traceback.print_exc()
            print(f'[aktools-server] {fn_name} 失败: {e}')
    if not out:
        return _err('akshare stock_meta_batch 各交易所均返回空')
    return _ok(out)


def pd_notna(v):
    """pandas 标量非空判定（容忍 None/NaN/NaT）。"""
    try:
        import pandas as pd
        return v is not None and not pd.isna(v)
    except Exception:
        return v is not None


def _fmt_day(v):
    """日期归一化为 'YYYY-MM-DD'：兼容 datetime.date/datetime/timestamp/'YYYYMMDD'/'YYYY-MM-DD'。"""
    if v is None:
        return None
    try:
        import pandas as pd
        if isinstance(v, (pd.Timestamp,)) and not pd.isna(v):
            return v.strftime('%Y-%m-%d')
    except Exception:
        pass
    s = str(v).strip()
    import re as _re
    d = _re.sub(r'\D', '', s)
    if len(d) == 8:
        return f'{d[:4]}-{d[4:6]}-{d[6:8]}'
    return s if s else None


# ---- 定期财报（三大表 + 财务指标合并，按报告期对齐） ----

def _pick_col(df, candidates):
    """在 df 列名中找首个含任一候选关键字的列（容错 akshare 各源列名差异）。
    新浪财报列名常带尾随控制字符（如 '报告\\x03'），匹配前先剥离控制字符。
    候选按优先级顺序：先全列扫第一个候选，无命中再扫第二个——避免短候选（如'所有者权益'）
    抢先匹配到带控制字符的中间列（如'所有者权益\\x03'=NaN），漏掉更精确的目标列。"""
    for c in candidates:
        for col in df.columns:
            cs = __import__('re').sub(r'[\x00-\x1f\x7f]', '', str(col))
            if c in cs:
                return col
    return None


def _num(v):
    """转 float，非有限数（含字符串'--'/空）返回 None。"""
    if v is None:
        return None
    try:
        import pandas as pd
        if pd.isna(v):
            return None
    except Exception:
        pass
    try:
        f = float(str(v).replace(',', '').replace('--', '').strip())
        import math
        return f if math.isfinite(f) else None
    except Exception:
        return None


@app.route('/financial')
def financial():
    """合并新浪三大财报表 + 财务指标，按报告期对齐返回最近 N 季。
    参数：symbol（纯数字如 600519）、n（季数，默认 8）。"""
    if ak is None:
        return _err('akshare 不可用', 503)
    symbol = request.args.get('symbol', '').strip()
    n = int(request.args.get('n', '8') or 8)
    if not symbol:
        return _err('symbol 不能为空', 400)
    # 新浪财报需带交易所前缀
    import re as _re
    prefix = 'bj' if _re.match(r'^(43|83|87|88|92)', symbol) else ('sh' if symbol.startswith('6') else 'sz')
    sina_stock = prefix + symbol

    try:
        bs = ak.stock_financial_report_sina(stock=sina_stock, symbol='资产负债表')
        ic = ak.stock_financial_report_sina(stock=sina_stock, symbol='利润表')
        cf = ak.stock_financial_report_sina(stock=sina_stock, symbol='现金流量表')
    except Exception as e:
        traceback.print_exc()
        return _err(f'akshare 三大表失败: {e}')
    # 财务指标（ROE/ROA/毛利率/资产负债率），新浪源，best-effort
    fi = None
    try:
        start_y = str(2024 - n // 4 - 1)
        fi = ak.stock_financial_analysis_indicator(symbol=symbol, start_year=start_y)
    except Exception as e:
        print(f'[aktools-server] 财务指标失败(降级为空): {e}')

    # 各表报告期列名与字段列
    def build_map(df, date_candidates, field_map):
        """df -> {report_date_normalized: {field_key: value}}"""
        if df is None or df.empty:
            return {}
        dcol = _pick_col(df, date_candidates)
        if not dcol:
            return {}
        m = {}
        for _, r in df.iterrows():
            day = _fmt_day(r[dcol])
            if not day:
                continue
            row = {}
            for fkey, cols in field_map.items():
                col = _pick_col(df, cols)
                row[fkey] = _num(r[col]) if col else None
            m[day] = row
        return m

    bs_m = build_map(bs, ['报告'], {
        'total_assets': ['资产总计'],
        'net_assets': ['归属于母公司股东权益合计', '所有者权益合计', '股东权益合计', '所有者权益', '股东权益'],
        'total_liabilities': ['负债合计'],
    })
    ic_m = build_map(ic, ['报告'], {
        'revenue': ['营业收入', '营业总收入'],
        'net_profit': ['净利润'],
        'operating_cost': ['营业成本'],   # 派生毛利率用
    })
    cf_m = build_map(cf, ['报告'], {
        'operating_cashflow': ['经营活动产生的现金流量净额', '经营活动现金流量净额'],
    })
    fi_m = build_map(fi, ['日期'], {
        'gross_margin': ['销售毛利率', '毛利率'],
        'roe': ['净资产收益率', '加权净资产收益率'],
        'roa': ['总资产报酬率', '总资产净利率', '总资产净利润率'],
        'debt_ratio': ['资产负债率'],
        # 扣非净利润：IC 无此列，FI 有 '扣除非经常性损益后的净利润(元)'
        'net_profit_excl_nonrec': ['扣除非经常性损益后的净利润', '扣非净利润', '扣非'],
    })

    # 合并：以并集报告期对齐，取最近 N 季（按日期降序）
    all_dates = sorted(set(list(bs_m) + list(ic_m) + list(cf_m) + list(fi_m)), reverse=True)[:n]
    out = []
    for day in all_dates:
        b = bs_m.get(day, {})
        i = ic_m.get(day, {})
        c = cf_m.get(day, {})
        f = fi_m.get(day, {})
        # 资产负债率：优先 FI，否则派生 负债/总资产
        debt = f.get('debt_ratio')
        if debt is None and b.get('total_assets') and b.get('total_liabilities') and b['total_assets'] != 0:
            debt = round(b['total_liabilities'] / b['total_assets'] * 100, 2)
        # 毛利率：FI 优先，否则派生 (营收-营业成本)/营收
        gm = f.get('gross_margin')
        if gm is None and i.get('revenue') and i.get('operating_cost') is not None and i['revenue'] != 0:
            gm = round((i['revenue'] - i['operating_cost']) / i['revenue'] * 100, 2)
        out.append({
            'code': symbol, 'report_date': day,
            'revenue': i.get('revenue'),
            'net_profit': i.get('net_profit'),
            'net_profit_excl_nonrec': f.get('net_profit_excl_nonrec'),
            'total_assets': b.get('total_assets'),
            'net_assets': b.get('net_assets'),
            'debt_ratio': debt,
            'operating_cashflow': c.get('operating_cashflow'),
            'gross_margin': gm,
            'roe': f.get('roe'),
            'roa': f.get('roa'),
        })
    out.sort(key=lambda x: x['report_date'], reverse=True)
    return _ok(out)


# ---- 个股分时 ----

@app.route('/minute')
def minute():
    if ak is None:
        return _err('akshare 不可用', 503)
    symbol = request.args.get('symbol', '').strip()
    period = request.args.get('period', '5')
    start_date = _compact_date(request.args.get('start_date', ''))
    end_date = _compact_date(request.args.get('end_date', ''))
    if not symbol:
        return _err('symbol 不能为空', 400)
    try:
        df = ak.stock_zh_a_hist_min_em(symbol=symbol, period=str(period), start_date=start_date, end_date=end_date)
        return _ok(_records(df))
    except Exception as e:
        traceback.print_exc()
        return _err(f'akshare minute 失败: {e}')


# ---- 衍生估值指标（百度估值，5 指标各取最新） ----

@app.route('/indicator')
def indicator():
    """PE(TTM)/PB/PS/PCF/股息率 快照——逐指标调百度估值，取最新值。
    百度估值每指标返回 date+value 历史序列，取末行即最新。"""
    if ak is None:
        return _err('akshare 不可用', 503)
    symbol = request.args.get('symbol', '').strip()
    if not symbol:
        return _err('symbol 不能为空', 400)
    out = {'code': symbol, 'trade_date': None,
           'pe_ttm': None, 'pb': None, 'ps': None, 'pcf': None, 'dividend_yield': None}
    # 指标名 → 输出键（百度估值的 indicator 参数值）
    specs = [
        ('市盈率(TTM)', 'pe_ttm'),
        ('市净率', 'pb'),
        ('市销率', 'ps'),
        ('市现率', 'pcf'),
        ('股息率', 'dividend_yield'),
    ]
    latest_date = None
    for ind_name, key in specs:
        try:
            df = ak.stock_zh_valuation_baidu(symbol=symbol, indicator=ind_name, period='近一年')
            if df is None or df.empty:
                continue
            row = df.tail(1).iloc[0]
            out[key] = _num(row['value']) if 'value' in df.columns else None
            d = _fmt_day(row['date']) if 'date' in df.columns else None
            if d and (latest_date is None or d > latest_date):
                latest_date = d
        except Exception as e:
            print(f'[aktools-server] {ind_name} 失败: {str(e)[:80]}')
    out['trade_date'] = latest_date
    return _ok(out)


# ---- 行业板块列表 + 成分股（新浪源，无东财依赖） ----

@app.route('/board_list')
def board_list():
    """新浪行业板块列表（49个），返回 [{label, 板块, 公司家数, 涨跌幅, 总成交额, 领涨股...}]。
    label 为板块标识（如 new_blhy），供 /board_cons 查成分股用。"""
    if ak is None:
        return _err('akshare 不可用', 503)
    try:
        df = ak.stock_sector_spot(indicator='新浪行业')
        return _ok(_records(df))
    except Exception as e:
        traceback.print_exc()
        return _err(f'akshare board_list 失败: {e}')


@app.route('/board_cons')
def board_cons():
    """新浪行业板块成分股，参数 label（来自 /board_list 的 label，如 new_blhy）。
    返回中文键对象数组（代码/名称/最新价/涨跌幅/PE/PB/总市值/流通市值/换手率）。"""
    if ak is None:
        return _err('akshare 不可用', 503)
    label = request.args.get('label', '').strip()
    if not label:
        return _err('label 不能为空', 400)
    try:
        df = ak.stock_sector_detail(sector=label)
        if df is None or df.empty:
            return _ok([])
        import pandas as pd
        out = []
        for _, r in df.iterrows():
            out.append({
                '代码': str(r.get('code', '')).strip() if pd.notna(r.get('code')) else None,
                '名称': str(r.get('name', '')).strip() if pd.notna(r.get('name')) else None,
                '最新价': _num(r.get('trade')),
                '涨跌额': _num(r.get('pricechange')),
                '涨跌幅': _num(r.get('changepercent')),
                '今开': _num(r.get('open')),
                '最高': _num(r.get('high')),
                '最低': _num(r.get('low')),
                '成交量': _num(r.get('volume')),
                '成交额': _num(r.get('amount')),
                '市盈率': _num(r.get('per')),
                '市净率': _num(r.get('pb')),
                # 新浪 mktcap/nmc 单位为万元，转成元
                '总市值': (lambda v: _num(v) * 10000 if _num(v) is not None else None)(r.get('mktcap')),
                '流通市值': (lambda v: _num(v) * 10000 if _num(v) is not None else None)(r.get('nmc')),
                '换手率': _num(r.get('turnoverratio')),
            })
        return _ok(out)
    except Exception as e:
        traceback.print_exc()
        return _err(f'akshare board_cons 失败: {e}')


# ---- 个股分时 (旧) ----


# ---- 通达信 tqs 端点（免客户端，Key 鉴权）----

@app.route('/tdxs_health')
def tdxs_health():
    if not TQS_OK:
        return _err('tdxaidata 未安装', 503)
    try:
        r = _tqs.get_market_data(stock_list=['600519.SH'], count=1, period='1d')
        ok = isinstance(r, dict) and 'Close' in r
        if ok:
            cdf = r['Close']
            ok = hasattr(cdf, 'index') and len(cdf.index) > 0
        return _ok({'ok': ok})
    except Exception as e:
        return _ok({'ok': False, 'error': str(e)[:120]})


@app.route('/tdxs_kline')
def tdxs_kline():
    """K线（日/周/月/分钟）+ 指数日K（传指数代码如 000001 + is_index=1）。"""
    if not TQS_OK:
        return _err('tdxaidata 未安装或 Key 未配置', 503)
    symbol = request.args.get('symbol', '').strip()
    period = request.args.get('period', 'daily')
    count = int(request.args.get('count', '320') or 320)
    adjust = request.args.get('adjust', 'none')
    sd = _compact_date(request.args.get('start_date', ''))
    ed = _compact_date(request.args.get('end_date', ''))
    is_index = request.args.get('is_index', '0') == '1'
    if not symbol:
        return _err('symbol 不能为空', 400)
    code = _tqs_index_code(symbol) if is_index else _tqs_code(symbol)
    dt = 'front' if adjust == 'qfq' else ('back' if adjust == 'hfq' else 'none')
    try:
        kw = dict(stock_list=[code], period=_tqs_period(period), dividend_type=dt)
        if sd and ed:
            kw['start_time'] = sd
            kw['end_time'] = ed
        else:
            kw['count'] = count
        r = _tqs.get_market_data(**kw)
        records = _tqs_kline_records(r, symbol)
        if sd and ed and len(records) > 50:
            records = [x for x in records if sd <= x['日期'].replace('-', '') <= ed]
        return _ok(records)
    except Exception as e:
        traceback.print_exc()
        return _err(f'tqs kline 失败: {e}')


@app.route('/tdxs_snapshot')
def tdxs_snapshot():
    """实时快照（逐股/批量）。codes=600519,000001"""
    if not TQS_OK:
        return _err('tdxaidata 未配置', 503)
    raw = request.args.get('codes', '').strip()
    if not raw:
        return _err('codes 不能为空', 400)
    codes = [_tqs_code(c.strip()) for c in raw.split(',') if c.strip()]
    try:
        r = _tqs.get_market_snapshot_batch(stock_list=codes)
        box = _safe(r)
        names = _stock_name_map()
        out = []
        if isinstance(box, dict):
            for i, c in enumerate(codes):
                rec = box.get(c) or box.get(c.split('.')[0])
                if isinstance(rec, dict):
                    out.append(_map_snapshot(rec, i, names.get(c, ''), code=c))
        elif isinstance(box, list):
            for i, rec in enumerate(box):
                if isinstance(rec, dict):
                    c = rec.get('stock_code') or rec.get('code') or (codes[i] if i < len(codes) else '')
                    out.append(_map_snapshot(rec, i, names.get(c, ''), code=c))
        return _ok(out)
    except Exception as e:
        traceback.print_exc()
        return _err(f'tqs snapshot 失败: {e}')


@app.route('/tdxs_sectors')
def tdxs_sectors():
    """行业板块列表。"""
    if not TQS_OK:
        return _err('tdxaidata 未配置', 503)
    try:
        r = _tqs.get_sector_list(list_type=0)
        return _ok(_safe(r))
    except Exception as e:
        traceback.print_exc()
        return _err(f'tqs sectors 失败: {e}')


@app.route('/tdxs_sector_cons')
def tdxs_sector_cons():
    """板块成分股。sector=板块代码或名称"""
    if not TQS_OK:
        return _err('tdxaidata 未配置', 503)
    sector = request.args.get('sector', '').strip()
    if not sector:
        return _err('sector 不能为空', 400)
    try:
        r = _tqs.get_stock_list_in_sector(block_code=sector)
        return _ok(_safe(r))
    except Exception as e:
        traceback.print_exc()
        return _err(f'tqs sector_cons 失败: {e}')


@app.route('/tdxs_zdt')
def tdxs_zdt():
    """涨跌停数据。可选 date=YYYYMMDD 拉历史（用于昨日涨停池）。"""
    if not TQS_OK:
        return _err('tdxaidata 未配置', 503)
    date = request.args.get('date', '').strip()
    try:
        kw = {}
        if date:
            kw['date'] = _compact_date(date)
        r = _tqs.get_zdt_data(**kw)
        return _ok(_safe(r))
    except Exception as e:
        traceback.print_exc()
        # 带日期失败时降级为无日期重试（tqs 可能不支持历史 date 参数）
        if date:
            try:
                r = _tqs.get_zdt_data()
                return _ok(_safe(r))
            except Exception as e2:
                return _err(f'tqs zdt 失败(降级也失败): {e2}')
        return _err(f'tqs zdt 失败: {e}')


@app.route('/tdxs_financial')
def tdxs_financial():
    """财务数据。symbol=600519"""
    if not TQS_OK:
        return _err('tdxaidata 未配置', 503)
    symbol = request.args.get('symbol', '').strip()
    if not symbol:
        return _err('symbol 不能为空', 400)
    code = _tqs_code(symbol)
    try:
        r = _tqs.get_financial_data(stock_list=[code])
        return _ok(_safe(r))
    except Exception as e:
        traceback.print_exc()
        return _err(f'tqs financial 失败: {e}')


@app.route('/tdxs_info')
def tdxs_info():
    """个股基础信息。symbol=600519"""
    if not TQS_OK:
        return _err('tdxaidata 未配置', 503)
    symbol = request.args.get('symbol', '').strip()
    if not symbol:
        return _err('symbol 不能为空', 400)
    code = _tqs_code(symbol)
    try:
        r = _tqs.get_stock_info(stock_code=code)
        return _ok(_safe(r))
    except Exception as e:
        traceback.print_exc()
        return _err(f'tqs info 失败: {e}')


# ---- 指数实时快照 / 全市场快照 ----

# 指数系列 → 预定义指数代码列表（与 aktools.js INDEX_FALLBACK_SECIDS 对齐）
_INDEX_SERIES = {
    '沪深重要指数': ['000001.SH', '000300.SH', '000016.SH', '000688.SH', '000905.SH',
                   '399001.SZ', '399006.SZ', '399005.SZ', '399106.SZ'],
    '上证系列指数': ['000001.SH', '000002.SH', '000003.SH', '000016.SH', '000300.SH',
                   '000688.SH', '000905.SH', '000852.SH'],
    '深证系列指数': ['399001.SZ', '399002.SZ', '399003.SZ', '399005.SZ', '399006.SZ',
                   '399106.SZ', '399673.SZ'],
    '中证系列指数': ['000300.SH', '000905.SH', '000852.SH', '000016.SH'],
}

# 指数代码 → 中文名称（快照可能不带名称，需补充）
_INDEX_NAMES = {
    '000001.SH': '上证指数', '000002.SH': '上证A股', '000003.SH': '上证B股',
    '000016.SH': '上证50', '000300.SH': '沪深300', '000688.SH': '科创50',
    '000852.SH': '中证1000', '000905.SH': '中证500',
    '399001.SZ': '深证成指', '399002.SZ': '深证A指', '399003.SZ': '深证B指',
    '399005.SZ': '中小板指', '399006.SZ': '创业板指', '399106.SZ': '深证100',
    '399673.SZ': '创业板50',
}


def _map_snapshot(r, idx=0, fallback_name='', code=None):
    """tqs 快照记录 → 东财同构中文键（与 aktools.js mapSpotItem 对齐）。

    修正（2026-10-20）：tqs 返回的键是首字母大写（Now/LastClose/Open/Max/Min/
    Volume/Amount/Zangsu），旧实现按小写键取值导致全市场映射全为空。
    Amount 单位为万元 → ×10000 转元；涨跌额/涨跌幅/振幅由昨收推导。
    """
    raw_code = code or r.get('stock_code') or r.get('code') or r.get('symbol') or ''
    code = re.sub(r'\.\w+$', '', str(raw_code))
    name = r.get('stock_name') or r.get('name') or r.get('Name') or fallback_name
    price = r.get('Now', r.get('last_price', r.get('close')))
    pre_close = r.get('LastClose', r.get('pre_close', r.get('settlement')))
    open_ = r.get('Open', r.get('open'))
    high = r.get('Max', r.get('high'))
    low = r.get('Min', r.get('low'))
    vol = r.get('Volume', r.get('volume', r.get('vol')))
    amt = r.get('Amount', r.get('amount', r.get('turnover')))
    amt = _n(amt)
    if amt is not None:
        amt = amt * 10000  # tqs Amount 单位万元 → 元
    price_n = _n(price)
    pre_n = _n(pre_close)
    chg = None
    if price_n is not None and pre_n:
        chg = round(price_n - pre_n, 2)
    pct = None
    if chg is not None and pre_n:
        pct = round(chg / pre_n * 100, 2)
    amp = None
    high_n, low_n = _n(high), _n(low)
    if high_n is not None and low_n is not None and pre_n:
        amp = round((high_n - low_n) / pre_n * 100, 2)
    return {
        '序号': idx + 1, '代码': code, '名称': name or code,
        '最新价': price_n, '涨跌幅': pct, '涨跌额': chg,
        '成交量': _n(vol), '成交额': amt,
        '振幅': amp, '最高': high_n, '最低': low_n, '今开': _n(open_),
        '昨收': pre_n, '量比': None, '换手率': None,
        '涨速': _n(r.get('Zangsu'))
    }


# ---- tqs 全市场代码池 / 名称缓存（全市场快照的映射依赖名称，分批取名称很贵） ----
_STOCK_CACHE = {'at': 0.0, 'codes': None, 'names': None}
_STOCK_CACHE_LOCK = threading.RLock()
_STOCK_CACHE_TTL = 6 * 3600  # 6h：盘中代码池/名称基本不变


def _all_stock_codes():
    """全市场 A 股代码（tqs.get_stock_list(market='5')，含北交所）。带 6h 缓存。"""
    now = time.time()
    with _STOCK_CACHE_LOCK:
        if _STOCK_CACHE['codes'] and now - _STOCK_CACHE['at'] < _STOCK_CACHE_TTL:
            return list(_STOCK_CACHE['codes'])
    codes = []
    try:
        r = _tqs.get_stock_list(market='5')
        if isinstance(r, list):
            codes = [str(x).strip() for x in r if x]
        elif isinstance(r, dict):
            codes = [str(k).strip() for k in r.keys() if k]
    except Exception as e:
        print(f'[tdxs] get_stock_list 失败: {str(e)[:100]}')
    if not codes:
        # 兼容旧板块接口（不同 tqs 版本支持的板块名不同）
        for sector_name in ('沪深A股', '全部A股', 'A股'):
            try:
                r = _tqs.get_stock_list_in_sector(block_code=sector_name)
                if isinstance(r, list) and r:
                    codes = [str(x).strip() for x in r if x]
                    break
            except Exception:
                continue
    codes = [c for c in codes if re.match(r'^\d{6}(\.\w+)?$', c)]
    with _STOCK_CACHE_LOCK:
        _STOCK_CACHE['codes'] = codes
        _STOCK_CACHE['at'] = now
    return list(codes)


def _stock_name_map():
    """代码 → 名称（get_stock_info_batch 分块并发，全市场约 1~3s）。带 6h 缓存。"""
    now = time.time()
    with _STOCK_CACHE_LOCK:
        if _STOCK_CACHE['names'] is not None and now - _STOCK_CACHE['at'] < _STOCK_CACHE_TTL:
            return dict(_STOCK_CACHE['names'])
    codes = _all_stock_codes()
    names = {}
    if codes:
        chunks = [codes[i:i + 1000] for i in range(0, len(codes), 1000)]

        def fetch(chunk):
            try:
                r = _tqs.get_stock_info_batch(stock_list=chunk)
                if isinstance(r, dict):
                    for c, v in r.items():
                        nm = v.get('Name') if isinstance(v, dict) else None
                        if nm:
                            names[c] = nm
            except Exception as e:
                print(f'[tdxs] 名称批次失败: {str(e)[:80]}')

        try:
            with ThreadPoolExecutor(max_workers=6) as pool:
                list(pool.map(fetch, chunks))
        except Exception as e:
            print(f'[tdxs] 名称池失败: {str(e)[:80]}')
    with _STOCK_CACHE_LOCK:
        _STOCK_CACHE['names'] = names
        _STOCK_CACHE['at'] = now
    return dict(names)


def _n(v):
    """安全转 float，失败返回 None。"""
    if v is None:
        return None
    try:
        f = float(v)
        return f if not math.isnan(f) else None
    except (TypeError, ValueError):
        return None


@app.route('/tdxs_index_spot')
def tdxs_index_spot():
    """指数实时快照。series=沪深重要指数（默认）。
    tqs 的 get_market_snapshot_batch 不支持指数代码，改用 get_market_data(count=1)
    取最新一根 K 线作为快照（休市时返回上个交易日数据）。"""
    if not TQS_OK:
        return _err('tdxaidata 未配置', 503)
    series = request.args.get('series', '沪深重要指数').strip()
    codes = _INDEX_SERIES.get(series, _INDEX_SERIES['沪深重要指数'])
    try:
        out = []
        for i, c in enumerate(codes):
            try:
                # dividend_type='none' — 指数无除权概念；count=2 取最近两根以计算涨跌额/涨跌幅
                r = _tqs.get_market_data(stock_list=[c], count=2, period='1d', dividend_type='none')
                records = _tqs_kline_records(r, c.split('.')[0])
                if not records:
                    continue
                rec = records[-1]  # 最新一根
                name = _INDEX_NAMES.get(c, '')
                price = _n(rec.get('收盘'))
                chg = _n(rec.get('涨跌额'))
                pct = _n(rec.get('涨跌幅'))
                out.append({
                    '序号': i + 1, '代码': c.split('.')[0], '名称': name,
                    '最新价': price, '涨跌幅': pct, '涨跌额': chg,
                    '成交量': _n(rec.get('成交量')), '成交额': _n(rec.get('成交额')),
                    '振幅': _n(rec.get('振幅')), '最高': _n(rec.get('最高')),
                    '最低': _n(rec.get('最低')), '今开': _n(rec.get('开盘')),
                    '昨收': None, '量比': None, '换手率': None
                })
            except Exception as ex:
                # 单只指数失败不影响其余，但记录日志
                print(f'[tdxs_index_spot] {c} failed: {str(ex)[:80]}')
                continue
        return _ok(out)
    except Exception as e:
        traceback.print_exc()
        return _err(f'tqs index_spot 失败: {e}')


@app.route('/tdxs_market_spot')
def tdxs_market_spot():
    """全市场快照（沪深京 A 股，含北交所）。

    修正（2026-10-20）：旧实现用 get_stock_list_in_sector('沪深A股' 等) 取代码池，
    该接口在 tqs 上不存在/板块名无效 → 全市场恒为空；现改用 get_stock_list(market='5')
    （实测 5580 只，SH2318/SZ2908/BJ354）。
    批次 1000 只/6 并发（实测 6×1000 约 2.7s）；名称走 _stock_name_map 6h 缓存。
    冷调用约 5-10s（含名称首次拉取），路由层应缓存 60-300s。
    """
    if not TQS_OK:
        return _err('tdxaidata 未配置', 503)
    try:
        all_codes = _all_stock_codes()
        if not all_codes:
            return _ok([])
        names = _stock_name_map()
        results = {}

        def fetch_batch(start):
            chunk = all_codes[start:start + 1000]
            try:
                r = _tqs.get_market_snapshot_batch(stock_list=chunk)
                box = _safe(r)
                if isinstance(box, dict):
                    for c, rec in box.items():
                        if isinstance(rec, dict):
                            results[c] = rec
                elif isinstance(box, list):
                    for j, rec in enumerate(box):
                        if j < len(chunk) and isinstance(rec, dict):
                            results[chunk[j]] = rec
            except Exception as e:
                print(f'[tdxs_market_spot] 批次失败(start={start}): {str(e)[:80]}')

        starts = list(range(0, len(all_codes), 1000))
        with ThreadPoolExecutor(max_workers=6) as pool:
            list(pool.map(fetch_batch, starts))
        out = []
        for c in all_codes:
            rec = results.get(c) or results.get(c.split('.')[0])
            if rec and isinstance(rec, dict):
                out.append(_map_snapshot(rec, len(out), names.get(c, ''), code=c))
        return _ok(out)
    except Exception as e:
        traceback.print_exc()
        return _err(f'tqs market_spot 失败: {e}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='AKShare 行情桥接服务')
    parser.add_argument('--port', type=int, default=8889)
    parser.add_argument('--host', default='127.0.0.1')
    args = parser.parse_args()
    print(f'[aktools-server] listening on {args.host}:{args.port}, akshare={AK_VERSION}')
    # tqs 预热：后台触发首次调用（DLL加载+后端连接冷启动需数秒），避免首个 /tdxs_* 请求超时
    if TQS_OK:
        import threading
        def _warmup_tqs():
            try:
                _tqs.get_market_data(stock_list=['600519.SH'], count=1, period='1d')
                print('[aktools-server] tqs 预热完成')
            except Exception as e:
                print(f'[aktools-server] tqs 预热失败(降级): {str(e)[:80]}')
        threading.Thread(target=_warmup_tqs, daemon=True).start()
    app.run(host=args.host, port=args.port, debug=False, threaded=True)
