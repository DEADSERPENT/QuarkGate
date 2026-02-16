package org.acme.gateway.event;

import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.operators.multi.processors.BroadcastProcessor;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.gateway.model.Order;
import org.jboss.logging.Logger;

@ApplicationScoped
public class OrderEventBroadcaster {

    private static final Logger LOG = Logger.getLogger(OrderEventBroadcaster.class);

    private final BroadcastProcessor<Order> processor = BroadcastProcessor.create();

    public void broadcast(Order order) {
        LOG.infof("[SUBSCRIPTION] Broadcasting new order id=%d", order.getId());
        processor.onNext(order);
    }

    public Multi<Order> stream() {
        return processor;
    }
}
