package org.acme.gateway.dto.downstream;

/**
 * DTO matching the exact JSON shape returned by the User microservice.
 * Decouples the gateway's GraphQL schema from the downstream REST contract.
 */
public class UserResponse {

    public Long id;
    public String username;
    public String email;
    public String fullName;
    public String createdAt;
}
