package org.acme.paymentservice.resource;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.paymentservice.model.PaymentEntity;

@Path("/payments")
@Produces(MediaType.APPLICATION_JSON)
public class PaymentResource {

    @GET
    @Path("/order/{orderId}")
    public Response getByOrderId(@PathParam("orderId") Long orderId) {
        PaymentEntity entity = PaymentEntity.findByOrderId(orderId);
        if (entity == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(entity).build();
    }
}
