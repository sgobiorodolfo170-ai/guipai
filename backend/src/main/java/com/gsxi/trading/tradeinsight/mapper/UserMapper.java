package com.gsxi.trading.tradeinsight.mapper;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gsxi.trading.tradeinsight.entity.User;
import org.apache.ibatis.annotations.Mapper;

import java.util.Optional;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/16
 * @description 用户数据访问层(MyBatis实现)
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {

    /**
     * 根据用户名查询用户信息
     *
     * @param username 用户名（精确匹配）
     * @return 包含用户信息的Optional对象，如果未找到则返回Optional.empty()
     * @throws org.springframework.dao.DataAccessException 数据访问异常
     * @see Optional
     */
    default Optional<User> findByUsername(String username) {
        return Optional.ofNullable(selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username)));
    }

    /**
     * 根据邮箱查询用户信息
     *
     * @param email 邮箱地址（精确匹配）
     * @return 包含用户信息的Optional对象，如果未找到则返回Optional.empty()
     * @throws org.springframework.dao.DataAccessException 数据访问异常
     */
    default Optional<User> findByEmail(String email) {
        return Optional.ofNullable(selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, email)));
    }

    /**
     * 根据手机号查询用户信息
     *
     * @param phone 手机号码（精确匹配）
     * @return 包含用户信息的Optional对象，如果未找到则返回Optional.empty()
     * @throws org.springframework.dao.DataAccessException 数据访问异常
     */
    default Optional<User> findByPhone(String phone) {
        return Optional.ofNullable(selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getPhone, phone)));
    }

    /**
     * 检查用户名是否存在
     *
     * @param username 待检查的用户名
     * @return 如果存在返回true，否则返回false
     * @throws org.springframework.dao.DataAccessException 数据访问异常
     */
    default boolean existsByUsername(String username) {
        return selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username)) > 0;
    }

    /**
     * 检查邮箱是否存在
     *
     * @param email 待检查的邮箱地址
     * @return 如果存在返回true，否则返回false
     * @throws org.springframework.dao.DataAccessException 数据访问异常
     */
    default boolean existsByEmail(String email) {
        return selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, email)) > 0;
    }

    /**
     * 检查手机号是否存在
     *
     * @param phone 待检查的手机号码
     * @return 如果存在返回true，否则返回false
     * @throws org.springframework.dao.DataAccessException 数据访问异常
     */
    default boolean existsByPhone(String phone) {
        return selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getPhone, phone)) > 0;
    }
}