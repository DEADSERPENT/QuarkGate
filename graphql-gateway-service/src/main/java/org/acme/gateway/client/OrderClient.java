package org.acme.gateway.client;

import io.smallrye.mutiny.Uni;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.acme.gateway.dto.downstream.OrderResponse;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import java.util.List;

/**
 * MicroProfile REST Client for the Order microservice.
 *
 * Config key "order-api" maps to application.properties:
 *   quarkus.rest-client.order-api.url=http://order-service:8083
 */
@Path("/orders")
@RegisterRestClient(configKey = "order-api")
@Produces(MediaType.APPLICATION_JSON)
public interface OrderClient {

    @GET
    Uni<List<OrderResponse>> getAll();

    @GET
    @Path("/{id}")
    Uni<OrderResponse> getById(@PathParam("id") Long id);

    @GET
    @Path("/user/{userId}")
    Uni<List<OrderResponse>> getByUserId(@PathParam("userId") Long userId);
}
