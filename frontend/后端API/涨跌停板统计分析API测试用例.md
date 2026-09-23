# 涨跌停板统计分析 API 测试用例

## 目录
- [1. 测试环境准备](#1-测试环境准备)
- [2. 基础统计接口测试](#2-基础统计接口测试)
- [3. 详细分析接口测试](#3-详细分析接口测试)
- [4. 质量分析接口测试](#4-质量分析接口测试)
- [5. 行业分析接口测试](#5-行业分析接口测试)
- [6. 反弹分析接口测试](#6-反弹分析接口测试)
- [7. 连板分析接口测试](#7-连板分析接口测试)
- [8. 情绪分析接口测试](#8-情绪分析接口测试)
- [9. 历史对比接口测试](#9-历史对比接口测试)
- [10. 管理接口测试](#10-管理接口测试)
- [11. 异常场景测试](#11-异常场景测试)
- [12. 性能测试](#12-性能测试)

## 1. 测试环境准备

### 1.1 环境配置
- **测试环境**: http://localhost:8080
- **测试数据**: 确保数据库中有 2025-01-01 到 2025-01-15 的测试数据
- **工具**: Postman、curl 或其他 HTTP 客户端

### 1.2 测试数据准备
```sql
-- 插入测试数据（示例）
INSERT INTO stock_limit_pool (stock_code, stock_name, trade_date, data_type, industry, 
    continuous_limit, first_limit_time, last_limit_time, blast_times, limit_funds, 
    total_market_value, dynamic_pe) VALUES
('000001', '平安银行', '2025-01-15', 'LIMIT_UP', '银行', 1, '09:30:00', '09:30:00', 0, 50000000, 2500000000, 8.5),
('000002', '万科A', '2025-01-15', 'LIMIT_UP', '房地产', 2, '10:15:00', '10:15:00', 1, 80000000, 3200000000, 12.3),
('000003', '国农科技', '2025-01-15', 'LIMIT_DOWN', '农业', 1, '09:30:00', '09:30:00', 0, 20000000, 800000000, 25.6);
```

### 1.3 测试变量
```bash
export BASE_URL="http://localhost:8080"
export TEST_DATE="2025-01-15"
export START_DATE="2025-01-01"
export END_DATE="2025-01-15"
```

## 2. 基础统计接口测试

### 2.1 获取基础统计数据 - 正常场景

**测试用例**: TC_BASIC_001
**测试目标**: 验证获取指定日期基础统计数据功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/basic/2025-01-15`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/basic/${TEST_DATE}"
```

**预期结果**:
- HTTP 状态码: 200
- 响应格式: AjaxResult
- code: 200
- msg: "查询成功"
- data 包含完整的基础统计字段

**验证点**:
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "tradeDate": "2025-01-15",
    "limitUpCount": "应为正整数",
    "limitDownCount": "应为正整数或0",
    "limitUpDownRatio": "应为正数",
    "limitUpTotalSealFunds": "应为正数或0",
    "limitUpAvgSealFunds": "应为正数或0"
  }
}
```

### 2.2 获取范围基础统计数据 - 正常场景

**测试用例**: TC_BASIC_002
**测试目标**: 验证获取日期范围基础统计数据功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/basic/range`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/basic/range?startDate=${START_DATE}&endDate=${END_DATE}"
```

**预期结果**:
- HTTP 状态码: 200
- 响应格式: AjaxResult
- data 为数组，包含多个日期的统计数据
- 数组长度应等于查询日期范围内的交易日数量

### 2.3 基础统计接口 - 异常场景

**测试用例**: TC_BASIC_003
**测试目标**: 验证无效日期参数处理
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/basic/invalid-date`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/basic/invalid-date"
```

**预期结果**:
- HTTP 状态码: 400
- 响应包含错误信息

## 3. 详细分析接口测试

### 3.1 获取涨停板详细统计 - 正常场景

**测试用例**: TC_DETAIL_001
**测试目标**: 验证获取涨停板详细统计功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/detail/2025-01-15?dataType=LIMIT_UP`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/detail/${TEST_DATE}?dataType=LIMIT_UP"
```

**预期结果**:
- HTTP 状态码: 200
- dataType: "LIMIT_UP"
- dataTypeDesc: "涨停板"
- 包含 continuousDistribution、timeDistribution、industryDistribution
- 不包含 peDistribution（跌停板特有）
- 包含 blastAndResealCount（涨停板特有）

**验证点**:
```json
{
  "code": 200,
  "data": {
    "dataType": "LIMIT_UP",
    "dataTypeDesc": "涨停板",
    "blastAndResealCount": "应存在",
    "openBoardCount": "应为null",
    "continuousDistribution": "应为数组",
    "timeDistribution": "应为数组",
    "industryDistribution": "应为数组",
    "peDistribution": "应为null或不存在"
  }
}
```

### 3.2 获取跌停板详细统计 - 正常场景

**测试用例**: TC_DETAIL_002
**测试目标**: 验证获取跌停板详细统计功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/detail/2025-01-15?dataType=LIMIT_DOWN`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/detail/${TEST_DATE}?dataType=LIMIT_DOWN"
```

**预期结果**:
- HTTP 状态码: 200
- dataType: "LIMIT_DOWN"
- dataTypeDesc: "跌停板"
- 包含 openBoardCount、avgDynamicPe（跌停板特有）
- 包含 peDistribution（跌停板特有）
- 不包含 blastAndResealCount（涨停板特有）

### 3.3 获取涨跌停对比分析 - 正常场景

**测试用例**: TC_COMPARISON_001
**测试目标**: 验证涨跌停对比分析功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/comparison/2025-01-15`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/comparison/${TEST_DATE}"
```

**预期结果**:
- HTTP 状态码: 200
- 包含 limitUpCount、limitDownCount
- 包含 limitUpDownRatio、fundFlowRatio
- 包含 industryComparisons 数组

## 4. 质量分析接口测试

### 4.1 获取涨停板质量分析 - 正常场景

**测试用例**: TC_QUALITY_001
**测试目标**: 验证涨停板质量分析功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/quality/2025-01-15?dataType=LIMIT_UP`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/quality/${TEST_DATE}?dataType=LIMIT_UP"
```

**预期结果**:
- HTTP 状态码: 200
- dataType: "LIMIT_UP"
- 包含时间质量指标: oneWordBoardRate、earlyLimitRate 等
- 包含涨停板特有指标: blastCount、resealCount、resealRate
- 不包含跌停板特有指标

**验证点**:
```json
{
  "code": 200,
  "data": {
    "dataType": "LIMIT_UP",
    "oneWordBoardRate": "应为0-1之间的数值",
    "earlyLimitRate": "应为0-1之间的数值",
    "blastCount": "应存在",
    "resealRate": "应存在",
    "avgDynamicPe": "应为null",
    "openBoardCount": "应为null"
  }
}
```

### 4.2 获取跌停板质量分析 - 正常场景

**测试用例**: TC_QUALITY_002
**测试目标**: 验证跌停板质量分析功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/quality/2025-01-15?dataType=LIMIT_DOWN`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/quality/${TEST_DATE}?dataType=LIMIT_DOWN"
```

**预期结果**:
- HTTP 状态码: 200
- dataType: "LIMIT_DOWN"
- 包含跌停板特有指标: avgDynamicPe、lowPeRate、openBoardCount
- 包含 peDistribution 数组
- 不包含涨停板特有指标

## 5. 行业分析接口测试

### 5.1 获取行业分布统计 - 正常场景

**测试用例**: TC_INDUSTRY_001
**测试目标**: 验证行业分布统计功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/industry/2025-01-15?dataType=LIMIT_UP`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/industry/${TEST_DATE}?dataType=LIMIT_UP"
```

**预期结果**:
- HTTP 状态码: 200
- 响应为数组格式
- 每个元素包含: industry、count、percentage、avgSealFunds、avgMarketValue、rank
- percentage 总和应接近 100%
- rank 应按 count 降序排列

**验证点**:
```json
{
  "code": 200,
  "data": [
    {
      "industry": "应为字符串",
      "count": "应为正整数",
      "percentage": "应为0-100之间的数值",
      "avgSealFunds": "应为正数",
      "avgMarketValue": "应为正数",
      "rank": "应为正整数，从1开始"
    }
  ]
}
```

### 5.2 获取行业趋势分析 - 正常场景

**测试用例**: TC_INDUSTRY_002
**测试目标**: 验证行业趋势分析功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/industry/trend/2025-01-15`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/industry/trend/${TEST_DATE}"
```

**预期结果**:
- HTTP 状态码: 200
- 包含趋势分析数据
- 数据结构符合 IndustryTrendResponse 定义

## 6. 反弹分析接口测试

### 6.1 获取跌停板反弹分析 - 正常场景

**测试用例**: TC_REBOUND_001
**测试目标**: 验证跌停板反弹分析功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/rebound/2025-01-15`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/rebound/${TEST_DATE}"
```

**预期结果**:
- HTTP 状态码: 200
- 包含: totalLimitDownCount、reboundCount、reboundRate、avgReboundIncrease
- reboundRate 应为 0-1 之间的数值
- 包含 reboundByConsecutive、reboundByIndustry、reboundByPe 数组

**验证点**:
```json
{
  "code": 200,
  "data": {
    "totalLimitDownCount": "应为正整数或0",
    "reboundCount": "应 <= totalLimitDownCount",
    "reboundRate": "应为0-1之间的数值",
    "avgReboundIncrease": "应为数值",
    "reboundByConsecutive": "应为数组",
    "reboundByIndustry": "应为数组",
    "reboundByPe": "应为数组"
  }
}
```

### 6.2 按连跌停数反弹分析 - 正常场景

**测试用例**: TC_REBOUND_002
**测试目标**: 验证按连跌停数反弹分析功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/rebound/consecutive/2025-01-15`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/rebound/consecutive/${TEST_DATE}"
```

**预期结果**:
- HTTP 状态码: 200
- 重点验证 reboundByConsecutive 数组的详细数据
- 每个元素的 reboundCount 应 <= totalCount

### 6.3 按行业反弹分析 - 正常场景

**测试用例**: TC_REBOUND_003
**测试目标**: 验证按行业反弹分析功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/rebound/industry/2025-01-15`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/rebound/industry/${TEST_DATE}"
```

**预期结果**:
- HTTP 状态码: 200
- 重点验证 reboundByIndustry 数组的详细数据

### 6.4 按市盈率反弹分析 - 正常场景

**测试用例**: TC_REBOUND_004
**测试目标**: 验证按市盈率反弹分析功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/rebound/pe/2025-01-15`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/rebound/pe/${TEST_DATE}"
```

**预期结果**:
- HTTP 状态码: 200
- 重点验证 reboundByPe 数组的详细数据
- peRange 应为合理的市盈率区间

## 7. 连板分析接口测试

### 7.1 获取连板成功率分析 - 正常场景

**测试用例**: TC_CONTINUOUS_001
**测试目标**: 验证连板成功率分析功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/continuous-success-rate`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/continuous-success-rate?startDate=${START_DATE}&endDate=${END_DATE}&dataType=LIMIT_UP"
```

**预期结果**:
- HTTP 状态码: 200
- 包含 startDate、endDate、dataType
- successRateList 为数组，包含不同连板数的成功率数据
- 成功率应为 0-1 之间的数值

**验证点**:
```json
{
  "code": 200,
  "data": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-15",
    "dataType": "LIMIT_UP",
    "successRateList": [
      {
        "continuousLimit": "应为正整数",
        "totalCount": "应为正整数",
        "successCount": "应 <= totalCount",
        "successRate": "应为0-1之间的数值"
      }
    ]
  }
}
```

## 8. 情绪分析接口测试

### 8.1 获取市场情绪指标 - 正常场景

**测试用例**: TC_SENTIMENT_001
**测试目标**: 验证市场情绪指标功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/sentiment/2025-01-15`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/sentiment/${TEST_DATE}"
```

**预期结果**:
- HTTP 状态码: 200
- 包含基础情绪指标: limitUpDownRatio、continuousLimitRate、blastRate、resealRate
- 包含资金情绪指标: totalSealFunds、avgSealFunds、largeSealRate、fundConcentration
- 包含时间情绪指标: earlyLimitUpRate、lateLimitUpRate、avgFirstLimitTime
- 包含综合评分: sentimentScore（0-100）、sentimentLevel

**验证点**:
```json
{
  "code": 200,
  "data": {
    "limitUpDownRatio": "应为正数",
    "continuousLimitRate": "应为0-1之间的数值",
    "blastRate": "应为0-1之间的数值",
    "sentimentScore": "应为0-100之间的数值",
    "sentimentLevel": "应为情绪等级字符串"
  }
}
```

### 8.2 获取市场情绪趋势 - 正常场景

**测试用例**: TC_SENTIMENT_002
**测试目标**: 验证市场情绪趋势功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/sentiment/trend`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/sentiment/trend?startDate=${START_DATE}&endDate=${END_DATE}"
```

**预期结果**:
- HTTP 状态码: 200
- 响应包含趋势数据数组
- 数组长度应对应查询日期范围内的交易日数量

## 9. 历史对比接口测试

### 9.1 获取历史对比分析 - 正常场景

**测试用例**: TC_HISTORICAL_001
**测试目标**: 验证历史对比分析功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/historical-compare/2025-01-15?days=30`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/historical-compare/${TEST_DATE}?days=30"
```

**预期结果**:
- HTTP 状态码: 200
- 包含 targetDate、comparisonDays
- 包含各项指标的分位数: limitUpCountPercentile、limitDownCountPercentile 等
- 包含历史平均值和当前值对比
- 可能包含异常标识

**验证点**:
```json
{
  "code": 200,
  "data": {
    "targetDate": "2025-01-15",
    "comparisonDays": 30,
    "limitUpCountPercentile": "应为0-100之间的数值",
    "limitDownCountPercentile": "应为0-100之间的数值",
    "historicalAverage": "应为对象",
    "currentVsHistorical": "应为对象"
  }
}
```

### 9.2 获取分位数分析 - 正常场景

**测试用例**: TC_PERCENTILE_001
**测试目标**: 验证分位数分析功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/percentile/2025-01-15?days=60`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/percentile/${TEST_DATE}?days=60"
```

**预期结果**:
- HTTP 状态码: 200
- 包含详细的分位数分析数据
- 所有分位数值应在 0-100 之间

## 10. 管理接口测试

### 10.1 缓存管理测试

**测试用例**: TC_CACHE_001
**测试目标**: 验证缓存刷新功能
**请求方式**: POST
**请求URL**: `/api/limit-board-statistics/cache/refresh/2025-01-15`

**测试步骤**:
```bash
curl -X POST "${BASE_URL}/api/limit-board-statistics/cache/refresh/${TEST_DATE}"
```

**预期结果**:
- HTTP 状态码: 200
- 响应包含刷新成功的模块数量

**测试用例**: TC_CACHE_002
**测试目标**: 验证缓存清除功能
**请求方式**: DELETE
**请求URL**: `/api/limit-board-statistics/cache/clear/2025-01-15`

**测试步骤**:
```bash
curl -X DELETE "${BASE_URL}/api/limit-board-statistics/cache/clear/${TEST_DATE}"
```

**预期结果**:
- HTTP 状态码: 200
- 响应包含清除的缓存项数量

**测试用例**: TC_CACHE_003
**测试目标**: 验证缓存预热功能
**请求方式**: POST
**请求URL**: `/api/limit-board-statistics/cache/warmup`

**测试步骤**:
```bash
curl -X POST "${BASE_URL}/api/limit-board-statistics/cache/warmup?startDate=${START_DATE}&endDate=${END_DATE}"
```

**预期结果**:
- HTTP 状态码: 200
- 响应包含预热的数据条数

### 10.2 数据可用性检查测试

**测试用例**: TC_DATA_001
**测试目标**: 验证数据可用性检查功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/data/availability/2025-01-15`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/data/availability/${TEST_DATE}"
```

**预期结果**:
- HTTP 状态码: 200
- 响应包含各种数据可用性标识
- 所有布尔值字段应为 true 或 false

**验证点**:
```json
{
  "code": 200,
  "data": {
    "hasData": "应为布尔值",
    "hasLimitUpData": "应为布尔值",
    "hasLimitDownData": "应为布尔值",
    "hasSufficientLimitUpData": "应为布尔值",
    "hasSufficientLimitDownData": "应为布尔值",
    "dataIntegrity": "应为对象"
  }
}
```

**测试用例**: TC_DATA_002
**测试目标**: 验证获取最新数据日期功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/data/latest`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/data/latest"
```

**预期结果**:
- HTTP 状态码: 200
- 响应包含最新数据日期信息
- 日期格式应为 yyyy-MM-dd

### 10.3 异常检测测试

**测试用例**: TC_ANOMALY_001
**测试目标**: 验证市场异常检测功能
**请求方式**: GET
**请求URL**: `/api/limit-board-statistics/anomaly/detect/2025-01-15`

**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/anomaly/detect/${TEST_DATE}"
```

**预期结果**:
- HTTP 状态码: 200
- 响应包含异常检测结果
- anomalies 和 warnings 应为数组
- riskLevel 应为数值

**验证点**:
```json
{
  "code": 200,
  "data": {
    "anomalies": "应为数组",
    "warnings": "应为数组",
    "sentimentExtreme": "应为字符串或null",
    "riskLevel": "应为数值"
  }
}
```

## 11. 异常场景测试

### 11.1 参数验证测试

**测试用例**: TC_ERROR_001
**测试目标**: 验证无效日期格式处理
**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/basic/2025-13-45"
```
**预期结果**: HTTP 400，包含参数错误信息

**测试用例**: TC_ERROR_002
**测试目标**: 验证无效数据类型处理
**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/detail/${TEST_DATE}?dataType=INVALID_TYPE"
```
**预期结果**: HTTP 400，包含数据类型错误信息

**测试用例**: TC_ERROR_003
**测试目标**: 验证日期范围超限处理
**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/basic/range?startDate=2024-01-01&endDate=2025-12-31"
```
**预期结果**: HTTP 400，包含日期范围超限错误信息

**测试用例**: TC_ERROR_004
**测试目标**: 验证未来日期处理
**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/basic/2026-01-01"
```
**预期结果**: HTTP 400 或返回空数据

### 11.2 数据不存在场景测试

**测试用例**: TC_NODATA_001
**测试目标**: 验证无数据日期处理
**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/basic/2020-01-01"
```
**预期结果**: HTTP 200，返回零值统计结果

**测试用例**: TC_NODATA_002
**测试目标**: 验证非交易日处理
**测试步骤**:
```bash
curl -X GET "${BASE_URL}/api/limit-board-statistics/basic/2025-01-04"  # 假设为周六
```
**预期结果**: HTTP 200，返回空数据或提示信息

## 12. 性能测试

### 12.1 响应时间测试

**测试用例**: TC_PERF_001
**测试目标**: 验证基础统计接口响应时间
**测试方法**: 使用 curl 的 -w 参数测量响应时间
**测试步骤**:
```bash
curl -w "@curl-format.txt" -o /dev/null -s "${BASE_URL}/api/limit-board-statistics/basic/${TEST_DATE}"
```

**curl-format.txt 内容**:
```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

**性能要求**:
- 基础统计接口: < 1秒
- 详细分析接口: < 2秒
- 复杂计算接口: < 3秒

### 12.2 并发测试

**测试用例**: TC_PERF_002
**测试目标**: 验证接口并发处理能力
**测试方法**: 使用 Apache Bench (ab) 进行并发测试
**测试步骤**:
```bash
ab -n 100 -c 10 "${BASE_URL}/api/limit-board-statistics/basic/${TEST_DATE}"
```

**性能要求**:
- 并发用户数: 10
- 总请求数: 100
- 成功率: > 99%
- 平均响应时间: < 2秒

### 12.3 缓存效果测试

**测试用例**: TC_PERF_003
**测试目标**: 验证缓存机制效果
**测试步骤**:
1. 清除缓存
2. 第一次请求（无缓存）
3. 第二次请求（有缓存）
4. 比较响应时间

```bash
# 清除缓存
curl -X DELETE "${BASE_URL}/api/limit-board-statistics/cache/clear/${TEST_DATE}"

# 第一次请求
time curl "${BASE_URL}/api/limit-board-statistics/basic/${TEST_DATE}"

# 第二次请求
time curl "${BASE_URL}/api/limit-board-statistics/basic/${TEST_DATE}"
```

**预期结果**: 第二次请求的响应时间应显著小于第一次

## 测试报告模板

### 测试执行记录
| 测试用例 | 执行结果 | 响应时间 | 备注 |
|----------|----------|----------|------|
| TC_BASIC_001 | PASS | 0.5s | - |
| TC_BASIC_002 | PASS | 1.2s | - |
| TC_ERROR_001 | PASS | 0.1s | 正确返回400错误 |

### 问题记录
| 问题ID | 问题描述 | 严重程度 | 状态 |
|--------|----------|----------|------|
| BUG_001 | 某接口响应时间超过预期 | 中 | 待修复 |

### 测试结论
- 功能测试通过率: XX%
- 性能测试通过率: XX%
- 发现问题数量: XX个
- 整体评估: 通过/不通过