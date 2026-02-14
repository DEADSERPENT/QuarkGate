package org.acme.gateway.resource;

import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.acme.gateway.client.OrderClient;
import org.acme.gateway.client.UserClient;
import org.acme.gateway.dto.downstream.OrderResponse;
import org.acme.gateway.dto.downstream.UserResponse;
import org.acme.gateway.model.Order;
import org.acme.gateway.model.User;
import org.eclipse.microprofile.graphql.*;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * GraphQL API for User queries.
 *
 * This resolver demonstrates the Gateway Aggregation Pattern:
 * 1. Root query fetches User from User-Service
 * 2. Field resolver "orders" fetches from Order-Service when requested
 * 3. Quarkus only calls field resolvers if the client actually requests that field
 *    (this is the key advantage over REST — no over-fetching)
 */
@GraphQLApi
public class UserResolver {

    private static final Logger LOG = Logger.getLogger(UserResolver.class);

    @Inject
    @RestClient
    UserClient userClient;

    @Inject
    @RestClient
    OrderClient orderClient;

    // ──────────────────────────────────────────────
    //  Root Queries
    // ──────────────────────────────────────────────

    @Query("users")
    @Description("Get all users")
    public Uni<List<User>> getAllUsers() {
        long start = System.nanoTime();
        return userClient.getAll()
                .onItem().transform(responses -> {
                    List<User> users = responses.stream()
                            .map(UserResolver::toUser)
                            .collect(Collectors.toList());
                    long elapsed = (System.nanoTime() - start) / 1_000_000;
                    LOG.infof("[TIMING] users() -> User-Service: %dms (%d results)", elapsed, users.size());
                    return users;
                });
    }

    @Query("user")
    @Description("Get a single user by ID")
    public Uni<User> getUser(@Name("id") Long id) {
        long start = System.nanoTime();
        return userClient.getById(id)
                .onItem().transform(response -> {
                    User user = toUser(response);
                    long elapsed = (System.nanoTime() - start) / 1_000_000;
                    LOG.infof("[TIMING] user(id=%d) -> User-Service: %dms", id, elapsed);
                    return user;
                });
    }

    // ──────────────────────────────────────────────
    //  Field Resolver: User.orders
    //  Only invoked when the client queries { user { orders { ... } } }
    // ──────────────────────────────────────────────

    @Name("orders")
    @Description("Orders placed by this user (resolved from Order-Service)")
    public Uni<List<Order>> getOrdersForUser(@Source User user) {
        long start = System.nanoTime();
        return orderClient.getByUserId(user.getId())
                .onItem().transform(responses -> {
                    List<Order> orders = responses.stream()
                            .map(UserResolver::toOrder)
                            .collect(Collectors.toList());
                    long elapsed = (System.nanoTime() - start) / 1_000_000;
                    LOG.infof("[TIMING] User(%d).orders -> Order-Service: %dms (%d results)",
                            user.getId(), elapsed, orders.size());
                    return orders;
                });
    }

    // ──────────────────────────────────────────────
    //  Mappers: DTO → GraphQL Model
    // ──────────────────────────────────────────────

    static User toUser(UserResponse r) {
        return new User(r.id, r.username, r.email, r.fullName);
    }

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
}
