package com.gsxi.trading.tradeinsight.dolphindb;

import com.gsxi.trading.tradeinsight.dto.internal.*;
import com.gsxi.trading.tradeinsight.entity.StockLimitPool;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 涨跌停池数据 DolphinDB 仓库。
 *
 * <p>替代原 MyBatis {@code StockLimitPoolMapper}：
 * <ul>
 *   <li>基础 CRUD（批量写入、按日期+类型计数/删除）走 JDBC；</li>
 *   <li>单值/分组聚合统计走 DolphinDB SQL（iif/sum/count/avg/max + 子查询计算比率）；</li>
 *   <li>次日自连接/分位数等复杂分析在 Java 侧完成，规避 DolphinDB JOIN 语法差异风险。</li>
 * </ul>
 *
 * @author gsxi
 */
@Repository
public class StockLimitPoolDolphinDBRepository {

    private static final String TBL = "loadTable('dfs://tradeinsight','stock_limit_pool')";

    private final DolphinDBClient client;

    public StockLimitPoolDolphinDBRepository(DolphinDBClient client) {
        this.client = client;
    }

    // ==================== 基础 CRUD ====================

    /** 批量插入（逐行 JDBC insert，保证类型安全与空值处理；DolphinDB executeUpdate 不返回行数）。 */
    public int batchInsert(List<StockLimitPool> list) {
        if (list == null || list.isEmpty()) {
            return 0;
        }
        String sql = "insert into " + TBL + " (data_type,trade_date,stock_code,stock_name,industry,increase_rate," +
                "latest_price,turnover,circulation_market_value,total_market_value,turnover_rate,limit_funds," +
                "first_limit_time,limit_stats,dynamic_pe,limit_turnover,continuous_limit,last_limit_time," +
                "blast_times,create_time) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        for (StockLimitPool e : list) {
            client.update(sql,
                    e.getDataType(), e.getTradeDate(), e.getStockCode(), e.getStockName(), e.getIndustry(),
                    toDouble(e.getIncreaseRate()), toDouble(e.getLatestPrice()), e.getTurnover(),
                    toDouble(e.getCirculationMarketValue()), toDouble(e.getTotalMarketValue()), toDouble(e.getTurnoverRate()),
                    e.getLimitFunds(), formatTime(e.getFirstLimitTime()), e.getLimitStats(),
                    toDouble(e.getDynamicPe()), e.getLimitTurnover(), e.getContinuousLimit(),
                    formatTime(e.getLastLimitTime()), e.getBlastTimes(), e.getCreateTime());
        }
        return list.size();
    }

    /** 统计指定日期+类型的数据数量。 */
    public int countByTradeDateAndType(LocalDate tradeDate, String dataType) {
        return client.queryForInt("select count(*) from " + TBL + " where trade_date=? and data_type=?",
                tradeDate, dataType);
    }

    /** 根据日期和类型删除数据。 */
    public int deleteByTradeDateAndType(LocalDate tradeDate, String dataType) {
        return client.update("delete from " + TBL + " where trade_date=? and data_type=?", tradeDate, dataType);
    }

    // ==================== 基础统计 ====================

    /** 指定日期基础统计（涨停+跌停综合）。 */
    public BasicStatisticsDTO getBasicStatistics(LocalDate date) {
        String sql = "select limitUpCount, limitUpOneWordCount, limitUpBlastResealCount, limitUpMaxContinuous, " +
                "iif(limitUpCount=0, 0, round(limitUpCont2*100.0/limitUpCount,2)) as limitUpContinuousRate, " +
                "limitUpTotalSealFunds, limitUpAvgSealFunds, limitDownCount, limitDownOneWordCount, limitDownOpenCount, " +
                "limitDownMaxContinuous, iif(limitDownCount=0, 0, round(limitDownCont2*100.0/limitDownCount,2)) as limitDownContinuousRate, " +
                "limitDownTotalSealFunds, limitDownAvgSealFunds, totalMarketValue, " +
                "iif(limitDownCount=0, null, round(limitUpCount*1.0/limitDownCount,2)) as limitUpDownRatio " +
                "from (select " +
                "sum(iif(data_type='LIMIT_UP',1,0)) as limitUpCount, " +
                "sum(iif(data_type='LIMIT_UP' and last_limit_time<='09:26:00',1,0)) as limitUpOneWordCount, " +
                "sum(iif(data_type='LIMIT_UP' and blast_times>0,1,0)) as limitUpBlastResealCount, " +
                "max(iif(data_type='LIMIT_UP',continuous_limit,0)) as limitUpMaxContinuous, " +
                "sum(iif(data_type='LIMIT_UP' and continuous_limit>=2,1,0)) as limitUpCont2, " +
                "sum(iif(data_type='LIMIT_UP', iif(isNull(limit_funds),0,limit_funds), 0)) as limitUpTotalSealFunds, " +
                "avg(iif(data_type='LIMIT_UP', iif(isNull(limit_funds),0,limit_funds), null)) as limitUpAvgSealFunds, " +
                "sum(iif(data_type='LIMIT_DOWN',1,0)) as limitDownCount, " +
                "sum(iif(data_type='LIMIT_DOWN' and last_limit_time<='09:26:00',1,0)) as limitDownOneWordCount, " +
                "sum(iif(data_type='LIMIT_DOWN' and blast_times>0,1,0)) as limitDownOpenCount, " +
                "max(iif(data_type='LIMIT_DOWN',continuous_limit,0)) as limitDownMaxContinuous, " +
                "sum(iif(data_type='LIMIT_DOWN' and continuous_limit>=2,1,0)) as limitDownCont2, " +
                "sum(iif(data_type='LIMIT_DOWN', iif(isNull(limit_funds),0,limit_funds), 0)) as limitDownTotalSealFunds, " +
                "avg(iif(data_type='LIMIT_DOWN', iif(isNull(limit_funds),0,limit_funds), null)) as limitDownAvgSealFunds, " +
                "sum(iif(isNull(total_market_value),0,total_market_value)) as totalMarketValue " +
                "from " + TBL + " where trade_date=?)";
        BasicStatisticsDTO dto = client.queryForObject(sql, new DolphinDBRowMapper<>(BasicStatisticsDTO.class), date);
        if (dto != null) {
            dto.setTradeDate(date);
        }
        return dto;
    }

    /** 日期范围基础统计（按交易日分组）。 */
    public List<BasicStatisticsDTO> getBasicStatisticsRange(LocalDate startDate, LocalDate endDate) {
        String sql = "select trade_date as tradeDate, " +
                "sum(iif(data_type='LIMIT_UP',1,0)) as limitUpCount, " +
                "sum(iif(data_type='LIMIT_UP' and first_limit_time<='09:26:00',1,0)) as limitUpOneWordCount, " +
                "sum(iif(data_type='LIMIT_UP' and blast_times>0,1,0)) as limitUpBlastResealCount, " +
                "max(iif(data_type='LIMIT_UP',continuous_limit,0)) as limitUpMaxContinuous, " +
                "iif(sum(iif(data_type='LIMIT_UP',1,0))=0, 0, round(sum(iif(data_type='LIMIT_UP' and continuous_limit>=2,1,0))*100.0/sum(iif(data_type='LIMIT_UP',1,0)),2)) as limitUpContinuousRate, " +
                "sum(iif(data_type='LIMIT_UP', iif(isNull(limit_funds),0,limit_funds), 0)) as limitUpTotalSealFunds, " +
                "avg(iif(data_type='LIMIT_UP', iif(isNull(limit_funds),0,limit_funds), null)) as limitUpAvgSealFunds, " +
                "sum(iif(data_type='LIMIT_DOWN',1,0)) as limitDownCount, " +
                "sum(iif(data_type='LIMIT_DOWN' and first_limit_time<='09:26:00',1,0)) as limitDownOneWordCount, " +
                "sum(iif(data_type='LIMIT_DOWN' and blast_times>0,1,0)) as limitDownOpenCount, " +
                "max(iif(data_type='LIMIT_DOWN',continuous_limit,0)) as limitDownMaxContinuous, " +
                "iif(sum(iif(data_type='LIMIT_DOWN',1,0))=0, 0, round(sum(iif(data_type='LIMIT_DOWN' and continuous_limit>=2,1,0))*100.0/sum(iif(data_type='LIMIT_DOWN',1,0)),2)) as limitDownContinuousRate, " +
                "sum(iif(data_type='LIMIT_DOWN', iif(isNull(limit_funds),0,limit_funds), 0)) as limitDownTotalSealFunds, " +
                "avg(iif(data_type='LIMIT_DOWN', iif(isNull(limit_funds),0,limit_funds), null)) as limitDownAvgSealFunds, " +
                "iif(sum(iif(data_type='LIMIT_DOWN',1,0))=0, null, round(sum(iif(data_type='LIMIT_UP',1,0))*1.0/sum(iif(data_type='LIMIT_DOWN',1,0)),2)) as limitUpDownRatio, " +
                "sum(iif(isNull(total_market_value),0,total_market_value)) as totalMarketValue " +
                "from " + TBL + " where trade_date between ? and ? group by trade_date order by trade_date";
        return client.query(sql, new DolphinDBRowMapper<>(BasicStatisticsDTO.class), startDate, endDate);
    }

    // ==================== 涨跌停板详细统计 ====================

    /** 指定日期和类型的涨跌停板统计。 */
    public LimitBoardStatisticsDTO getLimitBoardStatistics(LocalDate date, String dataType) {
        String sql = "select " +
                "count(*) as totalCount, " +
                "sum(iif(blast_times=0,1,0)) as oneWordBoardCount, " +
                "max(continuous_limit) as maxContinuousLimit, " +
                "sum(iif(isNull(limit_funds),0,limit_funds)) as totalSealFunds, " +
                "avg(iif(isNull(limit_funds),0,limit_funds)) as avgSealFunds, " +
                (isLimitUp(dataType)
                        ? "sum(iif(blast_times>0,1,0)) as blastAndResealCount, 0 as openBoardCount, 0 as avgDynamicPe "
                        : "0 as blastAndResealCount, sum(iif(blast_times>0,1,0)) as openBoardCount, avg(iif(isNull(dynamic_pe),0,dynamic_pe)) as avgDynamicPe ") +
                "from " + TBL + " where trade_date=? and data_type=?";
        LimitBoardStatisticsDTO dto = client.queryForObject(sql, new DolphinDBRowMapper<>(LimitBoardStatisticsDTO.class), date, dataType);
        if (dto != null) {
            dto.setTradeDate(date);
            dto.setDataType(dataType);
        }
        return dto;
    }

    /** 日期范围涨跌停板统计（按交易日分组）。 */
    public List<LimitBoardStatisticsDTO> getLimitBoardStatisticsRange(LocalDate startDate, LocalDate endDate, String dataType) {
        String upExtra = "sum(iif(blast_times>0,1,0)) as blastAndResealCount, 0 as openBoardCount, 0 as avgDynamicPe ";
        String downExtra = "0 as blastAndResealCount, sum(iif(blast_times>0,1,0)) as openBoardCount, avg(iif(isNull(dynamic_pe),0,dynamic_pe)) as avgDynamicPe ";
        String sql = "select trade_date as tradeDate, count(*) as totalCount, " +
                "sum(iif(blast_times=0,1,0)) as oneWordBoardCount, max(continuous_limit) as maxContinuousLimit, " +
                "sum(iif(isNull(limit_funds),0,limit_funds)) as totalSealFunds, avg(iif(isNull(limit_funds),0,limit_funds)) as avgSealFunds, " +
                (isLimitUp(dataType) ? upExtra : downExtra) +
                "from " + TBL + " where trade_date between ? and ? and data_type=? group by trade_date order by trade_date";
        List<LimitBoardStatisticsDTO> list = client.query(sql, new DolphinDBRowMapper<>(LimitBoardStatisticsDTO.class), startDate, endDate, dataType);
        if (list != null) {
            list.forEach(d -> d.setDataType(dataType));
        }
        return list;
    }

    // ==================== 连板分析 ====================

    /** 连板分布统计。 */
    public List<ContinuousLimitDistributionDTO> getContinuousLimitDistribution(LocalDate date, String dataType) {
        String sql = "select continuous_limit as continuousLimit, count(*) as count, " +
                "avg(iif(isNull(limit_funds),0,limit_funds)) as avgSealFunds, avg(total_market_value) as avgMarketValue " +
                "from " + TBL + " where trade_date=? and data_type=? group by continuous_limit order by continuous_limit";
        List<ContinuousLimitDistributionDTO> list = client.query(sql, new DolphinDBRowMapper<>(ContinuousLimitDistributionDTO.class), date, dataType);
        if (list == null || list.isEmpty()) {
            return Collections.emptyList();
        }
        long total = 0;
        for (ContinuousLimitDistributionDTO d : list) {
            total += d.getCount() == null ? 0 : d.getCount();
        }
        for (ContinuousLimitDistributionDTO d : list) {
            long c = d.getCount() == null ? 0 : d.getCount();
            d.setPercentage(total == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(c * 100.0 / total).setScale(2, RoundingMode.HALF_UP));
        }
        return list;
    }

    /** 连板成功率分析（Java 侧合并当日总数与次日成功数）。 */
    public List<ContinuousLimitSuccessRateDTO> getContinuousLimitSuccessRate(LocalDate startDate, LocalDate endDate, String dataType) {
        String totalSql = "select continuous_limit as continuousLimit, count(*) as totalCount from " + TBL +
                " where trade_date between ? and ? and data_type=? and continuous_limit>=2 group by continuous_limit order by continuous_limit";
        List<ContinuousLimitSuccessRateDTO> list = client.query(totalSql, new DolphinDBRowMapper<>(ContinuousLimitSuccessRateDTO.class), startDate, endDate, dataType);
        if (list == null || list.isEmpty()) {
            return Collections.emptyList();
        }
        // 次日成功数：当日股次日仍在池中（同类型）
        String successSql = "select t1.continuous_limit as continuousLimit, count(*) as successCount from " + TBL + " t1 " +
                "inner join " + TBL + " t2 on t1.stock_code=t2.stock_code and t2.trade_date=t1.trade_date+1 and t2.data_type=t1.data_type " +
                "where t1.trade_date between ? and ? and t1.data_type=? and t1.continuous_limit>=2 group by t1.continuous_limit";
        List<ContinuousLimitSuccessRateDTO> successList = client.query(successSql, new DolphinDBRowMapper<>(ContinuousLimitSuccessRateDTO.class), startDate, endDate, dataType);
        Map<Integer, Long> successMap = new HashMap<>();
        if (successList != null) {
            for (ContinuousLimitSuccessRateDTO s : successList) {
                if (s.getContinuousLimit() != null && s.getSuccessCount() != null) {
                    successMap.put(s.getContinuousLimit(), s.getSuccessCount().longValue());
                }
            }
        }
        for (ContinuousLimitSuccessRateDTO d : list) {
            d.setDataType(dataType);
            d.setSuccessCount(successMap.getOrDefault(d.getContinuousLimit(), 0L));
            // successRate 留空，由 DTO.calculateSuccessRate() 计算
            d.setSuccessRate(null);
        }
        return list;
    }

    // ==================== 时间分布 ====================

    /** 时间分布统计（Java 侧按 first_limit_time 分桶）。 */
    public List<TimeDistributionDTO> getTimeDistribution(LocalDate date, String dataType) {
        String sql = "select first_limit_time as firstLimitTime from " + TBL +
                " where trade_date=? and data_type=? and not isNull(first_limit_time)";
        List<Map<String, Object>> rows = client.jdbc().queryForList(sql, date, dataType);
        LinkedHashMap<String, TimeAgg> agg = new LinkedHashMap<>();
        for (String[] b : TIME_BUCKETS) {
            agg.put(b[0], new TimeAgg(b[0], b[1]));
        }
        int total = 0;
        if (rows != null) {
            for (Map<String, Object> row : rows) {
                String t = ValueConverter.toString(row.get("firstLimitTime"));
                if (t == null || t.length() < 5) {
                    t = "09:30:00";
                }
                agg.get(bucketOf(t)).count++;
                total++;
            }
        }
        List<TimeDistributionDTO> result = new ArrayList<>();
        for (String[] b : TIME_BUCKETS) {
            TimeAgg a = agg.get(b[0]);
            int cnt = a.count;
            result.add(TimeDistributionDTO.builder()
                    .timeRange(b[0])
                    .timeDesc(b[1])
                    .count(cnt)
                    .percentage(total == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(cnt * 100.0 / total).setScale(2, RoundingMode.HALF_UP))
                    .build());
        }
        return result;
    }

    // ==================== 行业分析 ====================

    /** 行业分布统计。 */
    public List<IndustryDistributionDTO> getIndustryDistribution(LocalDate date, String dataType) {
        String sql = "select iif(isNull(industry),'未知行业',industry) as industry, count(*) as count, " +
                "avg(iif(isNull(limit_funds),0,limit_funds)) as avgSealFunds, avg(total_market_value) as avgMarketValue " +
                "from " + TBL + " where trade_date=? and data_type=? group by iif(isNull(industry),'未知行业',industry) order by count desc";
        List<IndustryDistributionDTO> list = client.query(sql, new DolphinDBRowMapper<>(IndustryDistributionDTO.class), date, dataType);
        if (list == null || list.isEmpty()) {
            return Collections.emptyList();
        }
        long total = 0;
        for (IndustryDistributionDTO d : list) {
            total += d.getCount() == null ? 0 : d.getCount();
        }
        int rank = 1;
        for (IndustryDistributionDTO d : list) {
            long c = d.getCount() == null ? 0 : d.getCount();
            d.setPercentage(total == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(c * 100.0 / total).setScale(2, RoundingMode.HALF_UP));
            d.setRank(rank++);
        }
        return list;
    }

    /** 行业涨跌停对比分析。 */
    public List<IndustryComparisonDTO> getIndustryComparisonAnalysis(LocalDate date) {
        String sql = "select iif(isNull(industry),'未知行业',industry) as industry, " +
                "sum(iif(data_type='LIMIT_UP',1,0)) as limitUpCount, sum(iif(data_type='LIMIT_DOWN',1,0)) as limitDownCount " +
                "from " + TBL + " where trade_date=? group by iif(isNull(industry),'未知行业',industry) " +
                "having sum(iif(data_type='LIMIT_UP',1,0))+sum(iif(data_type='LIMIT_DOWN',1,0))>0 order by limitUpCount desc";
        List<IndustryComparisonDTO> list = client.query(sql, new DolphinDBRowMapper<>(IndustryComparisonDTO.class), date);
        if (list == null) {
            return Collections.emptyList();
        }
        for (IndustryComparisonDTO d : list) {
            // netRatio 留空，由 DTO.calculateNetRatio() 计算
            d.setNetRatio(null);
        }
        return list;
    }

    // ==================== 质量分析 ====================

    /** 涨跌停板质量统计。 */
    public LimitBoardQualityDTO getQualityStatistics(LocalDate date, String dataType) {
        String base = "count(*) as totalCount, " +
                "sum(iif(blast_times=0,1,0)) as oneWordRaw, " +
                "sum(iif(not isNull(first_limit_time) and first_limit_time<'10:30:00',1,0)) as earlyRaw, " +
                "sum(iif(not isNull(first_limit_time) and first_limit_time>='10:30:00' and first_limit_time<'14:30:00',1,0)) as noonRaw, " +
                "sum(iif(not isNull(first_limit_time) and first_limit_time>='14:30:00',1,0)) as lateRaw, " +
                "avg(iif(isNull(limit_funds),0,limit_funds)) as avgSealStrength, " +
                "sum(iif(iif(isNull(limit_funds),0,limit_funds)>10000000,1,0)) as strongRaw, " +
                (isLimitUp(dataType)
                        ? "sum(iif(blast_times>0,1,0)) as blastCount, sum(iif(blast_times>0,1,0)) as resealCount, avg(iif(blast_times>0,blast_times,null)) as avgBlastTimes, " +
                        "0 as avgDynamicPe, 0 as lowPeRaw, 0 as openBoardCount, 0 as avgOpenTimes "
                        : "0 as blastCount, 0 as resealCount, 0 as avgBlastTimes, " +
                        "avg(iif(isNull(dynamic_pe),0,dynamic_pe)) as avgDynamicPe, sum(iif(not isNull(dynamic_pe) and dynamic_pe>0 and dynamic_pe<20,1,0)) as lowPeRaw, " +
                        "sum(iif(blast_times>0,1,0)) as openBoardCount, avg(iif(blast_times>0,blast_times,null)) as avgOpenTimes ");
        String sql = "select iif(totalCount=0,0,round(oneWordRaw*100.0/totalCount,2)) as oneWordBoardRate, " +
                "iif(totalCount=0,0,round(earlyRaw*100.0/totalCount,2)) as earlyLimitRate, iif(totalCount=0,0,round(noonRaw*100.0/totalCount,2)) as noonLimitRate, " +
                "iif(totalCount=0,0,round(lateRaw*100.0/totalCount,2)) as lateLimitRate, avgSealStrength, " +
                "iif(totalCount=0,0,round(strongRaw*100.0/totalCount,2)) as strongSealRate, " +
                "blastCount, resealCount, avgBlastTimes, avgDynamicPe, iif(totalCount=0,0,round(lowPeRaw*100.0/totalCount,2)) as lowPeRate, " +
                "openBoardCount, avgOpenTimes " +
                "from (select " + base + "from " + TBL + " where trade_date=? and data_type=?)";
        LimitBoardQualityDTO dto = client.queryForObject(sql, new DolphinDBRowMapper<>(LimitBoardQualityDTO.class), date, dataType);
        if (dto != null) {
            dto.setTradeDate(date);
            dto.setDataType(dataType);
        }
        return dto;
    }

    /** 封单强度分布。 */
    public List<SealStrengthDistributionDTO> getSealStrengthDistribution(LocalDate date, String dataType) {
        String sql = "select iif(isNull(limit_funds) or limit_funds=0,'无封单'," +
                "iif(limit_funds<1000000,'0-100万',iif(limit_funds<5000000,'100-500万',iif(limit_funds<10000000,'500-1000万'," +
                "iif(limit_funds<50000000,'1000-5000万',iif(limit_funds<100000000,'5000万-1亿','1亿以上')))))) as `range`, " +
                "count(*) as count from " + TBL + " where trade_date=? and data_type=? " +
                "group by iif(isNull(limit_funds) or limit_funds=0,'无封单'," +
                "iif(limit_funds<1000000,'0-100万',iif(limit_funds<5000000,'100-500万',iif(limit_funds<10000000,'500-1000万'," +
                "iif(limit_funds<50000000,'1000-5000万',iif(limit_funds<100000000,'5000万-1亿','1亿以上')))))) " +
                "order by `range`";
        List<SealStrengthDistributionDTO> list = client.query(sql, new DolphinDBRowMapper<>(SealStrengthDistributionDTO.class), date, dataType);
        if (list == null || list.isEmpty()) {
            return Collections.emptyList();
        }
        long total = 0;
        for (SealStrengthDistributionDTO d : list) {
            total += d.getCount() == null ? 0L : d.getCount();
        }
        for (SealStrengthDistributionDTO d : list) {
            long c = d.getCount() == null ? 0L : d.getCount();
            d.setPercentage(total == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(c * 100.0 / total).setScale(2, RoundingMode.HALF_UP));
        }
        return list;
    }

    /** 跌停板市盈率分布。 */
    public List<PeDistributionDTO> getPeDistribution(LocalDate date) {
        String sql = "select iif(isNull(dynamic_pe),'未知',iif(dynamic_pe<=0,'负值或零',iif(dynamic_pe<20,'0-20'," +
                "iif(dynamic_pe<50,'20-50',iif(dynamic_pe<100,'50-100','100以上'))))) as peRange, count(*) as count " +
                "from " + TBL + " where trade_date=? and data_type='LIMIT_DOWN' " +
                "group by iif(isNull(dynamic_pe),'未知',iif(dynamic_pe<=0,'负值或零',iif(dynamic_pe<20,'0-20'," +
                "iif(dynamic_pe<50,'20-50',iif(dynamic_pe<100,'50-100','100以上'))))) order by peRange";
        List<PeDistributionDTO> list = client.query(sql, new DolphinDBRowMapper<>(PeDistributionDTO.class), date);
        if (list == null || list.isEmpty()) {
            return Collections.emptyList();
        }
        long total = 0;
        for (PeDistributionDTO d : list) {
            total += d.getCount() == null ? 0L : d.getCount();
        }
        for (PeDistributionDTO d : list) {
            long c = d.getCount() == null ? 0L : d.getCount();
            d.setPercentage(total == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(c * 100.0 / total).setScale(2, RoundingMode.HALF_UP));
        }
        return list;
    }

    // ==================== 跌停板反弹分析（Java 侧次日连接） ====================

    public LimitDownReboundDTO getLimitDownReboundAnalysis(LocalDate date) {
        List<ReboundRow> rows = fetchReboundRows(date, ReboundGroup.NONE);
        int total = rows.size();
        int rebound = (int) rows.stream().filter(r -> r.nextIncrease != null && r.nextIncrease > 0).count();
        DoubleSummaryStatistics ss = rows.stream().filter(r -> r.nextIncrease != null && r.nextIncrease > 0)
                .mapToDouble(r -> r.nextIncrease).summaryStatistics();
        BigDecimal avg = ss.getCount() == 0 ? null : BigDecimal.valueOf(ss.getAverage()).setScale(4, RoundingMode.HALF_UP);
        return LimitDownReboundDTO.builder().tradeDate(date).totalLimitDownCount(total).reboundCount(rebound).avgReboundIncrease(avg).build();
    }

    public List<LimitDownReboundDTO> getLimitDownReboundByConsecutive(LocalDate date) {
        List<ReboundRow> rows = fetchReboundRows(date, ReboundGroup.NONE);
        Map<Integer, List<ReboundRow>> grouped = rows.stream().collect(Collectors.groupingBy(r -> r.continuousLimit, TreeMap::new, Collectors.toList()));
        List<LimitDownReboundDTO> result = new ArrayList<>();
        for (Map.Entry<Integer, List<ReboundRow>> e : grouped.entrySet()) {
            result.add(buildRebound(e.getKey(), e.getValue(), date));
        }
        return result;
    }

    public List<LimitDownReboundDTO> getLimitDownReboundByIndustry(LocalDate date) {
        List<ReboundRow> rows = fetchReboundRows(date, ReboundGroup.NONE);
        Map<String, List<ReboundRow>> grouped = rows.stream().collect(Collectors.groupingBy(r -> r.industry == null ? "未知行业" : r.industry, TreeMap::new, Collectors.toList()));
        List<LimitDownReboundDTO> result = new ArrayList<>();
        for (Map.Entry<String, List<ReboundRow>> e : grouped.entrySet()) {
            result.add(buildRebound(e.getKey(), e.getValue(), date));
        }
        return result;
    }

    public List<LimitDownReboundDTO> getLimitDownReboundByPe(LocalDate date) {
        List<ReboundRow> rows = fetchReboundRows(date, ReboundGroup.NONE);
        Map<String, List<ReboundRow>> grouped = rows.stream().collect(Collectors.groupingBy(r -> r.peRange, TreeMap::new, Collectors.toList()));
        List<LimitDownReboundDTO> result = new ArrayList<>();
        for (Map.Entry<String, List<ReboundRow>> e : grouped.entrySet()) {
            result.add(buildRebound(e.getKey(), e.getValue(), date));
        }
        return result;
    }

    private LimitDownReboundDTO buildRebound(Object key, List<ReboundRow> rows, LocalDate date) {
        int total = rows.size();
        int rebound = (int) rows.stream().filter(r -> r.nextIncrease != null && r.nextIncrease > 0).count();
        DoubleSummaryStatistics ss = rows.stream().filter(r -> r.nextIncrease != null && r.nextIncrease > 0)
                .mapToDouble(r -> r.nextIncrease).summaryStatistics();
        BigDecimal avg = ss.getCount() == 0 ? null : BigDecimal.valueOf(ss.getAverage()).setScale(4, RoundingMode.HALF_UP);
        // 按 ByConsecutive 用 continuousLimit 作 totalLimitDownCount；其它用 count
        return LimitDownReboundDTO.builder().tradeDate(date)
                .totalLimitDownCount(key instanceof Integer ? (Integer) key : total)
                .reboundCount(rebound).avgReboundIncrease(avg).build();
    }

    /** 拉取当日跌停股 + 次日同股票涨幅（Java 侧连接）。 */
    private List<ReboundRow> fetchReboundRows(LocalDate date, ReboundGroup group) {
        List<ReboundRow> rows = new ArrayList<>();
        String sql = "select stock_code, continuous_limit, industry, dynamic_pe from " + TBL +
                " where trade_date=? and data_type='LIMIT_DOWN'";
        List<Map<String, Object>> day1 = client.jdbc().queryForList(sql, date);
        if (day1 == null || day1.isEmpty()) {
            return rows;
        }
        // 次日同股票池内记录（取 increase_rate）
        String nextSql = "select stock_code, increase_rate as nextIncrease from " + TBL + " where trade_date=?";
        List<Map<String, Object>> day2 = client.jdbc().queryForList(nextSql, date.plusDays(1));
        Map<String, Double> nextMap = new HashMap<>();
        if (day2 != null) {
            for (Map<String, Object> row : day2) {
                String code = ValueConverter.toString(row.get("stock_code"));
                Double inc = ValueConverter.toDouble(row.get("nextIncrease"));
                if (code != null && inc != null) {
                    nextMap.putIfAbsent(code, inc);
                }
            }
        }
        for (Map<String, Object> row : day1) {
            ReboundRow r = new ReboundRow();
            r.stockCode = ValueConverter.toString(row.get("stock_code"));
            r.continuousLimit = ValueConverter.toInteger(row.get("continuous_limit"));
            r.industry = ValueConverter.toString(row.get("industry"));
            r.dynamicPe = ValueConverter.toBigDecimal(row.get("dynamic_pe"));
            r.nextIncrease = nextMap.get(r.stockCode);
            r.peRange = peRangeOf(r.dynamicPe);
            rows.add(r);
        }
        return rows;
    }

    // ==================== 涨跌停对比分析 ====================

    public LimitBoardComparisonDTO getLimitBoardComparison(LocalDate date) {
        String sql = "select sum(iif(data_type='LIMIT_UP',1,0)) as limitUpCount, sum(iif(data_type='LIMIT_DOWN',1,0)) as limitDownCount, " +
                "sum(iif(data_type='LIMIT_UP', iif(isNull(limit_funds),0,limit_funds), 0)) as limitUpTotalFunds, " +
                "sum(iif(data_type='LIMIT_DOWN', iif(isNull(limit_funds),0,limit_funds), 0)) as limitDownTotalFunds, " +
                "iif(sum(iif(data_type='LIMIT_UP',1,0))=0, 0, round(sum(iif(data_type='LIMIT_UP' and blast_times=0,1,0))*100.0/sum(iif(data_type='LIMIT_UP',1,0)),2)) as limitUpOneWordRate, " +
                "iif(sum(iif(data_type='LIMIT_DOWN',1,0))=0, 0, round(sum(iif(data_type='LIMIT_DOWN' and blast_times=0,1,0))*100.0/sum(iif(data_type='LIMIT_DOWN',1,0)),2)) as limitDownOneWordRate, " +
                "iif(sum(iif(data_type='LIMIT_UP',1,0))=0, 0, round(sum(iif(data_type='LIMIT_UP' and continuous_limit>=2,1,0))*100.0/sum(iif(data_type='LIMIT_UP',1,0)),2)) as limitUpContinuousRate, " +
                "iif(sum(iif(data_type='LIMIT_DOWN',1,0))=0, 0, round(sum(iif(data_type='LIMIT_DOWN' and continuous_limit>=2,1,0))*100.0/sum(iif(data_type='LIMIT_DOWN',1,0)),2)) as limitDownContinuousRate " +
                "from " + TBL + " where trade_date=?";
        LimitBoardComparisonDTO dto = client.queryForObject(sql, new DolphinDBRowMapper<>(LimitBoardComparisonDTO.class), date);
        if (dto != null) {
            dto.setTradeDate(date);
        }
        return dto;
    }

    public List<LimitBoardComparisonDTO> getLimitBoardComparisonRange(LocalDate startDate, LocalDate endDate) {
        String sql = "select trade_date as tradeDate, " +
                "sum(iif(data_type='LIMIT_UP',1,0)) as limitUpCount, sum(iif(data_type='LIMIT_DOWN',1,0)) as limitDownCount, " +
                "sum(iif(data_type='LIMIT_UP', iif(isNull(limit_funds),0,limit_funds), 0)) as limitUpTotalFunds, " +
                "sum(iif(data_type='LIMIT_DOWN', iif(isNull(limit_funds),0,limit_funds), 0)) as limitDownTotalFunds, " +
                "iif(sum(iif(data_type='LIMIT_UP',1,0))=0, 0, round(sum(iif(data_type='LIMIT_UP' and blast_times=0,1,0))*100.0/sum(iif(data_type='LIMIT_UP',1,0)),2)) as limitUpOneWordRate, " +
                "iif(sum(iif(data_type='LIMIT_DOWN',1,0))=0, 0, round(sum(iif(data_type='LIMIT_DOWN' and blast_times=0,1,0))*100.0/sum(iif(data_type='LIMIT_DOWN',1,0)),2)) as limitDownOneWordRate, " +
                "iif(sum(iif(data_type='LIMIT_UP',1,0))=0, 0, round(sum(iif(data_type='LIMIT_UP' and continuous_limit>=2,1,0))*100.0/sum(iif(data_type='LIMIT_UP',1,0)),2)) as limitUpContinuousRate, " +
                "iif(sum(iif(data_type='LIMIT_DOWN',1,0))=0, 0, round(sum(iif(data_type='LIMIT_DOWN' and continuous_limit>=2,1,0))*100.0/sum(iif(data_type='LIMIT_DOWN',1,0)),2)) as limitDownContinuousRate " +
                "from " + TBL + " where trade_date between ? and ? group by trade_date order by trade_date";
        return client.query(sql, new DolphinDBRowMapper<>(LimitBoardComparisonDTO.class), startDate, endDate);
    }

    // ==================== 市场情绪指标 ====================

    public SentimentIndicatorDTO getSentimentIndicator(LocalDate date) {
        String sql = "select iif(sum(iif(data_type='LIMIT_DOWN',1,0))=0, null, round(sum(iif(data_type='LIMIT_UP',1,0))*1.0/sum(iif(data_type='LIMIT_DOWN',1,0)),2)) as limitUpDownRatio, " +
                "iif(count(*)=0, 0, round(sum(iif(continuous_limit>=2,1,0))*100.0/count(*),2)) as continuousLimitRate, " +
                "iif(sum(iif(data_type='LIMIT_UP',1,0))=0, 0, round(sum(iif(data_type='LIMIT_UP' and blast_times>0,1,0))*100.0/sum(iif(data_type='LIMIT_UP',1,0)),2)) as blastRate, " +
                "sum(iif(isNull(limit_funds),0,limit_funds)) as totalSealFunds, avg(iif(isNull(limit_funds),0,limit_funds)) as avgSealFunds, " +
                "iif(sum(iif(data_type='LIMIT_UP',1,0))=0, 0, round(sum(iif(data_type='LIMIT_UP' and not isNull(first_limit_time) and first_limit_time<'10:30:00',1,0))*100.0/sum(iif(data_type='LIMIT_UP',1,0)),2)) as earlyLimitRate, " +
                "iif(sum(iif(data_type='LIMIT_UP',1,0))=0, 0, round(sum(iif(data_type='LIMIT_UP' and not isNull(first_limit_time) and first_limit_time>='14:30:00',1,0))*100.0/sum(iif(data_type='LIMIT_UP',1,0)),2)) as lateLimitRate " +
                "from " + TBL + " where trade_date=?";
        SentimentIndicatorDTO dto = client.queryForObject(sql, new DolphinDBRowMapper<>(SentimentIndicatorDTO.class), date);
        if (dto != null) {
            dto.setTradeDate(date);
        }
        return dto;
    }

    public List<SentimentTrendDTO> getSentimentTrend(LocalDate startDate, LocalDate endDate) {
        String sql = "select trade_date as tradeDate, " +
                "iif(sum(iif(data_type='LIMIT_DOWN',1,0))=0, null, round(sum(iif(data_type='LIMIT_UP',1,0))*1.0/sum(iif(data_type='LIMIT_DOWN',1,0)),2)) as limitUpDownRatio, " +
                "iif(count(*)=0, 0, round(sum(iif(continuous_limit>=2,1,0))*100.0/count(*),2)) as continuousLimitRate, " +
                "iif(sum(iif(data_type='LIMIT_UP',1,0))=0, 0, round(sum(iif(data_type='LIMIT_UP' and blast_times>0,1,0))*100.0/sum(iif(data_type='LIMIT_UP',1,0)),2)) as blastRate, " +
                "sum(iif(isNull(limit_funds),0,limit_funds)) as totalSealFunds, avg(iif(isNull(limit_funds),0,limit_funds)) as avgSealFunds, " +
                "iif(sum(iif(data_type='LIMIT_UP',1,0))=0, 0, round(sum(iif(data_type='LIMIT_UP' and not isNull(first_limit_time) and first_limit_time<'10:30:00',1,0))*100.0/sum(iif(data_type='LIMIT_UP',1,0)),2)) as earlyLimitRate, " +
                "iif(sum(iif(data_type='LIMIT_UP',1,0))=0, 0, round(sum(iif(data_type='LIMIT_UP' and not isNull(first_limit_time) and first_limit_time>='14:30:00',1,0))*100.0/sum(iif(data_type='LIMIT_UP',1,0)),2)) as lateLimitRate, " +
                "sum(iif(data_type='LIMIT_UP',1,0)) as limitUpCount, sum(iif(data_type='LIMIT_DOWN',1,0)) as limitDownCount " +
                "from " + TBL + " where trade_date between ? and ? group by trade_date order by trade_date";
        return client.query(sql, new DolphinDBRowMapper<>(SentimentTrendDTO.class), startDate, endDate);
    }

    // ==================== 历史对比 / 分位数（Java 侧计算） ====================

    public List<HistoricalDataDTO> getHistoricalData(LocalDate startDate, LocalDate endDate) {
        String sql = "select trade_date as tradeDate, " +
                "sum(iif(data_type='LIMIT_UP',1,0)) as limitUpCount, sum(iif(data_type='LIMIT_DOWN',1,0)) as limitDownCount, " +
                "iif(sum(iif(data_type='LIMIT_DOWN',1,0))=0, null, round(sum(iif(data_type='LIMIT_UP',1,0))*1.0/sum(iif(data_type='LIMIT_DOWN',1,0)),2)) as limitUpDownRatio, " +
                "iif(count(*)=0, 0, round(sum(iif(continuous_limit>=2,1,0))*100.0/count(*),2)) as continuousLimitRate, " +
                "iif(sum(iif(data_type='LIMIT_UP',1,0))=0, 0, round(sum(iif(data_type='LIMIT_UP' and blast_times>0,1,0))*100.0/sum(iif(data_type='LIMIT_UP',1,0)),2)) as blastRate, " +
                "sum(iif(isNull(limit_funds),0,limit_funds)) as totalSealFunds, avg(iif(isNull(limit_funds),0,limit_funds)) as avgSealFunds, " +
                "iif(sum(iif(data_type='LIMIT_UP',1,0))=0, 0, round(sum(iif(data_type='LIMIT_UP' and not isNull(first_limit_time) and first_limit_time<'10:30:00',1,0))*100.0/sum(iif(data_type='LIMIT_UP',1,0)),2)) as earlyLimitRate " +
                "from " + TBL + " where trade_date between ? and ? group by trade_date order by trade_date";
        return client.query(sql, new DolphinDBRowMapper<>(HistoricalDataDTO.class), startDate, endDate);
    }

    public PercentileDataDTO getPercentileData(LocalDate targetDate, int days) {
        // 目标日统计
        String targetSql = "select sum(iif(data_type='LIMIT_UP',1,0)) as limitUpCount, sum(iif(data_type='LIMIT_DOWN',1,0)) as limitDownCount, " +
                "iif(sum(iif(data_type='LIMIT_DOWN',1,0))=0, null, round(sum(iif(data_type='LIMIT_UP',1,0))*1.0/sum(iif(data_type='LIMIT_DOWN',1,0)),2)) as ratio, " +
                "sum(iif(isNull(limit_funds),0,limit_funds)) as totalSealFunds from " + TBL + " where trade_date=?";
        Map<String, Object> target = client.jdbc().queryForMap(targetSql, targetDate);
        // 历史每日统计
        String histSql = "select trade_date, sum(iif(data_type='LIMIT_UP',1,0)) as limitUpCount, sum(iif(data_type='LIMIT_DOWN',1,0)) as limitDownCount, " +
                "iif(sum(iif(data_type='LIMIT_DOWN',1,0))=0, null, round(sum(iif(data_type='LIMIT_UP',1,0))*1.0/sum(iif(data_type='LIMIT_DOWN',1,0)),2)) as ratio, " +
                "sum(iif(isNull(limit_funds),0,limit_funds)) as totalSealFunds from " + TBL +
                " where trade_date between ? and ? group by trade_date";
        List<Map<String, Object>> hist = client.jdbc().queryForList(histSql, targetDate.minusDays(days), targetDate);
        BigDecimal tUp = ValueConverter.toBigDecimal(target.get("limitUpCount"));
        BigDecimal tDown = ValueConverter.toBigDecimal(target.get("limitDownCount"));
        BigDecimal tRatio = ValueConverter.toBigDecimal(target.get("ratio"));
        BigDecimal tFunds = ValueConverter.toBigDecimal(target.get("totalSealFunds"));
        int upLess = 0, downLess = 0, ratioLess = 0, fundsLess = 0;
        int totalDays = hist == null ? 0 : hist.size();
        if (hist != null) {
            for (Map<String, Object> row : hist) {
                if (lte(ValueConverter.toBigDecimal(row.get("limitUpCount")), tUp)) upLess++;
                if (lte(ValueConverter.toBigDecimal(row.get("limitDownCount")), tDown)) downLess++;
                if (lte(ValueConverter.toBigDecimal(row.get("ratio")), tRatio)) ratioLess++;
                if (lte(ValueConverter.toBigDecimal(row.get("totalSealFunds")), tFunds)) fundsLess++;
            }
        }
        return PercentileDataDTO.builder()
                .targetDate(targetDate)
                .targetLimitUpCount(ValueConverter.toLong(tUp))
                .targetLimitDownCount(ValueConverter.toLong(tDown))
                .targetLimitUpDownRatio(tRatio)
                .targetTotalSealFunds(tFunds)
                .totalDays((long) totalDays)
                .limitUpCountLessEqualDays((long) upLess)
                .limitDownCountLessEqualDays((long) downLess)
                .ratioLessEqualDays((long) ratioLess)
                .totalFundsLessEqualDays((long) fundsLess)
                .build();
    }

    // ==================== 辅助 ====================

    private static boolean isLimitUp(String dataType) {
        return "LIMIT_UP".equals(dataType);
    }

    private static Double toDouble(BigDecimal bd) {
        return bd == null ? null : bd.doubleValue();
    }

    private static String formatTime(java.time.LocalTime t) {
        return t == null ? null : ValueConverter.TIME_FMT.format(t);
    }

    private static boolean lte(BigDecimal a, BigDecimal b) {
        if (a == null || b == null) {
            return false;
        }
        return a.compareTo(b) <= 0;
    }

    private static String peRangeOf(BigDecimal pe) {
        if (pe == null) return "未知";
        double v = pe.doubleValue();
        if (v <= 0) return "负值或零";
        if (v < 20) return "0-20";
        if (v < 50) return "20-50";
        if (v < 100) return "50-100";
        return "100以上";
    }

    /** 时间分桶（30 分钟）。 */
    private static final String[][] TIME_BUCKETS = {
            {"09:30-10:00", "早盘"}, {"10:00-10:30", "早盘"}, {"10:30-11:00", "早盘"},
            {"11:00-11:30", "午盘"}, {"11:30-13:00", "午盘"}, {"13:00-13:30", "午盘"},
            {"13:30-14:00", "午盘"}, {"14:00-14:30", "午盘"}, {"14:30-15:00", "尾盘"}, {"15:00-15:00", "尾盘"}
    };

    private static String bucketOf(String hhmmss) {
        String t = hhmmss.length() >= 8 ? hhmmss.substring(0, 8) : hhmmss;
        if (t.compareTo("10:00:00") < 0) return "09:30-10:00";
        if (t.compareTo("10:30:00") < 0) return "10:00-10:30";
        if (t.compareTo("11:00:00") < 0) return "10:30-11:00";
        if (t.compareTo("11:30:00") < 0) return "11:00-11:30";
        if (t.compareTo("13:00:00") < 0) return "11:30-13:00";
        if (t.compareTo("13:30:00") < 0) return "13:00-13:30";
        if (t.compareTo("14:00:00") < 0) return "13:30-14:00";
        if (t.compareTo("14:30:00") < 0) return "14:00-14:30";
        if (t.compareTo("15:00:00") < 0) return "14:30-15:00";
        return "15:00-15:00";
    }

    private static String timeDesc(String hhmmss) {
        String t = hhmmss.length() >= 8 ? hhmmss.substring(0, 8) : hhmmss;
        if (t.compareTo("10:30:00") < 0) return "早盘";
        if (t.compareTo("14:30:00") < 0) return "午盘";
        return "尾盘";
    }

    private enum ReboundGroup { NONE }

    private static class TimeAgg {
        final String range;
        final String desc;
        int count;
        TimeAgg(String range, String desc) { this.range = range; this.desc = desc; }
    }

    private static class ReboundRow {
        String stockCode;
        Integer continuousLimit;
        String industry;
        BigDecimal dynamicPe;
        Double nextIncrease;
        String peRange;
    }
}
