package org.acme.gateway.dto.downstream;

import java.math.BigDecimal;

/**
 * DTO matching the exact JSON shape returned by the Product microservice.
 */
public class ProductResponse {

    public Long id;
    public String name;
    public String description;
    public BigDecimal price;
    public Integer stockQuantity;
    public String category;
}
