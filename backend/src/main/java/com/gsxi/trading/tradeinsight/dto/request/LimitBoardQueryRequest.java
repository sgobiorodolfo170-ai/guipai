package com.gsxi.trading.tradeinsight.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDate;

/**
 * 涨跌停板查询请求DTO
 *
 * @author gsxi
 * @version 1.0
 * @date 2025/9/1
 * @description 涨跌停板统计分析查询请求参数封装
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "涨跌停板查询请求参数")
public class LimitBoardQueryRequest implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 查询日期
     */
    @Schema(description = "查询日期", example = "2025-01-15", required = true)
    @JsonFormat(pattern = "yyyy-MM-dd")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    @NotNull(message = "查询日期不能为空")
    private LocalDate date;

    /**
     * 开始日期（范围查询时使用）
     */
    @Schema(description = "开始日期", example = "2025-01-01")
    @JsonFormat(pattern = "yyyy-MM-dd")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    /**
     * 结束日期（范围查询时使用）
     */
    @Schema(description = "结束日期", example = "2025-01-15")
    @JsonFormat(pattern = "yyyy-MM-dd")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    /**
     * 数据类型
     */
    @Schema(description = "数据类型：LIMIT_UP(涨停板)、LIMIT_DOWN(跌停板)、ALL(全部)", 
            example = "LIMIT_UP", allowableValues = {"LIMIT_UP", "LIMIT_DOWN", "ALL"})
    @Pattern(regexp = "^(LIMIT_UP|LIMIT_DOWN|ALL)$", message = "数据类型只能是LIMIT_UP、LIMIT_DOWN或ALL")
    private String dataType;

    /**
     * 历史对比天数
     */
    @Schema(description = "历史对比天数，用于历史对比分析", example = "30", minimum = "7", maximum = "365")
    @Min(value = 7, message = "历史对比天数不能少于7天")
    @Max(value = 365, message = "历史对比天数不能超过365天")
    private Integer days;

    /**
     * 行业代码（可选）
     */
    @Schema(description = "行业代码，用于行业筛选", example = "电子")
    private String industryCode;

    /**
     * 连板数筛选（可选）
     */
    @Schema(description = "连板数筛选", example = "2", minimum = "1", maximum = "20")
    @Min(value = 1, message = "连板数不能少于1")
    @Max(value = 20, message = "连板数不能超过20")
    private Integer continuousLimit;

    /**
     * 市盈率范围筛选 - 最小值（可选）
     */
    @Schema(description = "市盈率范围筛选最小值", example = "0")
    @Min(value = 0, message = "市盈率最小值不能为负数")
    private Double minPe;

    /**
     * 市盈率范围筛选 - 最大值（可选）
     */
    @Schema(description = "市盈率范围筛选最大值", example = "100")
    @Min(value = 0, message = "市盈率最大值不能为负数")
    private Double maxPe;

    /**
     * 封单资金范围筛选 - 最小值（万元）（可选）
     */
    @Schema(description = "封单资金范围筛选最小值（万元）", example = "1000")
    @Min(value = 0, message = "封单资金最小值不能为负数")
    private Double minSealFunds;

    /**
     * 封单资金范围筛选 - 最大值（万元）（可选）
     */
    @Schema(description = "封单资金范围筛选最大值（万元）", example = "10000")
    @Min(value = 0, message = "封单资金最大值不能为负数")
    private Double maxSealFunds;

    /**
     * 是否包含一字板
     */
    @Schema(description = "是否包含一字板", example = "true")
    private Boolean includeOneWordBoard;

    /**
     * 是否包含炸板股票
     */
    @Schema(description = "是否包含炸板股票", example = "false")
    private Boolean includeBlastBoard;

    /**
     * 排序字段
     */
    @Schema(description = "排序字段", example = "sealFunds", 
            allowableValues = {"sealFunds", "marketValue", "continuousLimit", "firstLimitTime"})
    @Pattern(regexp = "^(sealFunds|marketValue|continuousLimit|firstLimitTime)$", 
            message = "排序字段只能是sealFunds、marketValue、continuousLimit或firstLimitTime")
    private String sortField;

    /**
     * 排序方向
     */
    @Schema(description = "排序方向：ASC(升序)、DESC(降序)", example = "DESC", 
            allowableValues = {"ASC", "DESC"})
    @Pattern(regexp = "^(ASC|DESC)$", message = "排序方向只能是ASC或DESC")
    private String sortDirection;

    /**
     * 页码（分页查询时使用）
     */
    @Schema(description = "页码，从1开始", example = "1", minimum = "1")
    @Min(value = 1, message = "页码必须大于0")
    private Integer pageNum;

    /**
     * 每页大小（分页查询时使用）
     */
    @Schema(description = "每页大小", example = "20", minimum = "1", maximum = "1000")
    @Min(value = 1, message = "每页大小必须大于0")
    @Max(value = 1000, message = "每页大小不能超过1000")
    private Integer pageSize;

    /**
     * 是否需要详细信息
     */
    @Schema(description = "是否需要详细信息", example = "true")
    private Boolean needDetail;

    /**
     * 是否需要分布数据
     */
    @Schema(description = "是否需要分布数据", example = "true")
    private Boolean needDistribution;

    /**
     * 验证日期范围
     */
    public void validateDateRange() {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("开始日期不能晚于结束日期");
        }
    }

    /**
     * 验证市盈率范围
     */
    public void validatePeRange() {
        if (minPe != null && maxPe != null && minPe > maxPe) {
            throw new IllegalArgumentException("市盈率最小值不能大于最大值");
        }
    }

    /**
     * 验证封单资金范围
     */
    public void validateSealFundsRange() {
        if (minSealFunds != null && maxSealFunds != null && minSealFunds > maxSealFunds) {
            throw new IllegalArgumentException("封单资金最小值不能大于最大值");
        }
    }

    /**
     * 获取有效的数据类型
     */
    public String getEffectiveDataType() {
        return dataType != null ? dataType : "LIMIT_UP";
    }

    /**
     * 获取有效的天数
     */
    public Integer getEffectiveDays() {
        return days != null ? days : 30;
    }

    /**
     * 获取有效的页码
     */
    public Integer getEffectivePageNum() {
        return pageNum != null ? pageNum : 1;
    }

    /**
     * 获取有效的每页大小
     */
    public Integer getEffectivePageSize() {
        return pageSize != null ? pageSize : 20;
    }

    /**
     * 获取有效的排序字段
     */
    public String getEffectiveSortField() {
        return sortField != null ? sortField : "sealFunds";
    }

    /**
     * 获取有效的排序方向
     */
    public String getEffectiveSortDirection() {
        return sortDirection != null ? sortDirection : "DESC";
    }

    /**
     * 是否需要详细信息
     */
    public boolean isNeedDetail() {
        return needDetail != null ? needDetail : false;
    }

    /**
     * 是否需要分布数据
     */
    public boolean isNeedDistribution() {
        return needDistribution != null ? needDistribution : true;
    }
}