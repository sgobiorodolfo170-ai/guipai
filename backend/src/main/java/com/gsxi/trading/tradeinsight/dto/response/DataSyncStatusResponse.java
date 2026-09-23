package com.gsxi.trading.tradeinsight.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/27
 * @description 数据同步状态响应DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataSyncStatusResponse {

    /**
     * 主键ID
     */
    private Long id;

    /**
     * 数据类型
     */
    private String dataType;

    /**
     * 数据类型描述
     */
    private String dataTypeDesc;

    /**
     * 交易日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tradeDate;

    /**
     * 同步状态码
     */
    private Integer status;

    /**
     * 同步状态描述
     */
    private String statusDesc;

    /**
     * 成功数量
     */
    private Integer successCount;

    /**
     * 失败数量
     */
    private Integer failCount;

    /**
     * 同步消息
     */
    private String message;

    /**
     * 同步时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime syncTime;
}