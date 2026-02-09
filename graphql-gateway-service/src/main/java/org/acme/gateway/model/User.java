package org.acme.gateway.model;

import java.util.List;

/**
 * GraphQL Type representing a User.
 * This is the shape the client sees in the unified schema.
 */
public class User {

    private Long id;
    private String username;
    private String email;
    private String fullName;

    // Resolved lazily via @Source in UserResolver
    private List<Order> orders;

    public User() {
    }

    public User(Long id, String username, String email, String fullName) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public List<Order> getOrders() {
        return orders;
    }

    public void setOrders(List<Order> orders) {
        this.orders = orders;
    }
}
