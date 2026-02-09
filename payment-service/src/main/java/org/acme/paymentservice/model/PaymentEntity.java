package org.acme.paymentservice.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class PaymentEntity extends PanacheEntity {

    public Long orderId;

    public BigDecimal amount;

    public String method;

    public String status;

    public LocalDateTime processedAt;

    public static PaymentEntity findByOrderId(Long orderId) {
        return find("orderId", orderId).firstResult();
    }
}
