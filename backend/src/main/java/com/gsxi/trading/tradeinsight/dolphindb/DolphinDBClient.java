package com.gsxi.trading.tradeinsight.dolphindb;

import com.alibaba.druid.pool.DruidDataSource;
import com.gsxi.trading.tradeinsight.config.DolphinDBProperties;
import com.xxdb.DBConnection;
import com.xxdb.SimpleDBConnectionPool;
import com.xxdb.SimpleDBConnectionPoolConfig;
import com.xxdb.data.BasicTable;
import com.xxdb.data.Entity;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import javax.sql.DataSource;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * DolphinDB 统一访问门面：
 * <ul>
 *   <li>Java API（{@link SimpleDBConnectionPool}）：执行脚本、复杂时序分析、批量写入（tableInsert + BasicTable）。</li>
 *   <li>JDBC（内部 Druid 连接池 + {@link JdbcTemplate}）：实体级 SQL 读取、删除、计数。</li>
 * </ul>
 * 两者共用同一 DolphinDB 实例，符合“JDBC + Java API 结合”的改造选型。
 *
 * <p>注意：内部 JDBC 数据源未注册为 Spring 的 {@code DataSource} Bean，
 * 因此不会影响主数据源（MySQL/H2）的自动配置与事务管理。</p>
 *
 * @author gsxi
 */
public class DolphinDBClient {

    private static final Logger log = LoggerFactory.getLogger(DolphinDBClient.class);

    private final DolphinDBProperties props;
    private final SimpleDBConnectionPool pool;
    private final DruidDataSource jdbcDataSource;
    private final JdbcTemplate jdbcTemplate;

    public DolphinDBClient(DolphinDBProperties props) {
        this.props = props;
        // 1. Java API 连接池
        SimpleDBConnectionPoolConfig config = new SimpleDBConnectionPoolConfig();
        config.setHostName(props.getHost());
        config.setPort(props.getPort());
        config.setUserId(props.getUsername());
        config.setPassword(props.getPassword());
        config.setInitialPoolSize(props.getPool().getInitialSize());
        config.setEnableHighAvailability(false);
        this.pool = new SimpleDBConnectionPool(config);
        log.info("DolphinDB Java API 连接池已初始化: {}:{}", props.getHost(), props.getPort());

        // 2. JDBC 数据源（内部，不对外暴露为 DataSource Bean）
        this.jdbcDataSource = buildJdbcDataSource(props);
        this.jdbcTemplate = new JdbcTemplate(this.jdbcDataSource);
        log.info("DolphinDB JDBC 数据源已初始化: {}:{} database={}", props.getHost(), props.getPort(), props.getDatabase());
    }

    private DruidDataSource buildJdbcDataSource(DolphinDBProperties props) {
        DruidDataSource ds = new DruidDataSource();
        ds.setDriverClassName("com.dolphindb.jdbc.Driver");
        String user = urlEncode(props.getUsername());
        String pwd = urlEncode(props.getPassword());
        String db = urlEncode(props.getDatabase());
        ds.setUrl(String.format("jdbc:dolphindb://%s:%d?user=%s&password=%s&databasePath=%s",
                props.getHost(), props.getPort(), user, pwd, db));
        ds.setUsername(props.getUsername());
        ds.setPassword(props.getPassword());
        ds.setInitialSize(props.getPool().getInitialSize());
        ds.setMinIdle(props.getPool().getMinIdle());
        ds.setMaxActive(props.getPool().getMaxActive());
        ds.setMaxWait(props.getPool().getMaxWait());
        // DolphinDB 不支持标准校验 SQL，关闭 Druid 主动健康检测以避免兼容性问题
        ds.setValidationQuery(null);
        ds.setTestWhileIdle(false);
        ds.setTestOnBorrow(false);
        ds.setTestOnReturn(false);
        ds.setKeepAlive(false);
        return ds;
    }

    private static String urlEncode(String s) {
        return URLEncoder.encode(s == null ? "" : s, StandardCharsets.UTF_8);
    }

    // ==================== Java API：脚本执行 ====================

    /** 执行任意 DolphinDB 脚本，丢弃返回值（用于 DDL / 命令）。 */
    public void runScript(String script) {
        DBConnection conn = borrow();
        try {
            conn.run(script);
        } catch (IOException e) {
            throw new DolphinDBAccessException("执行 DolphinDB 脚本失败: " + e.getMessage(), e);
        } finally {
            release(conn);
        }
    }

