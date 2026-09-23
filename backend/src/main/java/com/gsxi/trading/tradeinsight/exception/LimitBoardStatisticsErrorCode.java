package com.gsxi.trading.tradeinsight.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 涨跌停板统计分析错误码枚举
 *
 * @author gsxi
 * @version 1.0
 * @date 2025/9/1
 * @description 定义涨跌停板统计分析功能相关的错误码和错误信息
 */
@Getter
@AllArgsConstructor
public enum LimitBoardStatisticsErrorCode implements BaseExceptionInterface {

    // 通用错误 (10001-10099)
    SYSTEM_ERROR(10001, "系统内部错误"),
    PARAMETER_ERROR(10002, "参数错误"),
    DATA_NOT_FOUND(10003, "数据不存在"),
    OPERATION_FAILED(10004, "操作失败"),

    // 数据查询错误 (10101-10199)
    QUERY_TIMEOUT(10101, "查询超时"),
    DATABASE_CONNECTION_ERROR(10102, "数据库连接异常"),
    SQL_EXECUTION_ERROR(10103, "SQL执行异常"),
    DATA_FORMAT_ERROR(10104, "数据格式错误"),
    QUERY_RESULT_EMPTY(10105, "查询结果为空"),

    // 缓存相关错误 (10201-10299)
    CACHE_CONNECTION_ERROR(10201, "缓存连接异常"),
    CACHE_OPERATION_ERROR(10202, "缓存操作失败"),
    CACHE_KEY_INVALID(10203, "缓存键无效"),
    CACHE_SERIALIZATION_ERROR(10204, "缓存序列化异常"),
    CACHE_DESERIALIZATION_ERROR(10205, "缓存反序列化异常"),

    // 统计计算错误 (10301-10399)
    CALCULATION_ERROR(10301, "统计计算异常"),
    DIVISION_BY_ZERO(10302, "除零异常"),
    INVALID_CALCULATION_PARAMETER(10303, "计算参数无效"),
    STATISTICAL_DATA_INSUFFICIENT(10304, "统计数据不足"),
    PERCENTAGE_CALCULATION_ERROR(10305, "百分比计算异常"),

    // 日期时间相关错误 (10401-10499)
    DATE_FORMAT_ERROR(10401, "日期格式错误"),
    DATE_RANGE_INVALID(10402, "日期范围无效"),
    DATE_PARAMETER_MISSING(10403, "日期参数缺失"),
    TRADING_DAY_NOT_FOUND(10404, "交易日不存在"),
    DATE_CALCULATION_ERROR(10405, "日期计算异常"),

    // 业务逻辑错误 (10501-10599)
    LIMIT_BOARD_TYPE_INVALID(10501, "涨跌停类型无效"),
    INDUSTRY_CODE_INVALID(10502, "行业代码无效"),
    STOCK_CODE_INVALID(10503, "股票代码无效"),
    CONTINUOUS_LIMIT_DAYS_INVALID(10504, "连板天数无效"),
    SEAL_STRENGTH_INVALID(10505, "封单强度无效"),

    // 数据验证错误 (10601-10699)
    DATA_VALIDATION_FAILED(10601, "数据验证失败"),
    REQUIRED_FIELD_MISSING(10602, "必填字段缺失"),
    FIELD_VALUE_OUT_OF_RANGE(10603, "字段值超出范围"),
    DATA_CONSISTENCY_ERROR(10604, "数据一致性错误"),
    DUPLICATE_DATA_ERROR(10605, "重复数据错误"),

    // 权限和安全错误 (10701-10799)
    ACCESS_DENIED(10701, "访问被拒绝"),
    INSUFFICIENT_PERMISSIONS(10702, "权限不足"),
    RATE_LIMIT_EXCEEDED(10703, "请求频率超限"),
    SECURITY_VALIDATION_FAILED(10704, "安全验证失败"),

    // 外部服务错误 (10801-10899)
    EXTERNAL_SERVICE_UNAVAILABLE(10801, "外部服务不可用"),
    EXTERNAL_API_ERROR(10802, "外部API调用异常"),
    SERVICE_TIMEOUT(10803, "服务调用超时"),
    SERVICE_RESPONSE_ERROR(10804, "服务响应异常"),

    // 配置相关错误 (10901-10999)
    CONFIGURATION_ERROR(10901, "配置错误"),
    MISSING_CONFIGURATION(10902, "缺少配置"),
    INVALID_CONFIGURATION(10903, "配置无效"),
    CONFIGURATION_LOAD_ERROR(10904, "配置加载失败");

    /**
     * 错误码
     */
    private final Integer errorCode;

    /**
     * 错误信息
     */
    private final String errorMessage;

    @Override
    public Integer getErrorCode() {
        return this.errorCode;
    }

    @Override
    public String getErrorMessage() {
        return this.errorMessage;
    }
}