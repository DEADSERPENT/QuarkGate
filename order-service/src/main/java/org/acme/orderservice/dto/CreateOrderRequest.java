package org.acme.orderservice.dto;

import java.math.BigDecimal;
import java.util.List;

public class CreateOrderRequest {

    public Long userId;
    public BigDecimal totalAmount;
    public List<Long> productIds;
}
