package org.acme.gateway.dto.downstream;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO matching the exact JSON shape returned by the Order microservice.
 */
public class OrderResponse {

    public Long id;
    public Long userId;
    public String status;
    public BigDecimal totalAmount;
    public String createdAt;
    public List<Long> productIds;
}
