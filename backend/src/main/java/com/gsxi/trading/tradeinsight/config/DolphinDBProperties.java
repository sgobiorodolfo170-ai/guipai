package com.gsxi.trading.tradeinsight.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * DolphinDB 时序数据库连接配置属性。
 * 对应 application*.yml 中的 dolphindb 节点。
 *
 * @author gsxi
 */
@Data
@ConfigurationProperties(prefix = "dolphindb")
public class DolphinDBProperties {

    /** DolphinDB 节点地址 */
    private String host = "localhost";

    /** DolphinDB 端口 */
    private int port = 8848;

    /** 用户名 */
    private String username = "admin";

    /** 密码 */
    private String password = "123456";

    /** DFS 分布式数据库路径，如 dfs://tradeinsight */
    private String database = "dfs://tradeinsight";

    /** 启动时是否自动创建库与表 */
    private boolean autoCreateSchema = true;

    /** 连接池配置 */
    private Pool pool = new Pool();

    @Data
    public static class Pool {
        private int initialSize = 2;
        private int minIdle = 2;
        private int maxActive = 10;
        private long maxWait = 60000L;
    }
}
