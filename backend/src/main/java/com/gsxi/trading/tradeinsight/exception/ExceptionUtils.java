package com.gsxi.trading.tradeinsight.exception;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.Collection;

/**
 * 异常工具类
 *
 * @author gsxi
 * @version 1.0
 * @date 2025/9/1
 * @description 提供便捷的异常创建和处理方法
 */
@Slf4j
public class ExceptionUtils {

    /**
     * 私有构造函数，防止实例化
     */
    private ExceptionUtils() {
        throw new UnsupportedOperationException("工具类不能被实例化");
    }

    /**
     * 检查参数是否为空，为空则抛出异常
     *
     * @param value     参数值
     * @param fieldName 字段名
     * @throws BusinessValidationException 参数为空时抛出
     */
    public static void checkNotNull(Object value, String fieldName) {
        if (value == null) {
            throw BusinessValidationException.requiredFieldMissing(fieldName);
        }
    }

    /**
     * 检查字符串参数是否为空或空白，为空则抛出异常
     *
     * @param value     字符串值
     * @param fieldName 字段名
     * @throws BusinessValidationException 参数为空或空白时抛出
     */
    public static void checkNotBlank(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw BusinessValidationException.requiredFieldMissing(fieldName);
        }
    }

    /**
     * 检查集合参数是否为空，为空则抛出异常
     *
     * @param collection 集合
     * @param fieldName  字段名
     * @throws BusinessValidationException 集合为空时抛出
     */
    public static void checkNotEmpty(Collection<?> collection, String fieldName) {
        if (collection == null || collection.isEmpty()) {
            throw BusinessValidationException.requiredFieldMissing(fieldName);
        }
    }

    /**
     * 检查数值是否为正数，不是则抛出异常
     *
     * @param value     数值
     * @param fieldName 字段名
     * @throws BusinessValidationException 数值不是正数时抛出
     */
    public static void checkPositive(Number value, String fieldName) {
        checkNotNull(value, fieldName);
        if (value.doubleValue() <= 0) {
            throw BusinessValidationException.fieldValueOutOfRange(fieldName, value, "大于0", "无限大");
        }
    }

    /**
     * 检查数值是否为非负数，不是则抛出异常
     *
     * @param value     数值
     * @param fieldName 字段名
     * @throws BusinessValidationException 数值为负数时抛出
     */
    public static void checkNonNegative(Number value, String fieldName) {
        checkNotNull(value, fieldName);
        if (value.doubleValue() < 0) {
            throw BusinessValidationException.fieldValueOutOfRange(fieldName, value, "大于等于0", "无限大");
        }
    }

    /**
     * 检查数值是否在指定范围内，不在则抛出异常
     *
     * @param value     数值
     * @param minValue  最小值
     * @param maxValue  最大值
     * @param fieldName 字段名
     * @throws BusinessValidationException 数值不在范围内时抛出
     */
    public static void checkRange(Number value, Number minValue, Number maxValue, String fieldName) {
        checkNotNull(value, fieldName);
        double val = value.doubleValue();
        double min = minValue.doubleValue();
        double max = maxValue.doubleValue();
        
        if (val < min || val > max) {
            throw BusinessValidationException.fieldValueOutOfRange(fieldName, value, minValue, maxValue);
        }
    }

    /**
     * 检查日期范围是否有效，无效则抛出异常
     *
     * @param startDate 开始日期
     * @param endDate   结束日期
     * @throws BusinessValidationException 日期范围无效时抛出
     */
    public static void checkDateRange(LocalDate startDate, LocalDate endDate) {
        checkNotNull(startDate, "开始日期");
        checkNotNull(endDate, "结束日期");
        
        if (startDate.isAfter(endDate)) {
            throw BusinessValidationException.invalidDateRange(startDate, endDate);
        }
    }

    /**
     * 检查涨跌停类型是否有效，无效则抛出异常
     *
     * @param limitType 涨跌停类型
     * @throws BusinessValidationException 类型无效时抛出
     */
    public static void checkLimitBoardType(String limitType) {
        checkNotBlank(limitType, "涨跌停类型");
        
        if (!"LIMIT_UP".equalsIgnoreCase(limitType) && !"LIMIT_DOWN".equalsIgnoreCase(limitType)) {
            throw BusinessValidationException.invalidLimitBoardType(limitType);
        }
    }

    /**
     * 检查股票代码格式是否有效，无效则抛出异常
     *
     * @param stockCode 股票代码
     * @throws BusinessValidationException 股票代码格式无效时抛出
     */
    public static void checkStockCode(String stockCode) {
        checkNotBlank(stockCode, "股票代码");
        
        // 简单的股票代码格式检查：6位数字
        if (!stockCode.matches("\\d{6}")) {
            throw BusinessValidationException.invalidStockCode(stockCode);
        }
    }

    /**
     * 检查连板天数是否有效，无效则抛出异常
     *
     * @param continuousDays 连板天数
     * @throws BusinessValidationException 连板天数无效时抛出
     */
    public static void checkContinuousLimitDays(Integer continuousDays) {
        checkNotNull(continuousDays, "连板天数");
        
        if (continuousDays <= 0) {
            throw BusinessValidationException.invalidContinuousLimitDays(continuousDays);
        }
    }

    /**
     * 安全地将异常转换为LimitBoardStatisticsException
     *
     * @param exception     原始异常
     * @param operationName 操作名称
     * @return LimitBoardStatisticsException
     */
    public static LimitBoardStatisticsException wrapException(Exception exception, String operationName) {
        if (exception instanceof LimitBoardStatisticsException) {
            return (LimitBoardStatisticsException) exception;
        }
        
        // 根据异常类型进行转换
        if (exception instanceof IllegalArgumentException) {
            return new LimitBoardStatisticsException(
                    LimitBoardStatisticsErrorCode.PARAMETER_ERROR,
                    "ExceptionUtils",
                    operationName,
                    exception.getMessage(),
                    exception
            );
        } else if (exception instanceof java.sql.SQLException) {
            return DataQueryException.sqlExecutionError(operationName, exception);
        } else if (exception instanceof java.util.concurrent.TimeoutException) {
            return DataQueryException.timeout(operationName);
        } else {
            return new LimitBoardStatisticsException(
                    LimitBoardStatisticsErrorCode.SYSTEM_ERROR,
                    "ExceptionUtils",
                    operationName,
                    exception.getMessage(),
                    exception
            );
        }
    }

    /**
     * 记录异常信息
     *
     * @param exception 异常
     * @param context   上下文信息
     */
    public static void logException(Exception exception, String context) {
        if (exception instanceof LimitBoardStatisticsException) {
            LimitBoardStatisticsException lbsException = (LimitBoardStatisticsException) exception;
            log.error("业务异常 [{}]: {}", context, lbsException.getFullErrorMessage(), exception);
        } else {
            log.error("系统异常 [{}]: {}", context, exception.getMessage(), exception);
        }
    }

    /**
     * 创建数据不存在异常
     *
     * @param dataType 数据类型
     * @param condition 查询条件
     * @return DataQueryException
     */
    public static DataQueryException dataNotFound(String dataType, String condition) {
        return DataQueryException.queryResultEmpty(dataType, condition);
    }

    /**
     * 创建参数验证失败异常
     *
     * @param parameterName 参数名
     * @param parameterValue 参数值
     * @param expectedFormat 期望格式
     * @return BusinessValidationException
     */
    public static BusinessValidationException parameterValidationFailed(String parameterName, Object parameterValue, String expectedFormat) {
        return new BusinessValidationException(
                LimitBoardStatisticsErrorCode.PARAMETER_ERROR,
                "ParameterValidation",
                parameterName,
                String.format("参数值 %s 不符合期望格式: %s", parameterValue, expectedFormat)
        );
    }
}