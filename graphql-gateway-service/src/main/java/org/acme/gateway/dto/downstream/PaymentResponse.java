package org.acme.gateway.dto.downstream;

import java.math.BigDecimal;

/**
 * DTO matching the exact JSON shape returned by the Payment microservice.
 */
public class PaymentResponse {

    public Long id;
    public Long orderId;
    public BigDecimal amount;
    public String method;
    public String status;
    public String processedAt;
}
