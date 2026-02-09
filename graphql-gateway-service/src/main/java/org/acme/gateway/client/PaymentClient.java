package org.acme.gateway.client;

import io.smallrye.mutiny.Uni;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.acme.gateway.dto.downstream.PaymentResponse;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

/**
 * MicroProfile REST Client for the Payment microservice.
 *
 * Config key "payment-api" maps to application.properties:
 *   quarkus.rest-client.payment-api.url=http://payment-service:8084
 */
@Path("/payments")
@RegisterRestClient(configKey = "payment-api")
@Produces(MediaType.APPLICATION_JSON)
public interface PaymentClient {

    @GET
    @Path("/order/{orderId}")
    Uni<PaymentResponse> getByOrderId(@PathParam("orderId") Long orderId);
}
