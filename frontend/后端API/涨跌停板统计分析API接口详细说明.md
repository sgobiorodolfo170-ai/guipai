# 涨跌停板统计分析 API 接口详细说明

## 目录
- [1. 基础统计接口](#1-基础统计接口)
- [2. 详细分析接口](#2-详细分析接口)
- [3. 质量分析接口](#3-质量分析接口)
- [4. 行业分析接口](#4-行业分析接口)
- [5. 反弹分析接口](#5-反弹分析接口)
- [6. 连板分析接口](#6-连板分析接口)
- [7. 情绪分析接口](#7-情绪分析接口)
- [8. 历史对比接口](#8-历史对比接口)
- [9. 管理接口](#9-管理接口)
- [10. 数据模型](#10-数据模型)

## 1. 基础统计接口

### 1.1 获取基础统计数据

**接口地址**: `GET /api/limit-board-statistics/basic/{date}`

**功能描述**: 获取指定日期的涨跌停板基础统计数据，包含涨停和跌停的综合统计信息。

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| date | LocalDate | 是 | 查询日期，格式：yyyy-MM-dd | 2025-01-15 |

**响应数据**: `BasicStatisticsResponse`

**字段说明**:
| 字段名 | 类型 | 描述 |
|--------|------|------|
| tradeDate | LocalDate | 交易日期 |
| limitUpCount | Integer | 涨停股数量 |
| limitUpOneWordCount | Integer | 涨停一字板数量 |
| limitUpBlastResealCount | Integer | 涨停炸板回封数 |
| limitUpMaxContinuous | Integer | 涨停最高连板数 |
| limitUpContinuousRate | BigDecimal | 涨停连板率 |
| limitUpTotalSealFunds | BigDecimal | 涨停总封单资金（亿元） |
| limitUpAvgSealFunds | BigDecimal | 涨停平均封单资金（万元） |
| limitDownCount | Integer | 跌停股数量 |
| limitDownOneWordCount | Integer | 跌停一字板数量 |
| limitDownOpenCount | Integer | 跌停开板数量 |
| limitDownMaxContinuous | Integer | 跌停最高连板数 |
| limitDownContinuousRate | BigDecimal | 跌停连板率 |
| limitDownTotalSealFunds | BigDecimal | 跌停总封单资金（亿元） |
| limitDownAvgSealFunds | BigDecimal | 跌停平均封单资金（万元） |
| limitUpDownRatio | BigDecimal | 涨跌停比 |
| totalMarketValue | BigDecimal | 涨跌停股总市值（亿元） |
| yesterdayLimitUpAvgIncrease | BigDecimal | 昨日涨停今日平均涨幅 |
| yesterdayLimitDownAvgIncrease | BigDecimal | 昨日跌停今日平均涨幅 |

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/basic/2025-01-15"
```

### 1.2 获取范围基础统计数据

**接口地址**: `GET /api/limit-board-statistics/basic/range`

**功能描述**: 获取指定日期范围内的涨跌停板基础统计数据列表。

**查询参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| startDate | LocalDate | 是 | 开始日期，格式：yyyy-MM-dd | 2025-01-01 |
| endDate | LocalDate | 是 | 结束日期，格式：yyyy-MM-dd | 2025-01-15 |

**响应数据**: `List<BasicStatisticsResponse>`

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/basic/range?startDate=2025-01-01&endDate=2025-01-15"
```

## 2. 详细分析接口

### 2.1 获取涨跌停板详细统计

**接口地址**: `GET /api/limit-board-statistics/detail/{date}`

**功能描述**: 获取指定日期和类型的涨跌停板详细统计数据，包含分布信息。

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| date | LocalDate | 是 | 查询日期，格式：yyyy-MM-dd | 2025-01-15 |

**查询参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| dataType | String | 是 | 数据类型：LIMIT_UP 或 LIMIT_DOWN | LIMIT_UP |

**响应数据**: `LimitBoardStatisticsResponse`

**字段说明**:
| 字段名 | 类型 | 描述 |
|--------|------|------|
| tradeDate | LocalDate | 交易日期 |
| dataType | String | 数据类型：LIMIT_UP/LIMIT_DOWN |
| dataTypeDesc | String | 数据类型描述：涨停板/跌停板 |
| totalCount | Integer | 总数量 |
| oneWordBoardCount | Integer | 一字板数量 |
| maxContinuousLimit | Integer | 最高连板数 |
| continuousLimitRate | BigDecimal | 连板率 |
| totalSealFunds | BigDecimal | 总封单资金（亿元） |
| avgSealFunds | BigDecimal | 平均封单资金（万元） |
| blastAndResealCount | Integer | 炸板回封数（仅涨停板） |
| openBoardCount | Integer | 开板数量（仅跌停板） |
| avgDynamicPe | BigDecimal | 平均动态市盈率（仅跌停板） |
| continuousDistribution | List | 连板分布 |
| timeDistribution | List | 时间分布 |
| industryDistribution | List | 行业分布 |
| peDistribution | List | 市盈率分布（仅跌停板） |

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/detail/2025-01-15?dataType=LIMIT_UP"
```

### 2.2 获取涨跌停对比分析

**接口地址**: `GET /api/limit-board-statistics/comparison/{date}`

**功能描述**: 获取指定日期的涨停板和跌停板对比分析数据。

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| date | LocalDate | 是 | 查询日期，格式：yyyy-MM-dd | 2025-01-15 |

**响应数据**: `LimitBoardComparisonResponse`

**字段说明**:
| 字段名 | 类型 | 描述 |
|--------|------|------|
| tradeDate | LocalDate | 交易日期 |
| limitUpCount | Integer | 涨停数量 |
| limitDownCount | Integer | 跌停数量 |
| limitUpDownRatio | BigDecimal | 涨跌停比 |
| limitUpTotalFunds | BigDecimal | 涨停总资金 |
| limitDownTotalFunds | BigDecimal | 跌停总资金 |
| fundFlowRatio | BigDecimal | 资金流向比 |
| limitUpOneWordRate | BigDecimal | 涨停一字板率 |
| limitDownOneWordRate | BigDecimal | 跌停一字板率 |
| limitUpContinuousRate | BigDecimal | 涨停连板率 |
| limitDownContinuousRate | BigDecimal | 跌停连板率 |
| industryComparisons | List | 行业涨跌停对比 |

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/comparison/2025-01-15"
```

## 3. 质量分析接口

### 3.1 获取涨跌停板质量分析

**接口地址**: `GET /api/limit-board-statistics/quality/{date}`

**功能描述**: 获取指定日期和类型的涨跌停板质量分析数据。

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| date | LocalDate | 是 | 查询日期，格式：yyyy-MM-dd | 2025-01-15 |

**查询参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| dataType | String | 是 | 数据类型：LIMIT_UP 或 LIMIT_DOWN | LIMIT_UP |

**响应数据**: `LimitBoardQualityResponse`

**字段说明**:
| 字段名 | 类型 | 描述 |
|--------|------|------|
| tradeDate | LocalDate | 交易日期 |
| dataType | String | 数据类型：LIMIT_UP/LIMIT_DOWN |
| dataTypeDesc | String | 数据类型描述：涨停板/跌停板 |
| oneWordBoardRate | BigDecimal | 一字板比例 |
| earlyLimitRate | BigDecimal | 早盘封板比例（10:30前） |
| noonLimitRate | BigDecimal | 午盘封板比例 |
| lateLimitRate | BigDecimal | 尾盘封板比例 |
| avgSealStrength | BigDecimal | 平均封单强度 |
| strongSealRate | BigDecimal | 强封单比例（>1000万） |
| blastCount | Integer | 炸板数量（仅涨停板） |
| resealCount | Integer | 回封数量（仅涨停板） |
| resealRate | BigDecimal | 回封率（仅涨停板） |
| avgBlastTimes | BigDecimal | 平均炸板次数（仅涨停板） |
| avgDynamicPe | BigDecimal | 平均动态市盈率（仅跌停板） |
| lowPeRate | BigDecimal | 低估值比例（仅跌停板） |
| openBoardCount | Integer | 开板数量（仅跌停板） |
| openBoardRate | BigDecimal | 开板率（仅跌停板） |
| avgOpenTimes | BigDecimal | 平均开板次数（仅跌停板） |
| sealStrengthDist | List | 封单强度分布 |
| peDistribution | List | 市盈率分布（仅跌停板） |

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/quality/2025-01-15?dataType=LIMIT_UP"
```

## 4. 行业分析接口

### 4.1 获取行业分布统计

**接口地址**: `GET /api/limit-board-statistics/industry/{date}`

**功能描述**: 获取指定日期和类型的行业涨跌停分布统计数据。

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| date | LocalDate | 是 | 查询日期，格式：yyyy-MM-dd | 2025-01-15 |

**查询参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| dataType | String | 否 | 数据类型：LIMIT_UP、LIMIT_DOWN 或 ALL，默认 LIMIT_UP | LIMIT_UP |

**响应数据**: `List<IndustryDistribution>`

**字段说明**:
| 字段名 | 类型 | 描述 |
|--------|------|------|
| industry | String | 行业名称 |
| count | Integer | 数量 |
| percentage | BigDecimal | 占比 |
| avgSealFunds | BigDecimal | 平均封单资金（万元） |
| avgMarketValue | BigDecimal | 平均市值（亿元） |
| rank | Integer | 排名 |

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/industry/2025-01-15?dataType=LIMIT_UP"
```

### 4.2 获取行业趋势分析

**接口地址**: `GET /api/limit-board-statistics/industry/trend/{date}`

**功能描述**: 获取指定日期的行业涨跌停趋势分析数据。

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| date | LocalDate | 是 | 查询日期，格式：yyyy-MM-dd | 2025-01-15 |

**响应数据**: `IndustryTrendResponse`

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/industry/trend/2025-01-15"
```

## 5. 反弹分析接口

### 5.1 获取跌停板反弹分析

**接口地址**: `GET /api/limit-board-statistics/rebound/{date}`

**功能描述**: 获取指定日期的跌停板次日反弹分析数据。

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| date | LocalDate | 是 | 查询日期，格式：yyyy-MM-dd | 2025-01-15 |

**响应数据**: `LimitDownReboundResponse`

**字段说明**:
| 字段名 | 类型 | 描述 |
|--------|------|------|
| tradeDate | LocalDate | 交易日期 |
| totalLimitDownCount | Integer | 跌停总数 |
| reboundCount | Integer | 次日反弹数量 |
| reboundRate | BigDecimal | 反弹率 |
| avgReboundIncrease | BigDecimal | 平均反弹幅度 |
| reboundByConsecutive | List | 按连跌停数分析 |
| reboundByIndustry | List | 按行业分析 |
| reboundByPe | List | 按市盈率分析 |

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/rebound/2025-01-15"
```

### 5.2 按连跌停数反弹分析

**接口地址**: `GET /api/limit-board-statistics/rebound/consecutive/{date}`

**功能描述**: 获取指定日期按不同连跌停数的反弹分析数据。

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/rebound/consecutive/2025-01-15"
```

### 5.3 按行业反弹分析

**接口地址**: `GET /api/limit-board-statistics/rebound/industry/{date}`

**功能描述**: 获取指定日期按不同行业的跌停板反弹分析数据。

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/rebound/industry/2025-01-15"
```

### 5.4 按市盈率反弹分析

**接口地址**: `GET /api/limit-board-statistics/rebound/pe/{date}`

**功能描述**: 获取指定日期按不同市盈率区间的跌停板反弹分析数据。

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/rebound/pe/2025-01-15"
```

## 6. 连板分析接口

### 6.1 获取连板成功率分析

**接口地址**: `GET /api/limit-board-statistics/continuous-success-rate`

**功能描述**: 获取指定日期范围内的连板成功率分析数据。

**查询参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| startDate | LocalDate | 是 | 开始日期，格式：yyyy-MM-dd | 2025-01-01 |
| endDate | LocalDate | 是 | 结束日期，格式：yyyy-MM-dd | 2025-01-15 |
| dataType | String | 是 | 数据类型：LIMIT_UP 或 LIMIT_DOWN | LIMIT_UP |

**响应数据**: `ContinuousLimitSuccessRateResponse`

**字段说明**:
| 字段名 | 类型 | 描述 |
|--------|------|------|
| startDate | LocalDate | 开始日期 |
| endDate | LocalDate | 结束日期 |
| dataType | String | 数据类型 |
| successRateList | List | 连板成功率列表 |

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/continuous-success-rate?startDate=2025-01-01&endDate=2025-01-15&dataType=LIMIT_UP"
```

## 7. 情绪分析接口

### 7.1 获取市场情绪指标

**接口地址**: `GET /api/limit-board-statistics/sentiment/{date}`

**功能描述**: 获取指定日期的市场情绪指标数据。

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| date | LocalDate | 是 | 查询日期，格式：yyyy-MM-dd | 2025-01-15 |

**响应数据**: `SentimentIndicatorResponse`

**字段说明**:
| 字段名 | 类型 | 描述 |
|--------|------|------|
| tradeDate | LocalDate | 交易日期 |
| limitUpDownRatio | BigDecimal | 涨跌停比 |
| continuousLimitRate | BigDecimal | 连板率 |
| blastRate | BigDecimal | 炸板率 |
| resealRate | BigDecimal | 回封率 |
| totalSealFunds | BigDecimal | 总封单资金 |
| avgSealFunds | BigDecimal | 平均封单资金 |
| largeSealRate | BigDecimal | 大单封板比例 |
| fundConcentration | BigDecimal | 资金集中度 |
| earlyLimitUpRate | BigDecimal | 早盘涨停比例 |
| lateLimitUpRate | BigDecimal | 尾盘涨停比例 |
| avgFirstLimitTime | BigDecimal | 平均首次封板时间 |
| sentimentScore | BigDecimal | 情绪综合评分（0-100） |
| sentimentLevel | String | 情绪等级 |

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/sentiment/2025-01-15"
```

### 7.2 获取市场情绪趋势

**接口地址**: `GET /api/limit-board-statistics/sentiment/trend`

**功能描述**: 获取指定日期范围内的市场情绪趋势数据。

**查询参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| startDate | LocalDate | 是 | 开始日期，格式：yyyy-MM-dd | 2025-01-01 |
| endDate | LocalDate | 是 | 结束日期，格式：yyyy-MM-dd | 2025-01-15 |

**响应数据**: `SentimentTrendResponse`

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/sentiment/trend?startDate=2025-01-01&endDate=2025-01-15"
```

## 8. 历史对比接口

### 8.1 获取历史对比分析

**接口地址**: `GET /api/limit-board-statistics/historical-compare/{targetDate}`

**功能描述**: 获取指定日期与历史数据的对比分析。

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| targetDate | LocalDate | 是 | 目标日期，格式：yyyy-MM-dd | 2025-01-15 |

**查询参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| days | Integer | 否 | 历史对比天数，默认30天，范围7-365 | 30 |

**响应数据**: `PercentileAnalysisResponse`

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/historical-compare/2025-01-15?days=30"
```

### 8.2 获取分位数分析

**接口地址**: `GET /api/limit-board-statistics/percentile/{targetDate}`

**功能描述**: 获取指定日期各项指标在历史数据中的分位数位置。

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| targetDate | LocalDate | 是 | 目标日期，格式：yyyy-MM-dd | 2025-01-15 |

**查询参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| days | Integer | 否 | 历史天数，默认60天，范围7-365 | 60 |

**响应数据**: `PercentileAnalysisResponse`

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/percentile/2025-01-15?days=60"
```

## 9. 管理接口

### 9.1 缓存管理

#### 刷新统计缓存
**接口地址**: `POST /api/limit-board-statistics/cache/refresh/{date}`

**功能描述**: 刷新指定日期的所有统计分析缓存数据。

**使用示例**:
```bash
curl -X POST "http://localhost:8080/api/limit-board-statistics/cache/refresh/2025-01-15"
```

#### 清除统计缓存
**接口地址**: `DELETE /api/limit-board-statistics/cache/clear/{date}`

**功能描述**: 清除指定日期的所有统计分析缓存数据。

**使用示例**:
```bash
curl -X DELETE "http://localhost:8080/api/limit-board-statistics/cache/clear/2025-01-15"
```

#### 预热统计缓存
**接口地址**: `POST /api/limit-board-statistics/cache/warmup`

**功能描述**: 预热指定日期范围内的统计分析缓存数据。

**查询参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| startDate | LocalDate | 是 | 开始日期，格式：yyyy-MM-dd | 2025-01-01 |
| endDate | LocalDate | 是 | 结束日期，格式：yyyy-MM-dd | 2025-01-15 |

**使用示例**:
```bash
curl -X POST "http://localhost:8080/api/limit-board-statistics/cache/warmup?startDate=2025-01-01&endDate=2025-01-15"
```

### 9.2 数据可用性检查

#### 检查数据可用性
**接口地址**: `GET /api/limit-board-statistics/data/availability/{date}`

**功能描述**: 检查指定日期的涨跌停板数据可用性。

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/data/availability/2025-01-15"
```

#### 获取最新数据日期
**接口地址**: `GET /api/limit-board-statistics/data/latest`

**功能描述**: 获取系统中最新的涨跌停板数据日期。

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/data/latest"
```

### 9.3 异常检测

#### 检测市场异常
**接口地址**: `GET /api/limit-board-statistics/anomaly/detect/{date}`

**功能描述**: 检测指定日期的市场异常情况。

**使用示例**:
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/anomaly/detect/2025-01-15"
```

## 10. 数据模型

### 10.1 通用响应格式

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": { ... }
}
```

### 10.2 错误响应格式

```json
{
  "code": 400,
  "msg": "参数错误：查询日期不能为空",
  "data": null
}
```

### 10.3 分布数据模型

#### 连板分布
```json
{
  "continuousLimit": 2,
  "count": 8,
  "percentage": 17.78,
  "avgSealFunds": 3567.89,
  "avgMarketValue": 67.89
}
```

#### 时间分布
```json
{
  "timeRange": "09:30-10:30",
  "timeDesc": "早盘",
  "count": 18,
  "percentage": 40.0
}
```

#### 行业分布
```json
{
  "industry": "电子信息",
  "count": 12,
  "percentage": 26.67,
  "avgSealFunds": 3456.78,
  "avgMarketValue": 56.78,
  "rank": 1
}
```

#### 市盈率分布
```json
{
  "peRange": "0-20",
  "count": 8,
  "percentage": 44.44
}
```

#### 封单强度分布
```json
{
  "range": "0-500万",
  "count": 15,
  "percentage": 33.33
}
```

### 10.4 反弹分析数据模型

#### 按连跌停数反弹
```json
{
  "consecutiveLimit": 1,
  "totalCount": 12,
  "reboundCount": 6,
  "reboundRate": 0.5
}
```

#### 按行业反弹
```json
{
  "industry": "医药生物",
  "totalCount": 5,
  "reboundCount": 3,
  "reboundRate": 0.6
}
```

#### 按市盈率反弹
```json
{
  "peRange": "0-20",
  "totalCount": 8,
  "reboundCount": 5,
  "reboundRate": 0.625
}
```

### 10.5 行业对比数据模型

```json
{
  "industry": "电子信息",
  "limitUpCount": 12,
  "limitDownCount": 3,
  "netRatio": 0.6
}
```