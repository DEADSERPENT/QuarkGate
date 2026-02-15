package org.acme.paymentservice.event;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.acme.paymentservice.model.PaymentEntity;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;

@ApplicationScoped
public class OrderEventConsumer {

    private static final Logger LOG = Logger.getLogger(OrderEventConsumer.class);

    @Incoming("order-events-in")
    @Transactional
    public void onOrderCreated(OrderCreatedEvent event) {
        LOG.infof("Received OrderCreatedEvent for orderId=%d, amount=%s", event.orderId, event.totalAmount);

        PaymentEntity existing = PaymentEntity.findByOrderId(event.orderId);
        if (existing != null) {
            LOG.warnf("Payment already exists for orderId=%d, skipping", event.orderId);
            return;
        }

        PaymentEntity payment = new PaymentEntity();
        payment.orderId = event.orderId;
        payment.amount = event.totalAmount;
        payment.method = "CARD";
        payment.status = "PENDING";
        payment.processedAt = LocalDateTime.now();
        payment.persist();

        LOG.infof("Created payment id=%d for orderId=%d", payment.id, event.orderId);
    }
}