    /** 执行脚本并返回结果表。 */
    public BasicTable runTable(String script) {
        DBConnection conn = borrow();
        try {
            Entity result = conn.run(script);
            if (result == null) {
                return null;
            }
            if (result instanceof BasicTable table) {
                return table;
            }
            throw new DolphinDBAccessException("脚本未返回表类型结果，实际类型: " + result.getClass().getSimpleName());
        } catch (IOException e) {
            throw new DolphinDBAccessException("查询 DolphinDB 表失败: " + e.getMessage(), e);
        } finally {
            release(conn);
        }
    }

    /** 执行脚本并返回单值标量（取第一行第一列，字符串形态便于上层解析）。 */
    public String runScalar(String script) {
        DBConnection conn = borrow();
        try {
            Entity result = conn.run(script);
            if (result == null) {
                return null;
            }
            return result.getString();
        } catch (IOException e) {
            throw new DolphinDBAccessException("查询 DolphinDB 标量失败: " + e.getMessage(), e);
        } finally {
            release(conn);
        }
    }

    // ==================== Java API：批量写入 ====================

    /**
     * 将内存表 {@code BasicTable} 批量追加到 DFS 表。
     * 采用 {@code tableInsert{loadTable(dbPath,tblName)}(data)} 模式，
     * 这是 DolphinDB 官方推荐的批量写入方式，效率远高于逐行 insert。
     *
     * @return 写入行数（取 BasicTable.rows()）
     */
    public int insertBasicTable(String dbPath, String tableName, BasicTable table) {
        if (table == null || table.rows() == 0) {
            return 0;
        }
        DBConnection conn = borrow();
        try {
            List<Entity> args = new ArrayList<>(1);
            args.add(table);
            conn.run(String.format("tableInsert{loadTable('%s','%s')}", dbPath, tableName), args);
            return table.rows();
        } catch (IOException e) {
            throw new DolphinDBAccessException("批量写入 DolphinDB 表失败: " + tableName + ": " + e.getMessage(), e);
        } finally {
            release(conn);
        }
    }

    // ==================== JDBC：SQL 读取 / 删除 / 计数 ====================

    public JdbcTemplate jdbc() {
        return jdbcTemplate;
    }

    public <T> List<T> query(String sql, RowMapper<T> rowMapper, Object... args) {
        return jdbcTemplate.query(sql, rowMapper, args);
    }

    public <T> T queryForObject(String sql, RowMapper<T> rowMapper, Object... args) {
        List<T> list = jdbcTemplate.query(sql, rowMapper, args);
        return list.isEmpty() ? null : list.get(0);
    }

    public Integer queryForInt(String sql, Object... args) {
        Integer v = queryForObject(sql, (rs, i) -> ValueConverter.toInteger(rs.getObject(1)), args);
        return v == null ? 0 : v;
    }

    public Long queryForLong(String sql, Object... args) {
        Long v = queryForObject(sql, (rs, i) -> ValueConverter.toLong(rs.getObject(1)), args);
        return v == null ? 0L : v;
    }

    public String queryForString(String sql, Object... args) {
        return queryForObject(sql, (rs, i) -> ValueConverter.toString(rs.getObject(1)), args);
    }

    /**
     * 执行删除/更新类 SQL。
     * 注意：DolphinDB JDBC 的 executeUpdate 不返回影响行数，故返回 -1 表示“已执行”。
     */
    public int update(String sql, Object... args) {
        jdbcTemplate.update(sql, args);
        return -1;
    }

    // ==================== 连接管理 ====================

    private DBConnection borrow() {
        try {
            return pool.getConnection();
        } catch (Exception e) {
            throw new DolphinDBAccessException("获取 DolphinDB 连接失败: " + e.getMessage(), e);
        }
    }

    private void release(DBConnection conn) {
        if (conn != null) {
            try {
                // 对从连接池获取的连接，close() 表示归还连接而非关闭会话
                conn.close();
            } catch (Exception e) {
                log.warn("归还 DolphinDB 连接失败: {}", e.getMessage());
            }
        }
    }

    public DolphinDBProperties getProperties() {
        return props;
    }

    @PreDestroy
    public void close() {
        try {
            pool.close();
        } catch (Exception e) {
            log.warn("关闭 DolphinDB Java API 连接池失败: {}", e.getMessage());
        }
        try {
            if (jdbcDataSource != null) {
                jdbcDataSource.close();
            }
        } catch (Exception e) {
            log.warn("关闭 DolphinDB JDBC 数据源失败: {}", e.getMessage());
        }
        log.info("DolphinDB 客户端资源已释放");
    }
}
