package org.acme.gateway.dto.downstream;

import java.math.BigDecimal;
import java.util.List;

public class CreateOrderRequest {

    public Long userId;
    public BigDecimal totalAmount;
    public List<Long> productIds;
}
