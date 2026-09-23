package com.gsxi.trading.tradeinsight.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * @author gsxi
 * @version 1.0
 * @date 2025/8/16
 * @description 用户
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user")
public class User implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 32)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, length = 100)
    private String email;

    @Column(unique = true, length = 20)
    private String phone;

    private String avatar;

    @Column(length = 50)
    private String nickname;

    @Column(length = 200)
    private String bio;

    @Column(nullable = false)
    private Integer status = 1;

    private LocalDateTime lastLoginTime;

    private String lastLoginIp;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /**
     * 总模拟金额
     */
    @Column(name = "total_simulation_assets")
    private BigDecimal totalSimulationAssets;

    /**
     * 总模拟训练次数
     */
    @Column(name = "total_transaction_count")
    private Integer totalTransactionCount;

}