package org.acme.gateway.model;

import org.eclipse.microprofile.graphql.Ignore;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * GraphQL Type representing an Order.
 * The "products" and "payment" fields are resolved lazily via OrderResolver @Source methods.
 */
public class Order {

    private Long id;
    private Long userId;
    private String status;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;

    @Ignore
    private List<Long> productIds;

    public Order() {
    }

    public Order(Long id, Long userId, String status, BigDecimal totalAmount,
                 LocalDateTime createdAt, List<Long> productIds) {
        this.id = id;
        this.userId = userId;
        this.status = status;
        this.totalAmount = totalAmount;
        this.createdAt = createdAt;
        this.productIds = productIds;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<Long> getProductIds() {
        return productIds;
    }

    public void setProductIds(List<Long> productIds) {
        this.productIds = productIds;
    }
}
