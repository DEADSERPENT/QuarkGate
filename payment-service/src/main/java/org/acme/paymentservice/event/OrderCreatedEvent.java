package org.acme.paymentservice.event;

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
}
