package org.acme.orderservice.dto;

import org.acme.orderservice.model.OrderEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderDTO {

    public Long id;
    public Long userId;
    public String status;
    public BigDecimal totalAmount;
    public LocalDateTime createdAt;
    public List<Long> productIds;

    public static OrderDTO from(OrderEntity entity) {
        OrderDTO dto = new OrderDTO();
        dto.id = entity.id;
        dto.userId = entity.userId;
        dto.status = entity.status;
        dto.totalAmount = entity.totalAmount;
        dto.createdAt = entity.createdAt;
        dto.productIds = entity.getProductIdList();
        return dto;
    }
}
