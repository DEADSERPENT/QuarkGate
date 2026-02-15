package org.acme.orderservice.resource;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.orderservice.dto.CreateOrderRequest;
import org.acme.orderservice.dto.OrderDTO;
import org.acme.orderservice.event.OrderCreatedEvent;
import org.acme.orderservice.event.OrderEventProducer;
import org.acme.orderservice.model.OrderEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Path("/orders")
@Produces(MediaType.APPLICATION_JSON)
public class OrderResource {

    @Inject
    OrderEventProducer eventProducer;

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

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    public Response createOrder(CreateOrderRequest request) {
        OrderEntity entity = new OrderEntity();
        entity.userId = request.userId;
        entity.totalAmount = request.totalAmount;
        entity.status = "PENDING";
        entity.createdAt = LocalDateTime.now();
        entity.productIds = request.productIds != null
                ? request.productIds.stream().map(String::valueOf).collect(Collectors.joining(","))
                : "";
        entity.persist();

        OrderCreatedEvent event = new OrderCreatedEvent(
                entity.id,
                entity.userId,
                entity.totalAmount,
                entity.status,
                entity.createdAt,
                entity.getProductIdList()
        );
        eventProducer.sendOrderCreated(event).subscribe().with(
                success -> {},
                failure -> {}
        );

        return Response.status(Response.Status.CREATED)
                .entity(OrderDTO.from(entity))
                .build();
    }
}
