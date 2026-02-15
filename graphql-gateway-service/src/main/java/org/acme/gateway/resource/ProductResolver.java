package org.acme.gateway.resource;

import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.acme.gateway.client.ProductClient;
import org.acme.gateway.dto.downstream.ProductResponse;
import org.acme.gateway.model.Product;
import io.quarkus.cache.CacheKey;
import io.quarkus.cache.CacheResult;
import org.eclipse.microprofile.faulttolerance.CircuitBreaker;
import org.eclipse.microprofile.faulttolerance.Fallback;
import org.eclipse.microprofile.faulttolerance.Retry;
import org.eclipse.microprofile.faulttolerance.Timeout;
import org.eclipse.microprofile.graphql.*;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * GraphQL API for direct Product queries.
 */
@GraphQLApi
public class ProductResolver {

    private static final Logger LOG = Logger.getLogger(ProductResolver.class);

    @Inject
    @RestClient
    ProductClient productClient;

    @Query("products")
    @Description("Get all products")
    @CacheResult(cacheName = "products-cache")
    @Timeout(5000)
    @Retry(maxRetries = 3, delay = 200)
    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 10000)
    @Fallback(fallbackMethod = "getAllProductsFallback")
    public Uni<List<Product>> getAllProducts() {
        long start = System.nanoTime();
        return productClient.getAll()
                .onItem().transform(responses -> {
                    List<Product> products = responses.stream()
                            .map(ProductResolver::toProduct)
                            .collect(Collectors.toList());
                    long elapsed = (System.nanoTime() - start) / 1_000_000;
                    LOG.infof("[TIMING] products() -> Product-Service: %dms (%d results)", elapsed, products.size());
                    return products;
                });
    }

    @Query("product")
    @Description("Get a single product by ID")
    @CacheResult(cacheName = "product-cache")
    @Timeout(5000)
    @Retry(maxRetries = 3, delay = 200)
    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 10000)
    @Fallback(fallbackMethod = "getProductFallback")
    public Uni<Product> getProduct(@Name("id") @CacheKey Long id) {
        long start = System.nanoTime();
        return productClient.getById(id)
                .onItem().transform(response -> {
                    Product product = toProduct(response);
                    long elapsed = (System.nanoTime() - start) / 1_000_000;
                    LOG.infof("[TIMING] product(id=%d) -> Product-Service: %dms", id, elapsed);
                    return product;
                });
    }

    Uni<List<Product>> getAllProductsFallback() {
        LOG.warn("[FALLBACK] getAllProducts() — Product-Service unavailable, returning empty list");
        return Uni.createFrom().item(Collections.emptyList());
    }

    Uni<Product> getProductFallback(Long id) {
        LOG.warnf("[FALLBACK] getProduct(id=%d) — Product-Service unavailable, returning null", id);
        return Uni.createFrom().nullItem();
    }

    static Product toProduct(ProductResponse r) {
        return new Product(r.id, r.name, r.description, r.price, r.stockQuantity, r.category);
    }
}
