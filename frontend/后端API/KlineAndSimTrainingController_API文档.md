# KlineController 和 SimSingleTrainingController 接口文档

## 1. 接口概述

本文档详细描述了 TradeInsight 系统中日K线接口（KlineController）和单人模拟训练接口（SimSingleTrainingController）的API设计和使用方法。

## 2. 接口列表

### 2.1 KlineController 接口列表

| 接口名称 | 请求URL | 请求方法 | 功能描述 |
|---------|---------|---------|---------|
| 获取随机股票K线 | `/api/kline/random` | GET | 获取随机一只股票的指定天数K线数据 |

### 2.2 SimSingleTrainingController 接口列表

| 接口名称 | 请求URL | 请求方法 | 功能描述 |
|---------|---------|---------|
| 提交模拟结果 | `/api/sim-training/submit` | POST | 提交用户的模拟交易训练结果 |
| 查询历史记录 | `/api/sim-training/history` | GET | 查询用户的历史模拟训练记录 |
| 查询单条详情 | `/api/sim-training/detail/{trainingId}` | GET | 查询单条模拟训练的详细信息（含交易记录） |

## 3. 响应格式说明

所有接口统一使用 `AjaxResult` 对象作为响应格式，包含以下字段：

```json
{
  "code": 200,  // 状态码，200表示成功，500表示失败
  "msg": "操作成功",  // 响应消息
  "data": { }  // 具体业务数据
}
```

## 4. 详细接口说明

### 4.1 KlineController 接口

#### 4.1.1 获取随机股票K线数据

**接口功能**：获取随机一只股票的指定天数K线数据

**请求URL**：`/api/kline/random`

**请求方法**：GET

**请求参数**：

| 参数名 | 类型 | 必需 | 说明 |
|-------|------|------|------|
| days | Integer | 是 | 所需K线天数（必须为正整数） |

**请求示例**：
```
GET /api/kline/random?days=100
```

**成功响应示例**：

```json
{
  "code": 200,
  "msg": "获取K线数据成功",
  "data": {
    "stockInfo": {
      "code": "000430.SZ",
      "codeName": "张家界",
      "ipoDate": "1996-08-29",
      "outDate": null,
      "type": "stock",
      "status": "上市",
      "exchange": "深圳证券交易所"
    },
    "klineData": [
      {
        "id": 1,
        "date": "2023-01-03",
        "code": "000430.SZ",
        "open": 5.20,
        "high": 5.35,
        "low": 5.15,
        "close": 5.30,
        "preclose": 5.20,
        "volume": 12500000,
        "amount": 6625000.00,
        "adjustflag": 1,
        "turn": 2.35,
        "tradestatus": 1,
        "pctChg": 1.92,
        "isST": 0,
        "updateTime": "2023-01-03T16:00:00"
      },
      // 更多K线数据...
    ],
    "startDate": "2023-01-03",
    "endDate": "2023-05-20",
    "totalDays": 100,
    "code": 1,
    "message": "成功"
  }
}
```

**失败响应示例**：

```json
{
  "code": 500,
  "msg": "天数必须为正整数",
  "data": null
}
```

### 4.2 SimSingleTrainingController 接口

#### 4.2.1 提交模拟结果

**接口功能**：提交用户的模拟交易训练结果

**请求URL**：`/api/sim-training/submit`

**请求方法**：POST

**请求体参数**：

| 参数名 | 类型 | 必需 | 说明 |
|-------|------|------|------|
| id | Long | 否 | 模拟记录ID（新建时无需填写） |
| userId | Long | 是 | 用户ID |
| stockName | String | 是 | 股票名称 |
| stockCode | String | 是 | 股票代码 |
| startTime | LocalDate | 是 | 模拟开始日期 |
| endTime | LocalDate | 是 | 模拟结束日期 |
| initialCapital | BigDecimal | 是 | 初始资金 |
| finalCapital | BigDecimal | 是 | 最终资金 |
| totalProfit | BigDecimal | 是 | 总盈利 |
| operationProfitRate | BigDecimal | 是 | 操作收益率 |
| excessProfitRate | BigDecimal | 是 | 超额收益率 |
| stockRangeProfitRate | BigDecimal | 是 | 股票区间涨跌幅 |
| tradeTimes | Integer | 是 | 总操作次数 |
| tradeDatas | List<TradeData> | 是 | 所有交易记录 |
| status | Integer | 否 | 状态（1-已完成，0-未完成，默认1） |
| createdAt | LocalDateTime | 否 | 记录创建时间（系统自动生成） |

**请求示例**：

