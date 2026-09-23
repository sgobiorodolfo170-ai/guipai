# 涨跌停板统计分析 API 使用指南

## 目录
- [1. 功能概述](#1-功能概述)
- [2. 快速开始](#2-快速开始)
- [3. 接口分类](#3-接口分类)
- [4. 使用示例](#4-使用示例)
- [5. 最佳实践](#5-最佳实践)
- [6. 错误处理](#6-错误处理)
- [7. 性能优化](#7-性能优化)

## 1. 功能概述

涨跌停板统计分析功能提供全面的市场涨跌停数据分析，帮助用户深入了解市场动态和投资机会。

### 1.1 核心功能
- **基础统计**: 涨跌停数量、资金、连板等基础指标
- **质量分析**: 封板时间、封单强度、炸板回封等质量指标
- **行业分析**: 行业分布、热点板块、资金流向分析
- **情绪分析**: 市场情绪指标、风险评估、异常检测
- **历史对比**: 历史数据对比、分位数分析、趋势识别
- **反弹分析**: 跌停板次日反弹概率和幅度分析

### 1.2 数据来源
基于 `stock_limit_pool` 表的涨跌停板数据，包含：
- 涨停板数据 (data_type = 'LIMIT_UP')
- 跌停板数据 (data_type = 'LIMIT_DOWN')

## 2. 快速开始

### 2.1 访问 API 文档
启动应用后，访问以下地址查看完整的 API 文档：
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

### 2.2 基础调用示例
```bash
# 获取指定日期的基础统计数据
curl -X GET "http://localhost:8080/api/limit-board-statistics/basic/2025-01-15"

# 获取涨停板详细统计
curl -X GET "http://localhost:8080/api/limit-board-statistics/detail/2025-01-15?dataType=LIMIT_UP"

# 获取市场情绪指标
curl -X GET "http://localhost:8080/api/limit-board-statistics/sentiment/2025-01-15"
```

## 3. 接口分类

### 3.1 基础统计接口
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/limit-board-statistics/basic/{date}` | GET | 获取单日基础统计 |
| `/api/limit-board-statistics/basic/range` | GET | 获取范围基础统计 |

### 3.2 详细分析接口
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/limit-board-statistics/detail/{date}` | GET | 获取涨跌停详细统计 |
| `/api/limit-board-statistics/detail/range` | GET | 获取范围详细统计 |
| `/api/limit-board-statistics/comparison/{date}` | GET | 获取涨跌停对比分析 |

### 3.3 质量分析接口
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/limit-board-statistics/quality/{date}` | GET | 获取质量分析 |

### 3.4 行业分析接口
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/limit-board-statistics/industry/{date}` | GET | 获取行业分布 |
| `/api/limit-board-statistics/industry/trend/{date}` | GET | 获取行业趋势 |

### 3.5 反弹分析接口
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/limit-board-statistics/rebound/{date}` | GET | 获取反弹分析 |
| `/api/limit-board-statistics/rebound/consecutive/{date}` | GET | 按连跌停数反弹分析 |
| `/api/limit-board-statistics/rebound/industry/{date}` | GET | 按行业反弹分析 |
| `/api/limit-board-statistics/rebound/pe/{date}` | GET | 按市盈率反弹分析 |

### 3.6 连板分析接口
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/limit-board-statistics/continuous-success-rate` | GET | 获取连板成功率 |

### 3.7 情绪分析接口
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/limit-board-statistics/sentiment/{date}` | GET | 获取情绪指标 |
| `/api/limit-board-statistics/sentiment/trend` | GET | 获取情绪趋势 |

### 3.8 历史对比接口
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/limit-board-statistics/historical-compare/{targetDate}` | GET | 获取历史对比 |
| `/api/limit-board-statistics/percentile/{targetDate}` | GET | 获取分位数分析 |

### 3.9 管理接口
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/limit-board-statistics/cache/refresh/{date}` | POST | 刷新缓存 |
| `/api/limit-board-statistics/cache/clear/{date}` | DELETE | 清除缓存 |
| `/api/limit-board-statistics/data/availability/{date}` | GET | 检查数据可用性 |
| `/api/limit-board-statistics/anomaly/detect/{date}` | GET | 检测市场异常 |

## 4. 使用示例

### 4.1 基础统计查询

#### 获取单日基础统计
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/basic/2025-01-15"
```

**响应示例:**
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "tradeDate": "2025-01-15",
    "limitUpCount": 45,
    "limitUpOneWordCount": 12,
    "limitUpBlastResealCount": 8,
    "limitUpMaxContinuous": 5,
    "limitUpContinuousRate": 0.267,
    "limitUpTotalSealFunds": 125.67,
    "limitUpAvgSealFunds": 2792.67,
    "limitDownCount": 18,
    "limitDownOneWordCount": 6,
    "limitDownOpenCount": 3,
    "limitDownMaxContinuous": 3,
    "limitDownContinuousRate": 0.167,
    "limitDownTotalSealFunds": 45.23,
    "limitDownAvgSealFunds": 2512.39,
    "limitUpDownRatio": 2.5,
    "totalMarketValue": 1567.89,
    "yesterdayLimitUpAvgIncrease": 0.0234,
    "yesterdayLimitDownAvgIncrease": 0.0567
  }
}
```

#### 获取范围基础统计
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/basic/range?startDate=2025-01-01&endDate=2025-01-15"
```

### 4.2 涨停板详细分析

#### 获取涨停板详细统计
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/detail/2025-01-15?dataType=LIMIT_UP"
```

**响应示例:**
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "tradeDate": "2025-01-15",
    "dataType": "LIMIT_UP",
    "dataTypeDesc": "涨停板",
    "totalCount": 45,
    "oneWordBoardCount": 12,
    "maxContinuousLimit": 5,
    "continuousLimitRate": 0.267,
    "totalSealFunds": 125.67,
    "avgSealFunds": 2792.67,
    "blastAndResealCount": 8,
    "continuousDistribution": [
      {
        "continuousLimit": 1,
        "count": 33,
        "percentage": 73.33,
        "avgSealFunds": 2456.78,
        "avgMarketValue": 45.67
      },
      {
        "continuousLimit": 2,
        "count": 8,
        "percentage": 17.78,
        "avgSealFunds": 3567.89,
        "avgMarketValue": 67.89
      }
    ],
    "timeDistribution": [
      {
        "timeRange": "09:30-10:30",
        "timeDesc": "早盘",
        "count": 18,
        "percentage": 40.0
      },
      {
        "timeRange": "10:30-14:00",
        "timeDesc": "午盘",
        "count": 20,
        "percentage": 44.44
      }
    ],
    "industryDistribution": [
      {
        "industry": "电子信息",
        "count": 12,
        "percentage": 26.67,
        "avgSealFunds": 3456.78,
        "avgMarketValue": 56.78,
        "rank": 1
      }
    ]
  }
}
```

### 4.3 质量分析

#### 获取涨停板质量分析
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/quality/2025-01-15?dataType=LIMIT_UP"
```

**响应示例:**
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "tradeDate": "2025-01-15",
    "dataType": "LIMIT_UP",
    "dataTypeDesc": "涨停板",
    "oneWordBoardRate": 0.267,
    "earlyLimitRate": 0.4,
    "noonLimitRate": 0.444,
    "lateLimitRate": 0.156,
    "avgSealStrength": 2792.67,
    "strongSealRate": 0.333,
    "blastCount": 12,
    "resealCount": 8,
    "resealRate": 0.667,
    "avgBlastTimes": 1.25,
    "sealStrengthDist": [
      {
        "range": "0-500万",
        "count": 15,
        "percentage": 33.33
      },
      {
        "range": "500-1000万",
        "count": 12,
        "percentage": 26.67
      }
    ]
  }
}
```

### 4.4 市场情绪分析

#### 获取市场情绪指标
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/sentiment/2025-01-15"
```

**响应示例:**
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "tradeDate": "2025-01-15",
    "limitUpDownRatio": 2.5,
    "continuousLimitRate": 0.267,
    "blastRate": 0.267,
    "resealRate": 0.667,
    "totalSealFunds": 125.67,
    "avgSealFunds": 2792.67,
    "largeSealRate": 0.333,
    "fundConcentration": 0.456,
    "earlyLimitUpRate": 0.4,
    "lateLimitUpRate": 0.156,
    "avgFirstLimitTime": 11.25,
    "sentimentScore": 72.5,
    "sentimentLevel": "乐观"
  }
}
```

### 4.5 跌停板反弹分析

#### 获取跌停板反弹分析
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/rebound/2025-01-15"
```

**响应示例:**
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "tradeDate": "2025-01-15",
    "totalLimitDownCount": 18,
    "reboundCount": 8,
    "reboundRate": 0.444,
    "avgReboundIncrease": 0.0567,
    "reboundByConsecutive": [
      {
        "consecutiveLimit": 1,
        "totalCount": 12,
        "reboundCount": 6,
        "reboundRate": 0.5
      },
      {
        "consecutiveLimit": 2,
        "totalCount": 4,
        "reboundCount": 1,
        "reboundRate": 0.25
      }
    ],
    "reboundByIndustry": [
      {
        "industry": "医药生物",
        "totalCount": 5,
        "reboundCount": 3,
        "reboundRate": 0.6
      }
    ],
    "reboundByPe": [
      {
        "peRange": "0-20",
        "totalCount": 8,
        "reboundCount": 5,
        "reboundRate": 0.625
      }
    ]
  }
}
```

### 4.6 历史对比分析

#### 获取历史对比分析
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/historical-compare/2025-01-15?days=30"
```

**响应示例:**
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "targetDate": "2025-01-15",
    "comparisonDays": 30,
    "limitUpCountPercentile": 75.5,
    "limitDownCountPercentile": 45.2,
    "limitUpDownRatioPercentile": 82.3,
    "sentimentScorePercentile": 68.7,
    "historicalAverage": {
      "limitUpCount": 38.5,
      "limitDownCount": 22.3,
      "limitUpDownRatio": 1.73
    },
    "currentVsHistorical": {
      "limitUpCountDiff": 6.5,
      "limitDownCountDiff": -4.3,
      "limitUpDownRatioDiff": 0.77
    },
    "anomalyFlags": [
      "涨停数量异常偏高",
      "涨跌停比例显著上升"
    ]
  }
}
```

## 5. 最佳实践

### 5.1 查询优化
1. **合理使用日期范围**: 避免查询过大的日期范围（建议不超过30天）
2. **利用缓存机制**: 相同查询在缓存有效期内会直接返回缓存结果
3. **按需查询**: 先使用基础统计接口获取概览，再根据需要调用详细分析接口

### 5.2 数据解读
1. **涨跌停比例**: 比值越高表示市场情绪越乐观
2. **连板率**: 反映市场持续性和强度
3. **封单强度**: 反映资金参与度和信心
4. **反弹率**: 跌停板次日反弹概率，用于抄底参考

### 5.3 业务场景
1. **日常监控**: 使用基础统计和情绪指标接口
2. **深度分析**: 结合质量分析和行业分析接口
3. **策略制定**: 利用历史对比和反弹分析接口
4. **风险控制**: 使用异常检测和风险评估接口

## 6. 错误处理

### 6.1 常见错误码
| 错误码 | 描述 | 解决方案 |
|--------|------|----------|
| 400 | 参数错误 | 检查请求参数格式和取值范围 |
| 404 | 数据不存在 | 确认查询日期是否为交易日 |
| 500 | 服务器内部错误 | 联系技术支持 |

### 6.2 错误响应示例
```json
{
  "code": 400,
  "msg": "参数错误：查询日期不能为空",
  "data": null
}
```

### 6.3 数据可用性检查
在进行复杂查询前，建议先检查数据可用性：
```bash
curl -X GET "http://localhost:8080/api/limit-board-statistics/data/availability/2025-01-15"
```

## 7. 性能优化

### 7.1 缓存策略
- **当日数据**: 15分钟缓存（交易时间内）
- **历史数据**: 4小时缓存
- **复杂计算**: 1小时缓存

### 7.2 缓存管理
```bash
# 刷新指定日期缓存
curl -X POST "http://localhost:8080/api/limit-board-statistics/cache/refresh/2025-01-15"

# 清除指定日期缓存
curl -X DELETE "http://localhost:8080/api/limit-board-statistics/cache/clear/2025-01-15"

# 预热缓存
curl -X POST "http://localhost:8080/api/limit-board-statistics/cache/warmup?startDate=2025-01-01&endDate=2025-01-15"
```

### 7.3 性能监控
系统提供性能监控接口，可以查看查询耗时和缓存命中率等指标。

## 8. 联系支持

如有问题或建议，请联系：
- 邮箱: dev@gsxi.com
- 技术支持: https://www.gsxi.com/support
- API 文档: http://localhost:8080/swagger-ui/index.html