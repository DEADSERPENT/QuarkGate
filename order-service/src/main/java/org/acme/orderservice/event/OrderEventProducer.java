package org.acme.orderservice.event;

import io.smallrye.mutiny.Uni;
import io.smallrye.reactive.messaging.MutinyEmitter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.reactive.messaging.Channel;
import org.jboss.logging.Logger;

@ApplicationScoped
public class OrderEventProducer {

    private static final Logger LOG = Logger.getLogger(OrderEventProducer.class);

    @Inject
    @Channel("order-events-out")
    MutinyEmitter<OrderCreatedEvent> emitter;

    public Uni<Void> sendOrderCreated(OrderCreatedEvent event) {
        LOG.infof("Publishing OrderCreatedEvent for orderId=%d", event.orderId);
        return emitter.send(event);
    }
}
