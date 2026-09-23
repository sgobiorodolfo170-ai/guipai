package com.gsxi.trading.tradeinsight.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Swagger API 文档配置类
 *
 * @author gsxi
 * @version 1.0
 * @date 2025/9/1
 * @description 配置 Swagger/OpenAPI 3 文档生成，为涨跌停板统计分析功能提供完整的 API 文档
 */
@Configuration
public class SwaggerConfig {

    /**
     * 配置 OpenAPI 文档信息
     *
     * @return OpenAPI 配置对象
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(buildApiInfo())
                .servers(buildServers())
                .tags(buildTags());
    }

    /**
     * 构建 API 基本信息
     *
     * @return API 信息对象
     */
    private Info buildApiInfo() {
        return new Info()
                .title("TradeInsight 涨跌停板统计分析 API")
                .description(buildApiDescription())
                .version("1.0.0")
                .contact(buildContact())
                .license(buildLicense());
    }

    /**
     * 构建 API 描述信息
     *
     * @return API 描述文本
     */
    private String buildApiDescription() {
        return """
                ## 涨跌停板数据统计分析功能 API 文档
                
                ### 功能概述
                本 API 提供全面的涨跌停板数据统计分析功能，基于 StockLimitPool 数据表，为用户提供：
                - 基础统计数据查询
                - 涨跌停板详细分析
                - 质量分析和行业分析
                - 市场情绪指标计算
                - 历史对比和趋势分析
                - 跌停板反弹分析
                - 连板成功率分析
                
                ### 数据类型说明
                - **LIMIT_UP**: 涨停板数据
                - **LIMIT_DOWN**: 跌停板数据
                - **ALL**: 全部数据（涨停+跌停）
                
                ### 日期格式
                所有日期参数均使用 `yyyy-MM-dd` 格式，如：`2025-01-15`
                
                ### 响应格式
                所有接口均返回统一的 AjaxResult 格式：
                ```json
                {
                  "code": 200,
                  "msg": "操作成功",
                  "data": { ... }
                }
                ```
                
                ### 缓存机制
                - 当日数据：15分钟缓存（交易时间内）
                - 历史数据：4小时缓存
                - 复杂计算：1小时缓存
                
                ### 使用建议
                1. 优先使用基础统计接口获取概览数据
                2. 根据需要调用详细分析接口
                3. 合理使用日期范围，避免查询过大范围
                4. 利用缓存机制提高查询效率
                """;
    }

    /**
     * 构建联系人信息
     *
     * @return 联系人对象
     */
    private Contact buildContact() {
        return new Contact()
                .name("TradeInsight 开发团队");
    }

    /**
     * 构建许可证信息
     *
     * @return 许可证对象
     */
    private License buildLicense() {
        return new License()
                .name("Apache 2.0")
                .url("https://www.apache.org/licenses/LICENSE-2.0");
    }

    /**
     * 构建服务器列表
     *
     * @return 服务器列表
     */
    private List<Server> buildServers() {
        return List.of(
                new Server()
                        .url("http://localhost:8080")
                        .description("本地开发环境")
        );
    }

    /**
     * 构建 API 标签列表
     *
     * @return 标签列表
     */
    private List<Tag> buildTags() {
        return List.of(
                new Tag()
                        .name("涨跌停板统计分析")
                        .description("涨跌停板数据统计分析相关接口"),
                new Tag()
                        .name("基础统计")
                        .description("基础统计数据查询接口"),
                new Tag()
                        .name("详细分析")
                        .description("涨跌停板详细分析接口"),
                new Tag()
                        .name("质量分析")
                        .description("涨跌停板质量分析接口"),
                new Tag()
                        .name("行业分析")
                        .description("行业分布和趋势分析接口"),
                new Tag()
                        .name("反弹分析")
                        .description("跌停板反弹分析接口"),
                new Tag()
                        .name("连板分析")
                        .description("连板成功率分析接口"),
                new Tag()
                        .name("情绪分析")
                        .description("市场情绪指标分析接口"),
                new Tag()
                        .name("历史对比")
                        .description("历史对比和分位数分析接口"),
                new Tag()
                        .name("缓存管理")
                        .description("缓存管理和数据可用性接口"),
                new Tag()
                        .name("异常检测")
                        .description("市场异常检测和风险评估接口")
        );
    }
}