package org.acme.gateway.resource;

import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.acme.gateway.client.OrderClient;
import org.acme.gateway.client.PaymentClient;
import org.acme.gateway.client.ProductClient;
import org.acme.gateway.dto.downstream.CreateOrderRequest;
import org.acme.gateway.dto.downstream.OrderResponse;
import org.acme.gateway.dto.downstream.PaymentResponse;
import org.acme.gateway.dto.downstream.ProductResponse;
import org.acme.gateway.event.OrderEventBroadcaster;
import org.acme.gateway.model.Order;
import org.acme.gateway.model.Payment;
import org.acme.gateway.model.Product;
import org.eclipse.microprofile.faulttolerance.CircuitBreaker;
import org.eclipse.microprofile.faulttolerance.Fallback;
import org.eclipse.microprofile.faulttolerance.Retry;
import org.eclipse.microprofile.faulttolerance.Timeout;
import org.eclipse.microprofile.graphql.*;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * GraphQL API for Order queries.
 *
 * Demonstrates nested resolution:
 *   order → products (scatter to Product-Service for each productId)
 *   order → payment (single call to Payment-Service)
 */
@GraphQLApi
public class OrderResolver {

    private static final Logger LOG = Logger.getLogger(OrderResolver.class);

    @Inject
    @RestClient
    OrderClient orderClient;

    @Inject
    @RestClient
    ProductClient productClient;

    @Inject
    @RestClient
    PaymentClient paymentClient;

    @Inject
    OrderEventBroadcaster orderEventBroadcaster;

    // ──────────────────────────────────────────────
    //  Root Queries
    // ──────────────────────────────────────────────

