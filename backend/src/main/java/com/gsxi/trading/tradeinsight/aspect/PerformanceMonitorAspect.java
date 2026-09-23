package com.gsxi.trading.tradeinsight.aspect;

import com.gsxi.trading.tradeinsight.monitor.QueryPerformanceMonitor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

/**
 * 性能监控切面
 * 
 * @author TradeInsight Team
 * @version 1.0
 * @date 2024-12-19
 * @description 通过AOP监控Mapper方法的执行性能
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class PerformanceMonitorAspect {

    private final QueryPerformanceMonitor queryPerformanceMonitor;
    
    /**
     * 监控Mapper方法执行性能
     * 
     * @param joinPoint 连接点
     * @return 方法执行结果
     * @throws Throwable 异常
     */
    @Around("execution(* com.gsxi.trading.tradeinsight.mapper..*(..))")
    public Object monitorMapperPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().getDeclaringTypeName() + "." + joinPoint.getSignature().getName();
        
        QueryPerformanceMonitor.QueryContext context = queryPerformanceMonitor.startQuery(methodName);
        
        try {
            Object result = joinPoint.proceed();
            queryPerformanceMonitor.endQuery(context);
            return result;
        } catch (Throwable throwable) {
            queryPerformanceMonitor.endQuery(context);
            log.error("Mapper方法执行异常: {}", methodName, throwable);
            throw throwable;
        }
    }
    
    /**
     * 监控Service方法执行性能
     * 
     * @param joinPoint 连接点
     * @return 方法执行结果
     * @throws Throwable 异常
     */
    @Around("execution(* com.gsxi.trading.tradeinsight.service..*(..))")
    public Object monitorServicePerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().getDeclaringTypeName() + "." + joinPoint.getSignature().getName();
        
        long startTime = System.currentTimeMillis();
        
        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - startTime;
            
            // 记录服务层性能日志
            if (duration > 2000) { // 超过2秒的服务调用
                log.warn("服务方法执行较慢: {} 执行时间: {}ms", methodName, duration);
            } else {
                log.debug("服务方法执行: {} 执行时间: {}ms", methodName, duration);
            }
            
            return result;
        } catch (Throwable throwable) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("服务方法执行异常: {} 执行时间: {}ms", methodName, duration, throwable);
            throw throwable;
        }
    }
}