package org.acme.gateway.client;

import io.smallrye.mutiny.Uni;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.acme.gateway.dto.downstream.PaymentResponse;
import org.eclipse.microprofile.faulttolerance.Timeout;
import org.eclipse.microprofile.rest.client.annotation.RegisterProvider;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

/**
 * MicroProfile REST Client for the Payment microservice.
 *
 * Config key "payment-api" maps to application.properties:
 *   quarkus.rest-client.payment-api.url=http://payment-service:8084
 */
@Path("/payments")
@RegisterRestClient(configKey = "payment-api")
@RegisterProvider(AuthHeaderPropagationFilter.class)
@Produces(MediaType.APPLICATION_JSON)
@Timeout(4000)
public interface PaymentClient {

    @GET
    @Path("/order/{orderId}")
    Uni<PaymentResponse> getByOrderId(@PathParam("orderId") Long orderId);
}
