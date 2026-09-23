package com.gsxi.trading.tradeinsight.aspect;
import java.lang.annotation.*;


/*
  @Retention(RetentionPolicy.RUNTIME)： 这个元注解用于指定注解的保留策略，即注解在何时生效。RetentionPolicy.RUNTIME 表示该注解将在运行时保留，这意味着它可以通过反射在运行时被访问和解析。
 * @Target({ElementType.METHOD})： 这个元注解用于指定注解的目标元素，即可以在哪些地方使用这个注解。ElementType.METHOD 表示该注解只能用于方法上。这意味着您只能在方法上使用这个特定的注解。
 * @Documented： 这个元注解用于指定被注解的元素是否会出现在生成的Java文档中。如果一个注解使用了 @Documented，那么在生成文档时，被注解的元素及其注解信息会被包含在文档中。这可以帮助文档生成工具（如 JavaDoc）在生成文档时展示关于注解的信息。
 */

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/15
 * @description API 功能描述
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD})
@Documented
public @interface ApiOperationLog {
    /**
     * API 功能描述
     *
     * @return
     */
    String description() default "";

}