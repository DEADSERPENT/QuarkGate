package org.acme.orderservice.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderCreatedEvent {

    public Long orderId;
    public Long userId;
    public BigDecimal totalAmount;
    public String status;
    public LocalDateTime createdAt;
    public List<Long> productIds;

    public OrderCreatedEvent() {
    }

    public OrderCreatedEvent(Long orderId, Long userId, BigDecimal totalAmount,
                             String status, LocalDateTime createdAt, List<Long> productIds) {
        this.orderId = orderId;
        this.userId = userId;
        this.totalAmount = totalAmount;
        this.status = status;
        this.createdAt = createdAt;
        this.productIds = productIds;
    }
}
