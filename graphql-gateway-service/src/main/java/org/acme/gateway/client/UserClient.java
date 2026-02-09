package org.acme.gateway.client;

import io.smallrye.mutiny.Uni;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.acme.gateway.dto.downstream.UserResponse;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import java.util.List;

/**
 * MicroProfile REST Client for the User microservice.
 * Quarkus generates the HTTP client implementation at build time.
 *
 * Config key "user-api" maps to application.properties:
 *   quarkus.rest-client.user-api.url=http://user-service:8081
 */
@Path("/users")
@RegisterRestClient(configKey = "user-api")
@Produces(MediaType.APPLICATION_JSON)
public interface UserClient {

    @GET
    Uni<List<UserResponse>> getAll();

    @GET
    @Path("/{id}")
    Uni<UserResponse> getById(@PathParam("id") Long id);
}
