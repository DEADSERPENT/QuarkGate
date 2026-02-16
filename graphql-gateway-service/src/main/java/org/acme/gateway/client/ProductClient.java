package org.acme.gateway.client;

import io.smallrye.mutiny.Uni;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.acme.gateway.dto.downstream.ProductResponse;
import org.eclipse.microprofile.faulttolerance.Timeout;
import org.eclipse.microprofile.rest.client.annotation.RegisterProvider;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import java.util.List;

/**
 * MicroProfile REST Client for the Product microservice.
 *
 * Config key "product-api" maps to application.properties:
 *   quarkus.rest-client.product-api.url=http://product-service:8082
 */
@Path("/products")
@RegisterRestClient(configKey = "product-api")
@RegisterProvider(AuthHeaderPropagationFilter.class)
@Produces(MediaType.APPLICATION_JSON)
@Timeout(4000)
public interface ProductClient {

    @GET
    Uni<List<ProductResponse>> getAll();

    @GET
    @Path("/{id}")
    Uni<ProductResponse> getById(@PathParam("id") Long id);
}
