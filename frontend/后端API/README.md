# 涨跌停板统计分析 API 文档

## 📋 文档概述

本文档集合为 TradeInsight 涨跌停板数据统计分析功能提供完整的 API 文档和使用指南。

## 📁 文档结构

### 核心文档
- **[API 使用指南](涨跌停板统计分析API使用指南.md)** - 快速上手和最佳实践
- **[API 接口详细说明](涨跌停板统计分析API接口详细说明.md)** - 完整的接口参数和响应说明
- **[API 测试用例](涨跌停板统计分析API测试用例.md)** - 全面的测试用例和验证方法

### 工具文件
- **[Postman 集合](涨跌停板统计分析API_Postman集合.json)** - 可导入的 Postman 测试集合
- **[Swagger 配置](../../../tradeinsight-backend/src/main/java/com/gsxi/trading/tradeinsight/config/SwaggerConfig.java)** - OpenAPI 文档配置

## 🚀 快速开始

### 1. 启动应用
```bash
mvn spring-boot:run
```

### 2. 访问 API 文档
- **Swagger UI**: http://localhost:8080/swagger-ui/index.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

### 3. 基础调用示例
```bash
# 获取基础统计数据
curl -X GET "http://localhost:8080/api/limit-board-statistics/basic/2025-01-15"

# 获取涨停板详细统计
curl -X GET "http://localhost:8080/api/limit-board-statistics/detail/2025-01-15?dataType=LIMIT_UP"

# 获取市场情绪指标
curl -X GET "http://localhost:8080/api/limit-board-statistics/sentiment/2025-01-15"
```

## 🔧 功能特性

### 核心功能模块
- ✅ **基础统计**: 涨跌停数量、资金、连板等基础指标
- ✅ **详细分析**: 涨跌停板详细统计和分布分析
- ✅ **质量分析**: 封板时间、封单强度、炸板回封等质量指标
- ✅ **行业分析**: 行业分布、热点板块、资金流向分析
- ✅ **反弹分析**: 跌停板次日反弹概率和幅度分析
- ✅ **连板分析**: 连板成功率和持续性分析
- ✅ **情绪分析**: 市场情绪指标、风险评估、异常检测
- ✅ **历史对比**: 历史数据对比、分位数分析、趋势识别

### 技术特性
- 🚀 **高性能**: 多层缓存机制，响应时间 < 3秒
- 🔒 **数据安全**: 完整的参数验证和异常处理
- 📊 **统一格式**: AjaxResult 统一响应格式
- 🔄 **实时更新**: 支持缓存刷新和数据同步
- 📈 **监控支持**: 性能监控和异常检测

## 📊 接口分类

### 基础统计接口 (2个)
- `GET /api/limit-board-statistics/basic/{date}` - 获取基础统计数据
- `GET /api/limit-board-statistics/basic/range` - 获取范围基础统计数据

### 详细分析接口 (4个)
- `GET /api/limit-board-statistics/detail/{date}` - 获取涨跌停详细统计
- `GET /api/limit-board-statistics/detail/range` - 获取范围详细统计
- `GET /api/limit-board-statistics/comparison/{date}` - 获取涨跌停对比分析
- `GET /api/limit-board-statistics/comparison/range` - 获取范围对比分析

### 质量分析接口 (1个)
- `GET /api/limit-board-statistics/quality/{date}` - 获取质量分析

### 行业分析接口 (2个)
- `GET /api/limit-board-statistics/industry/{date}` - 获取行业分布
- `GET /api/limit-board-statistics/industry/trend/{date}` - 获取行业趋势

### 反弹分析接口 (4个)
- `GET /api/limit-board-statistics/rebound/{date}` - 获取反弹分析
- `GET /api/limit-board-statistics/rebound/consecutive/{date}` - 按连跌停数反弹分析
- `GET /api/limit-board-statistics/rebound/industry/{date}` - 按行业反弹分析
- `GET /api/limit-board-statistics/rebound/pe/{date}` - 按市盈率反弹分析

