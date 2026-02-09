package org.acme.orderservice.resource;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.orderservice.dto.OrderDTO;
import org.acme.orderservice.model.OrderEntity;

import java.util.List;
import java.util.stream.Collectors;

@Path("/orders")
@Produces(MediaType.APPLICATION_JSON)
public class OrderResource {

    @GET
    public List<OrderDTO> getAll() {
        return OrderEntity.listAll().stream()
                .map(e -> OrderDTO.from((OrderEntity) e))
                .collect(Collectors.toList());
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        OrderEntity entity = OrderEntity.findById(id);
        if (entity == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(OrderDTO.from(entity)).build();
    }

    @GET
    @Path("/user/{userId}")
    public List<OrderDTO> getByUserId(@PathParam("userId") Long userId) {
        return OrderEntity.findByUserId(userId).stream()
                .map(OrderDTO::from)
                .collect(Collectors.toList());
    }
}