    @Query("orders")
    @Description("Get all orders")
    @Timeout(5000)
    @Retry(maxRetries = 3, delay = 200)
    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 10000)
    @Fallback(fallbackMethod = "getAllOrdersFallback")
    public Uni<List<Order>> getAllOrders() {
        long start = System.nanoTime();
        return orderClient.getAll()
                .onItem().transform(responses -> {
                    List<Order> orders = responses.stream()
                            .map(OrderResolver::toOrder)
                            .collect(Collectors.toList());
                    long elapsed = (System.nanoTime() - start) / 1_000_000;
                    LOG.infof("[TIMING] orders() -> Order-Service: %dms (%d results)", elapsed, orders.size());
                    return orders;
                });
    }

    @Query("order")
    @Description("Get a single order by ID")
    @Timeout(5000)
    @Retry(maxRetries = 3, delay = 200)
    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 10000)
    @Fallback(fallbackMethod = "getOrderFallback")
    public Uni<Order> getOrder(@Name("id") Long id) {
        long start = System.nanoTime();
        return orderClient.getById(id)
                .onItem().transform(response -> {
                    Order order = toOrder(response);
                    long elapsed = (System.nanoTime() - start) / 1_000_000;
                    LOG.infof("[TIMING] order(id=%d) -> Order-Service: %dms", id, elapsed);
                    return order;
                });
    }

    // ──────────────────────────────────────────────
    //  Field Resolver: Order.products
    //  Scatter-Gather: fires parallel requests for each productId
    // ──────────────────────────────────────────────

    @Name("products")
    @Description("Products in this order (resolved from Product-Service)")
    @Timeout(5000)
    @Retry(maxRetries = 3, delay = 200)
    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 10000)
    @Fallback(fallbackMethod = "getProductsForOrderFallback")
    public Uni<List<Product>> getProductsForOrder(@Source Order order) {
        if (order.getProductIds() == null || order.getProductIds().isEmpty()) {
            return Uni.createFrom().item(List.of());
        }

        long start = System.nanoTime();
        int productCount = order.getProductIds().size();

        // Fire all product fetches in parallel using Multi
        return Multi.createFrom().iterable(order.getProductIds())
                .onItem().transformToUniAndMerge(productId ->
                        productClient.getById(productId)
                                .onItem().transform(OrderResolver::toProduct)
                )
                .collect().asList()
                .onItem().invoke(products -> {
                    long elapsed = (System.nanoTime() - start) / 1_000_000;
                    LOG.infof("[TIMING] Order(%d).products -> Product-Service (scatter %d calls): %dms",
                            order.getId(), productCount, elapsed);
                });
    }

    // ──────────────────────────────────────────────
    //  Field Resolver: Order.payment
    // ──────────────────────────────────────────────

    @Name("payment")
    @Description("Payment details for this order (resolved from Payment-Service)")
    @Timeout(5000)
    @Retry(maxRetries = 3, delay = 200)
    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 10000)
    @Fallback(fallbackMethod = "getPaymentForOrderFallback")
    public Uni<Payment> getPaymentForOrder(@Source Order order) {
        long start = System.nanoTime();
        return paymentClient.getByOrderId(order.getId())
                .onItem().transform(response -> {
                    Payment payment = toPayment(response);
                    long elapsed = (System.nanoTime() - start) / 1_000_000;
                    LOG.infof("[TIMING] Order(%d).payment -> Payment-Service: %dms", order.getId(), elapsed);
                    return payment;
                });
    }

    // ──────────────────────────────────────────────
    //  Mutation: Create Order
    // ──────────────────────────────────────────────

    @Mutation("createOrder")
    @Description("Create a new order (triggers Kafka event + subscription)")
    public Uni<Order> createOrder(@Name("userId") Long userId,
                                  @Name("totalAmount") BigDecimal totalAmount,
                                  @Name("productIds") List<Long> productIds) {
        CreateOrderRequest request = new CreateOrderRequest();
        request.userId = userId;
        request.totalAmount = totalAmount;
        request.productIds = productIds;

        return orderClient.create(request)
                .onItem().transform(response -> {
                    Order order = toOrder(response);
                    orderEventBroadcaster.broadcast(order);
                    LOG.infof("[MUTATION] createOrder -> Order-Service: orderId=%d", order.getId());
                    return order;
                });
    }

    // ──────────────────────────────────────────────
    //  Subscription: Order Created
    // ──────────────────────────────────────────────

    @Subscription("orderCreated")
    @Description("Subscribe to new order events")
    public Multi<Order> onOrderCreated() {
        return orderEventBroadcaster.stream();
    }

    // ──────────────────────────────────────────────
    //  Fallback Methods
    // ──────────────────────────────────────────────

    Uni<List<Order>> getAllOrdersFallback() {
        LOG.warn("[FALLBACK] getAllOrders() — Order-Service unavailable, returning empty list");
        return Uni.createFrom().item(Collections.emptyList());
    }

    Uni<Order> getOrderFallback(Long id) {
        LOG.warnf("[FALLBACK] getOrder(id=%d) — Order-Service unavailable, returning null", id);
        return Uni.createFrom().nullItem();
    }

    Uni<List<Product>> getProductsForOrderFallback(Order order) {
        LOG.warnf("[FALLBACK] getProductsForOrder(orderId=%d) — Product-Service unavailable, returning empty list", order.getId());
        return Uni.createFrom().item(Collections.emptyList());
    }

    Uni<Payment> getPaymentForOrderFallback(Order order) {
        LOG.warnf("[FALLBACK] getPaymentForOrder(orderId=%d) — Payment-Service unavailable, returning null", order.getId());
        return Uni.createFrom().nullItem();
    }

    // ──────────────────────────────────────────────
    //  Mappers
    // ──────────────────────────────────────────────

    static Order toOrder(OrderResponse r) {
        return new Order(
                r.id,
                r.userId,
                r.status,
                r.totalAmount,
                r.createdAt != null ? LocalDateTime.parse(r.createdAt) : null,
                r.productIds
        );
    }

    static Product toProduct(ProductResponse r) {
        return new Product(r.id, r.name, r.description, r.price, r.stockQuantity, r.category);
    }

    static Payment toPayment(PaymentResponse r) {
        return new Payment(
                r.id,
                r.orderId,
                r.amount,
                r.method,
                r.status,
                r.processedAt != null ? LocalDateTime.parse(r.processedAt) : null
        );
    }
}