```json
{
  "userId": 123,
  "stockName": "张家界",
  "stockCode": "000430.SZ",
  "startTime": "2016-05-18",
  "endTime": "2016-10-17",
  "initialCapital": 101083.22,
  "finalCapital": 101513.26,
  "totalProfit": 430.04,
  "operationProfitRate": 0.004255,
  "excessProfitRate": -0.001200,
  "stockRangeProfitRate": 0.1524,
  "tradeTimes": 2,
  "tradeDatas": [
    {
      "tradeType": "sell",
      "price": 56.2725,
      "amount": 1800,
      "total": 101290.5,
      "klineIndex": 15,
      "tradeDate": "2016-06-01"
    },
    {
      "tradeType": "buy",
      "price": 56.2725,
      "amount": 1800,
      "total": 101290.5,
      "klineIndex": 20,
      "tradeDate": "2016-06-02"
    }
  ],
  "status": 1
}
```

**成功响应示例**：

```json
{
  "code": 200,
  "msg": "提交模拟结果成功",
  "data": {
    "id": 1,
    "userId": 123,
    "stockName": "张家界",
    "stockCode": "000430.SZ",
    "startTime": "2016-05-18",
    "endTime": "2016-10-17",
    "initialCapital": 101083.22,
    "finalCapital": 101513.26,
    "totalProfit": 430.04,
    "operationProfitRate": 0.004255,
    "excessProfitRate": -0.001200,
    "stockRangeProfitRate": 0.1524,
    "tradeTimes": 2,
    "tradeDatas": [
      // 交易记录数据...
    ],
    "status": 1,
    "createdAt": "2023-01-01T10:00:00"
  }
}
```

#### 4.2.2 查询历史记录

**接口功能**：查询用户的历史模拟训练记录

**请求URL**：`/api/sim-training/history`

**请求方法**：GET

**请求参数**：

| 参数名 | 类型 | 必需 | 说明 |
|-------|------|------|------|
| userId | Long | 是 | 用户ID |

**请求示例**：
```
GET /api/sim-training/history?userId=123
```

**成功响应示例**：

```json
{
  "code": 200,
  "msg": "查询用户历史模拟记录成功",
  "data": [
    {
      "id": 1,
      "userId": 123,
      "stockName": "张家界",
      "stockCode": "000430.SZ",
      "startTime": "2016-05-18",
      "endTime": "2016-10-17",
      "initialCapital": 101083.22,
      "finalCapital": 101513.26,
      "totalProfit": 430.04,
      "operationProfitRate": 0.004255,
      "excessProfitRate": -0.001200,
      "stockRangeProfitRate": 0.1524,
      "tradeTimes": 2,
      "tradeDatas": [],  // 历史列表中不包含详细交易记录
      "status": 1,
      "createdAt": "2023-01-01T10:00:00"
    },
    // 更多历史记录...
  ]
}
```

#### 4.2.3 查询单条详情

**接口功能**：查询单条模拟训练的详细信息（含交易记录）

**请求URL**：`/api/sim-training/detail/{trainingId}`

**请求方法**：GET

**路径参数**：

| 参数名 | 类型 | 必需 | 说明 |
|-------|------|------|------|
| trainingId | Long | 是 | 模拟记录ID |

**请求示例**：
```
GET /api/sim-training/detail/1
```

**成功响应示例**：

```json
{
  "code": 200,
  "msg": "查询单条模拟详情成功",
  "data": {
    "id": 1,
    "userId": 123,
    "stockName": "张家界",
    "stockCode": "000430.SZ",
    "startTime": "2016-05-18",
    "endTime": "2016-10-17",
    "initialCapital": 101083.22,
    "finalCapital": 101513.26,
    "totalProfit": 430.04,
    "operationProfitRate": 0.004255,
    "excessProfitRate": -0.001200,
    "stockRangeProfitRate": 0.1524,
    "tradeTimes": 2,
    "tradeDatas": [
      {
        "tradeType": "sell",
        "price": 56.2725,
        "amount": 1800,
        "total": 101290.5,
        "klineIndex": 15,
        "tradeDate": "2016-06-01"
      },
      {
        "tradeType": "buy",
        "price": 56.2725,
        "amount": 1800,
        "total": 101290.5,
        "klineIndex": 20,
        "tradeDate": "2016-06-02"
      }
    ],
    "status": 1,
    "createdAt": "2023-01-01T10:00:00"
  }
}
```

## 5. 数据模型说明

### 5.1 KlineResponse

