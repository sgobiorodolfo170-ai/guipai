package com.gsxi.trading.tradeinsight.exception;

import java.time.LocalDate;

/**
 * 业务验证异常类
 *
 * @author gsxi
 * @version 1.0
 * @date 2025/9/1
 * @description 业务逻辑验证相关的异常处理类
 */
public class BusinessValidationException extends LimitBoardStatisticsException {

    @java.io.Serial
    private static final long serialVersionUID = 1L;

    /**
     * 构造函数 - 涨跌停类型无效
     *
     * @param limitType 无效的涨跌停类型
     */
    public static BusinessValidationException invalidLimitBoardType(String limitType) {
        return new BusinessValidationException(
                LimitBoardStatisticsErrorCode.LIMIT_BOARD_TYPE_INVALID,
                "BusinessValidation",
                "LimitBoardType",
                String.format("无效的涨跌停类型: %s，支持的类型: UP(涨停), DOWN(跌停)", limitType)
        );
    }

    /**
     * 构造函数 - 行业代码无效
     *
     * @param industryCode 无效的行业代码
     */
    public static BusinessValidationException invalidIndustryCode(String industryCode) {
        return new BusinessValidationException(
                LimitBoardStatisticsErrorCode.INDUSTRY_CODE_INVALID,
                "BusinessValidation",
                "IndustryCode",
                String.format("无效的行业代码: %s", industryCode)
        );
    }

    /**
     * 构造函数 - 股票代码无效
     *
     * @param stockCode 无效的股票代码
     */
    public static BusinessValidationException invalidStockCode(String stockCode) {
        return new BusinessValidationException(
                LimitBoardStatisticsErrorCode.STOCK_CODE_INVALID,
                "BusinessValidation",
                "StockCode",
                String.format("无效的股票代码: %s", stockCode)
        );
    }

    /**
     * 构造函数 - 连板天数无效
     *
     * @param continuousDays 无效的连板天数
     */
    public static BusinessValidationException invalidContinuousLimitDays(Integer continuousDays) {
        return new BusinessValidationException(
                LimitBoardStatisticsErrorCode.CONTINUOUS_LIMIT_DAYS_INVALID,
                "BusinessValidation",
                "ContinuousLimitDays",
                String.format("无效的连板天数: %s，连板天数必须大于0", continuousDays)
        );
    }

    /**
     * 构造函数 - 封单强度无效
     *
     * @param sealStrength 无效的封单强度
     */
    public static BusinessValidationException invalidSealStrength(Object sealStrength) {
        return new BusinessValidationException(
                LimitBoardStatisticsErrorCode.SEAL_STRENGTH_INVALID,
                "BusinessValidation",
                "SealStrength",
                String.format("无效的封单强度: %s，封单强度必须为正数", sealStrength)
        );
    }

    /**
     * 构造函数 - 日期格式错误
     *
     * @param dateString 错误的日期字符串
     */
    public static BusinessValidationException dateFormatError(String dateString) {
        return new BusinessValidationException(
                LimitBoardStatisticsErrorCode.DATE_FORMAT_ERROR,
                "BusinessValidation",
                "DateFormat",
                String.format("日期格式错误: %s，正确格式为: yyyy-MM-dd", dateString)
        );
    }

    /**
     * 构造函数 - 日期范围无效
     *
     * @param startDate 开始日期
     * @param endDate   结束日期
     */
    public static BusinessValidationException invalidDateRange(LocalDate startDate, LocalDate endDate) {
        return new BusinessValidationException(
                LimitBoardStatisticsErrorCode.DATE_RANGE_INVALID,
                "BusinessValidation",
                "DateRange",
                String.format("日期范围无效: 开始日期 %s 不能晚于结束日期 %s", startDate, endDate)
        );
    }

    /**
     * 构造函数 - 必填字段缺失
     *
     * @param fieldName 缺失的字段名
     */
    public static BusinessValidationException requiredFieldMissing(String fieldName) {
        return new BusinessValidationException(
                LimitBoardStatisticsErrorCode.REQUIRED_FIELD_MISSING,
                "BusinessValidation",
                "RequiredField",
                String.format("必填字段缺失: %s", fieldName)
        );
    }

    /**
     * 构造函数 - 字段值超出范围
     *
     * @param fieldName 字段名
     * @param value     字段值
     * @param minValue  最小值
     * @param maxValue  最大值
     */
    public static BusinessValidationException fieldValueOutOfRange(String fieldName, Object value, Object minValue, Object maxValue) {
        return new BusinessValidationException(
                LimitBoardStatisticsErrorCode.FIELD_VALUE_OUT_OF_RANGE,
                "BusinessValidation",
                "FieldRange",
                String.format("字段 %s 的值 %s 超出范围 [%s, %s]", fieldName, value, minValue, maxValue)
        );
    }

    /**
     * 构造函数 - 数据一致性错误
     *
     * @param description 错误描述
     */
    public static BusinessValidationException dataConsistencyError(String description) {
        return new BusinessValidationException(
                LimitBoardStatisticsErrorCode.DATA_CONSISTENCY_ERROR,
                "BusinessValidation",
                "DataConsistency",
                description
        );
    }

    /**
     * 私有构造函数
     */
    public BusinessValidationException(LimitBoardStatisticsErrorCode errorCode, String module, String operation, String details) {
        super(errorCode, module, operation, details);
    }
}