### 连板分析接口 (1个)
- `GET /api/limit-board-statistics/continuous-success-rate` - 获取连板成功率

### 情绪分析接口 (2个)
- `GET /api/limit-board-statistics/sentiment/{date}` - 获取情绪指标
- `GET /api/limit-board-statistics/sentiment/trend` - 获取情绪趋势

### 历史对比接口 (2个)
- `GET /api/limit-board-statistics/historical-compare/{targetDate}` - 获取历史对比
- `GET /api/limit-board-statistics/percentile/{targetDate}` - 获取分位数分析

### 管理接口 (6个)
- `POST /api/limit-board-statistics/cache/refresh/{date}` - 刷新缓存
- `DELETE /api/limit-board-statistics/cache/clear/{date}` - 清除缓存
- `POST /api/limit-board-statistics/cache/warmup` - 预热缓存
- `GET /api/limit-board-statistics/data/availability/{date}` - 检查数据可用性
- `GET /api/limit-board-statistics/data/latest` - 获取最新数据日期
- `GET /api/limit-board-statistics/anomaly/detect/{date}` - 检测市场异常

**总计**: 24个 API 接口

## 📋 数据类型说明

### 支持的数据类型
- **LIMIT_UP**: 涨停板数据
- **LIMIT_DOWN**: 跌停板数据
- **ALL**: 全部数据（部分接口支持）

### 日期格式
- 所有日期参数使用 `yyyy-MM-dd` 格式
- 示例: `2025-01-15`

### 响应格式
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": { ... }
}
```

## 🔧 使用工具

### Postman 集合
1. 导入 `涨跌停板统计分析API_Postman集合.json`
2. 设置环境变量:
   - `baseUrl`: http://localhost:8080
   - `testDate`: 2025-01-15
   - `startDate`: 2025-01-01
   - `endDate`: 2025-01-15

### Swagger UI
访问 http://localhost:8080/swagger-ui/index.html 进行在线测试

### curl 命令
参考各文档中的 curl 示例进行命令行测试

## 📈 性能指标

### 响应时间要求
- **基础统计接口**: < 1秒
- **详细分析接口**: < 2秒
- **复杂计算接口**: < 3秒

### 缓存策略
- **当日数据**: 15分钟缓存（交易时间内）
- **历史数据**: 4小时缓存
- **复杂计算**: 1小时缓存

### 并发支持
- 支持 10+ 并发用户
- 成功率 > 99%

## 🧪 测试指南

### 测试环境准备
1. 确保数据库中有测试数据
2. 启动应用服务
3. 准备测试工具（Postman/curl）

### 测试执行
1. **功能测试**: 按照测试用例文档执行
2. **性能测试**: 使用 Apache Bench 或类似工具
3. **异常测试**: 验证错误处理和边界条件

### 测试覆盖
- ✅ 正常场景测试
- ✅ 异常场景测试
- ✅ 边界条件测试
- ✅ 性能压力测试
- ✅ 缓存机制测试

## 🐛 问题排查

### 常见问题
1. **404 错误**: 检查 URL 路径和参数
2. **400 错误**: 检查参数格式和取值范围
3. **500 错误**: 查看服务器日志
4. **响应慢**: 检查缓存状态和数据库性能

### 调试工具
- 应用日志: `logs/application.log`
- Swagger UI: 在线接口测试
- 数据可用性检查: `/data/availability/{date}`

## 📞 技术支持

### 联系方式
- **邮箱**: dev@gsxi.com
- **技术支持**: https://www.gsxi.com/support
- **在线文档**: http://localhost:8080/swagger-ui/index.html

### 开发团队
- **项目**: TradeInsight 涨跌停板统计分析
- **版本**: 1.0.0
- **更新日期**: 2025年9月1日

## 📄 许可证

本项目采用 Apache 2.0 许可证，详情请参阅 [LICENSE](https://www.apache.org/licenses/LICENSE-2.0) 文件。

---

**注意**: 本文档基于 TradeInsight 1.0.0 版本编写，如有更新请及时同步文档内容。