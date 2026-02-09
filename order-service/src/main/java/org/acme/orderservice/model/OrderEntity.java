package org.acme.orderservice.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "orders")
public class OrderEntity extends PanacheEntity {

    public Long userId;

    public String status;

    public BigDecimal totalAmount;

    public LocalDateTime createdAt;

    public String productIds;

    public List<Long> getProductIdList() {
        if (productIds == null || productIds.isBlank()) return List.of();
        return Arrays.stream(productIds.split(","))
                .map(String::trim)
                .map(Long::parseLong)
                .collect(Collectors.toList());
    }

    public static List<OrderEntity> findByUserId(Long userId) {
        return list("userId", userId);
    }
}
