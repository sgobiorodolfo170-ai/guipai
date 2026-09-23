package com.gsxi.trading.tradeinsight.dto;

import lombok.Builder;
import lombok.Data;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/26
 * @description 同步结果封装类
 */
@Data
@Builder
public class SyncResult {
    /**
     * 整体是否成功
     */
    private boolean success;
    /**
     *  成功条数
     */
    private int successCount;
    /**
     *  失败条数
     */
    private int failCount;
    /**
     * 结果描述（失败时为原因）
     */
    private String message;
}
