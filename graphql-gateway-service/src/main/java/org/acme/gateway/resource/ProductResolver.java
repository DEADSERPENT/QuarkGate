package org.acme.gateway.resource;

import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.acme.gateway.client.ProductClient;
import org.acme.gateway.dto.downstream.ProductResponse;
import org.acme.gateway.model.Product;
import org.eclipse.microprofile.graphql.*;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import java.util.List;
import java.util.stream.Collectors;

/**
 * GraphQL API for direct Product queries.
 */
@GraphQLApi
public class ProductResolver {

    @Inject
    @RestClient
    ProductClient productClient;

    @Query("products")
    @Description("Get all products")
    public Uni<List<Product>> getAllProducts() {
        return productClient.getAll()
                .onItem().transform(responses ->
                        responses.stream()
                                .map(ProductResolver::toProduct)
                                .collect(Collectors.toList())
                );
    }

    @Query("product")
    @Description("Get a single product by ID")
    public Uni<Product> getProduct(@Name("id") Long id) {
        return productClient.getById(id)
                .onItem().transform(ProductResolver::toProduct);
    }

    static Product toProduct(ProductResponse r) {
        return new Product(r.id, r.name, r.description, r.price, r.stockQuantity, r.category);
    }
}
