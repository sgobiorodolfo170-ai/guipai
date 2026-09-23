package com.gsxi.trading.tradeinsight.exception;

import com.gsxi.trading.tradeinsight.dto.response.AjaxResult;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/15
 * @description 全局异常处理
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    /**
     * 捕获自定义业务异常
     * @return
     */
    @ExceptionHandler({ BizException.class })
    @ResponseBody
    public AjaxResult handleBizException(HttpServletRequest request, BizException e) {
        log.warn("{} request fail, errorCode: {}, errorMessage: {}", request.getRequestURI(), e.getErrorCode(), e.getErrorMessage());
        return AjaxResult.error(e.getErrorCode(), e.getErrorMessage());
    }

    /**
     * 捕获涨跌停板统计分析异常
     * @param request HTTP请求
     * @param e 涨跌停板统计分析异常
     * @return 统一响应结果
     */
    @ExceptionHandler({ LimitBoardStatisticsException.class })
    @ResponseBody
    public AjaxResult handleLimitBoardStatisticsException(HttpServletRequest request, LimitBoardStatisticsException e) {
        log.error("{} request fail, module: {}, operation: {}, errorCode: {}, errorMessage: {}, details: {}", 
                request.getRequestURI(), e.getModule(), e.getOperation(), e.getErrorCode(), e.getErrorMessage(), e.getDetails());
        return AjaxResult.error(e.getErrorCode(), e.getFullErrorMessage());
    }

    /**
     * 捕获数据查询异常
     * @param request HTTP请求
     * @param e 数据查询异常
     * @return 统一响应结果
     */
    @ExceptionHandler({ DataQueryException.class })
    @ResponseBody
    public AjaxResult handleDataQueryException(HttpServletRequest request, DataQueryException e) {
        log.error("{} request fail, data query error: {}", request.getRequestURI(), e.getFullErrorMessage());
        return AjaxResult.error(e.getErrorCode(), e.getErrorMessage());
    }

    /**
     * 捕获缓存操作异常
     * @param request HTTP请求
     * @param e 缓存操作异常
     * @return 统一响应结果
     */
    @ExceptionHandler({ CacheOperationException.class })
    @ResponseBody
    public AjaxResult handleCacheOperationException(HttpServletRequest request, CacheOperationException e) {
        log.error("{} request fail, cache operation error: {}", request.getRequestURI(), e.getFullErrorMessage());
        return AjaxResult.error(e.getErrorCode(), e.getErrorMessage());
    }

    /**
     * 捕获统计计算异常
     * @param request HTTP请求
     * @param e 统计计算异常
     * @return 统一响应结果
     */
    @ExceptionHandler({ StatisticalCalculationException.class })
    @ResponseBody
    public AjaxResult handleStatisticalCalculationException(HttpServletRequest request, StatisticalCalculationException e) {
        log.error("{} request fail, statistical calculation error: {}", request.getRequestURI(), e.getFullErrorMessage());
        return AjaxResult.error(e.getErrorCode(), e.getErrorMessage());
    }

    /**
     * 捕获业务验证异常
     * @param request HTTP请求
     * @param e 业务验证异常
     * @return 统一响应结果
     */
    @ExceptionHandler({ BusinessValidationException.class })
    @ResponseBody
    public AjaxResult handleBusinessValidationException(HttpServletRequest request, BusinessValidationException e) {
        log.warn("{} request fail, business validation error: {}", request.getRequestURI(), e.getFullErrorMessage());
        return AjaxResult.error(e.getErrorCode(), e.getErrorMessage());
    }

    /**
     * 其他类型异常
     * @param request
     * @param e
     * @return
     */
    @ExceptionHandler({ Exception.class })
    @ResponseBody
    public AjaxResult handleOtherException(HttpServletRequest request, Exception e) {
        log.error("{} request fail, error: {}", request.getRequestURI(), e.getMessage());
        return AjaxResult.error(500, e.getMessage());
    }

    /**
     * 捕获参数验证异常
     * @param e
     * @return
     */
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    @ResponseBody
    public AjaxResult handleValidationException(org.springframework.web.bind.MethodArgumentNotValidException e) {
        String errorMessage = e.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage())
                .findFirst()
                .orElse("参数验证失败");
        return AjaxResult.error(400, errorMessage);
    }

    /**
     * 捕获参数绑定异常
     * @param e
     * @return
     */
    @ExceptionHandler(org.springframework.validation.BindException.class)
    @ResponseBody
    public AjaxResult handleBindException(org.springframework.validation.BindException e) {
        String errorMessage = e.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage())
                .findFirst()
                .orElse("参数绑定失败");
        return AjaxResult.error(400, errorMessage);
    }
}
