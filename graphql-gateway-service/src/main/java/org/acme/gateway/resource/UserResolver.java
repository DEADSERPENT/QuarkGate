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
        return userClient.getAll()
                .onItem().transform(responses ->
                        responses.stream()
                                .map(UserResolver::toUser)
                                .collect(Collectors.toList())
                );
    }

    @Query("user")
    @Description("Get a single user by ID")
    public Uni<User> getUser(@Name("id") Long id) {
        return userClient.getById(id)
                .onItem().transform(UserResolver::toUser);
    }

    // ──────────────────────────────────────────────
    //  Field Resolver: User.orders
    //  Only invoked when the client queries { user { orders { ... } } }
    // ──────────────────────────────────────────────

    @Name("orders")
    @Description("Orders placed by this user (resolved from Order-Service)")
    public Uni<List<Order>> getOrdersForUser(@Source User user) {
        return orderClient.getByUserId(user.getId())
                .onItem().transform(responses ->
                        responses.stream()
                                .map(UserResolver::toOrder)
                                .collect(Collectors.toList())
                );
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
