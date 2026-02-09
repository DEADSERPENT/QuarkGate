package org.acme.gateway.resource;

import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.acme.gateway.client.OrderClient;
import org.acme.gateway.client.PaymentClient;
import org.acme.gateway.client.ProductClient;
import org.acme.gateway.dto.downstream.OrderResponse;
import org.acme.gateway.dto.downstream.PaymentResponse;
import org.acme.gateway.dto.downstream.ProductResponse;
import org.acme.gateway.model.Order;
import org.acme.gateway.model.Payment;
import org.acme.gateway.model.Product;
import org.eclipse.microprofile.graphql.*;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    @Inject
    @RestClient
    OrderClient orderClient;

    @Inject
    @RestClient
    ProductClient productClient;

    @Inject
    @RestClient
    PaymentClient paymentClient;

    // ──────────────────────────────────────────────
    //  Root Queries
    // ──────────────────────────────────────────────

    @Query("orders")
    @Description("Get all orders")
    public Uni<List<Order>> getAllOrders() {
        return orderClient.getAll()
                .onItem().transform(responses ->
                        responses.stream()
                                .map(OrderResolver::toOrder)
                                .collect(Collectors.toList())
                );
    }

    @Query("order")
    @Description("Get a single order by ID")
    public Uni<Order> getOrder(@Name("id") Long id) {
        return orderClient.getById(id)
                .onItem().transform(OrderResolver::toOrder);
    }

    // ──────────────────────────────────────────────
    //  Field Resolver: Order.products
    //  Scatter-Gather: fires parallel requests for each productId
    // ──────────────────────────────────────────────

    @Name("products")
    @Description("Products in this order (resolved from Product-Service)")
    public Uni<List<Product>> getProductsForOrder(@Source Order order) {
        if (order.getProductIds() == null || order.getProductIds().isEmpty()) {
            return Uni.createFrom().item(List.of());
        }

        // Fire all product fetches in parallel using Multi
        return Multi.createFrom().iterable(order.getProductIds())
                .onItem().transformToUniAndMerge(productId ->
                        productClient.getById(productId)
                                .onItem().transform(OrderResolver::toProduct)
                )
                .collect().asList();
    }

    // ──────────────────────────────────────────────
    //  Field Resolver: Order.payment
    // ──────────────────────────────────────────────

    @Name("payment")
    @Description("Payment details for this order (resolved from Payment-Service)")
    public Uni<Payment> getPaymentForOrder(@Source Order order) {
        return paymentClient.getByOrderId(order.getId())
                .onItem().transform(OrderResolver::toPayment);
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