| 字段名 | 类型 | 说明 |
|-------|------|------|
| stockInfo | StockBasic | 股票基本信息 |
| klineData | List<DailyK> | 连续N天K线数据列表 |
| startDate | LocalDate | K线起始日期 |
| endDate | LocalDate | K线结束日期 |
| totalDays | Integer | 实际返回的K线天数 |
| code | Integer | 响应状态码（扩展字段） |
| message | String | 响应消息（如错误提示） |

### 5.2 StockBasic

| 字段名 | 类型 | 说明 |
|-------|------|------|
| code | String | 股票代码 |
| codeName | String | 股票名称 |
| ipoDate | LocalDate | 上市日期 |
| outDate | LocalDate | 退市日期 |
| type | String | 类型 |
| status | String | 状态 |
| exchange | String | 交易所 |

### 5.3 DailyK

| 字段名 | 类型 | 说明 |
|-------|------|------|
| id | Integer | 自增主键 |
| date | LocalDate | 交易日期 |
| code | String | 股票代码 |
| open | BigDecimal | 开盘价 |
| high | BigDecimal | 最高价 |
| low | BigDecimal | 最低价 |
| close | BigDecimal | 收盘价 |
| preclose | BigDecimal | 前收盘价 |
| volume | Long | 成交量 |
| amount | BigDecimal | 成交金额 |
| adjustflag | Integer | 复权状态 |
| turn | Float | 换手率 |
| tradestatus | Integer | 交易状态 |
| pctChg | Float | 涨跌幅(%) |
| isST | Integer | 是否ST股 |
| updateTime | LocalDateTime | 更新时间 |

### 5.4 SimSingleTraining

| 字段名 | 类型 | 说明 |
|-------|------|------|
| id | Long | 模拟记录ID |
| userId | Long | 用户ID |
| stockName | String | 股票名称 |
| stockCode | String | 股票代码 |
| startTime | LocalDate | 模拟开始日期 |
| endTime | LocalDate | 模拟结束日期 |
| initialCapital | BigDecimal | 初始资金 |
| finalCapital | BigDecimal | 最终资金 |
| totalProfit | BigDecimal | 总盈利 |
| operationProfitRate | BigDecimal | 操作收益率 |
| excessProfitRate | BigDecimal | 超额收益率 |
| stockRangeProfitRate | BigDecimal | 股票区间涨跌幅 |
| tradeTimes | Integer | 总操作次数 |
| tradeDatas | List<TradeData> | 所有交易记录 |
| status | Integer | 状态（1-已完成，0-未完成） |
| createdAt | LocalDateTime | 记录创建时间 |

### 5.5 TradeData

| 字段名 | 类型 | 说明 |
|-------|------|------|
| tradeType | String | 交易类型（buy/sell） |
| price | BigDecimal | 交易价格 |
| amount | Integer | 交易数量 |
| total | BigDecimal | 交易金额 |
| klineIndex | Integer | K线索引 |
| tradeDate | String | 交易日期 |

## 6. 错误码说明

| 错误码 | 错误描述 | 可能原因 |
|-------|---------|---------|
| 200 | 操作成功 | 请求处理成功 |
| 500 | 操作失败 | 服务器内部错误或业务逻辑错误 |
| 500 | 天数必须为正整数 | 请求参数days为空或小于1 |
| 500 | 其他错误信息 | 具体错误原因由服务器返回的message字段提供 |

## 7. 调用示例（Java）

### 7.1 获取随机股票K线示例

```java
// 使用HttpClient调用示例
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;

public class KlineApiExample {
    public static void main(String[] args) {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            String url = "http://localhost:8080/api/kline/random?days=100";
            HttpGet request = new HttpGet(url);
            
            String response = EntityUtils.toString(httpClient.execute(request).getEntity());
            System.out.println("响应结果: " + response);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 7.2 提交模拟结果示例

```java
// 使用HttpClient调用示例
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;

public class SimTrainingApiExample {
    public static void main(String[] args) {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            String url = "http://localhost:8080/api/sim-training/submit";
            HttpPost request = new HttpPost(url);
            
            // 设置请求体
            String jsonBody = "{\"userId\":123,\"stockName\":\"张家界\",\"stockCode\":\"000430.SZ\",...}";
            request.setEntity(new StringEntity(jsonBody, "UTF-8"));
            request.setHeader("Content-Type", "application/json");
            
            String response = EntityUtils.toString(httpClient.execute(request).getEntity());
            System.out.println("响应结果: " + response);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

## 8. 注意事项

1. 所有接口均支持跨域请求
2. 接口调用需要符合系统的权限认证要求
3. 对于批量数据操作，请遵守系统的QPS限制
4. 建议在调用接口时添加超时处理机制
5. 详细的交易记录数据可能较大，请注意网络传输效率