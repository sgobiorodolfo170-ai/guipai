package com.gsxi.trading.tradeinsight.exception;

/**
 * 统计计算异常类
 *
 * @author gsxi
 * @version 1.0
 * @date 2025/9/1
 * @description 统计计算相关的异常处理类
 */
public class StatisticalCalculationException extends LimitBoardStatisticsException {

    @java.io.Serial
    private static final long serialVersionUID = 1L;

    /**
     * 构造函数 - 统计计算异常
     *
     * @param calculationType 计算类型
     * @param cause           原始异常
     */
    public static StatisticalCalculationException calculationError(String calculationType, Throwable cause) {
        return new StatisticalCalculationException(
                LimitBoardStatisticsErrorCode.CALCULATION_ERROR,
                "Statistics",
                calculationType,
                "统计计算过程中发生异常",
                cause
        );
    }

    /**
     * 构造函数 - 除零异常
     *
     * @param calculationType 计算类型
     * @param expression      计算表达式
     */
    public static StatisticalCalculationException divisionByZero(String calculationType, String expression) {
        return new StatisticalCalculationException(
                LimitBoardStatisticsErrorCode.DIVISION_BY_ZERO,
                "Statistics",
                calculationType,
                String.format("计算表达式: %s", expression)
        );
    }

    /**
     * 构造函数 - 计算参数无效
     *
     * @param calculationType 计算类型
     * @param parameterName   参数名称
     * @param parameterValue  参数值
     */
    public static StatisticalCalculationException invalidParameter(String calculationType, String parameterName, Object parameterValue) {
        return new StatisticalCalculationException(
                LimitBoardStatisticsErrorCode.INVALID_CALCULATION_PARAMETER,
                "Statistics",
                calculationType,
                String.format("参数 %s 的值 %s 无效", parameterName, parameterValue)
        );
    }

    /**
     * 构造函数 - 统计数据不足
     *
     * @param calculationType 计算类型
     * @param requiredCount   需要的数据量
     * @param actualCount     实际数据量
     */
    public static StatisticalCalculationException insufficientData(String calculationType, int requiredCount, int actualCount) {
        return new StatisticalCalculationException(
                LimitBoardStatisticsErrorCode.STATISTICAL_DATA_INSUFFICIENT,
                "Statistics",
                calculationType,
                String.format("需要 %d 条数据，实际只有 %d 条", requiredCount, actualCount)
        );
    }

    /**
     * 构造函数 - 百分比计算异常
     *
     * @param numerator   分子
     * @param denominator 分母
     */
    public static StatisticalCalculationException percentageCalculationError(Object numerator, Object denominator) {
        return new StatisticalCalculationException(
                LimitBoardStatisticsErrorCode.PERCENTAGE_CALCULATION_ERROR,
                "Statistics",
                "PercentageCalculation",
                String.format("分子: %s, 分母: %s", numerator, denominator)
        );
    }

    /**
     * 私有构造函数
     */
    private StatisticalCalculationException(LimitBoardStatisticsErrorCode errorCode, String module, String operation, String details) {
        super(errorCode, module, operation, details);
    }

    /**
     * 私有构造函数 - 包含原始异常
     */
    private StatisticalCalculationException(LimitBoardStatisticsErrorCode errorCode, String module, String operation, String details, Throwable cause) {
        super(errorCode, module, operation, details, cause);
    }
}