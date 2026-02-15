╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 QuarkGate Backend Core Features — Implementation Plan  

 Context

 QuarkGate is an M.Tech thesis project demonstrating GraphQL Gateway aggregation over REST microservices using Quarkus. The backend currently has  
 4 REST microservices + 1 GraphQL gateway, all read-only, with no auth, no caching applied, no messaging, and fault tolerance dependencies present 
  but unused. This plan adds 4 backend features to make the system production-grade.

 Implementation Order

 Feature 2 (Fault Tolerance) → Feature 5 (Redis Caching) → Feature 3 (Kafka Events) → Feature 4 (JWT/Keycloak)

 Rationale: Features 2 and 5 are annotation-only changes on existing code with no new infrastructure. Feature 3 introduces Kafka + new endpoints.  
 Feature 4 (Keycloak) is the most cross-cutting and should come last.

 ---
 Feature 2: Fault Tolerance & Circuit Breakers

 No new dependencies — quarkus-smallrye-fault-tolerance already in gateway pom.xml.

 Files to modify

 graphql-gateway-service/.../resource/ProductResolver.java
 - Add @Timeout(5s), @Retry(max=3, delay=200ms), @CircuitBreaker(threshold=10, failureRatio=0.5, delay=10s), @Fallback to getAllProducts() and     
 getProduct(id)
 - Fallback methods return empty list / null

 graphql-gateway-service/.../resource/UserResolver.java
 - Same pattern on getAllUsers(), getUser(id), getOrdersForUser(@Source)
 - Field resolver fallback returns empty list (prevents cascade failure)

 graphql-gateway-service/.../resource/OrderResolver.java
 - Same pattern on getAllOrders(), getOrder(id), getProductsForOrder(@Source), getPaymentForOrder(@Source)
 - Payment fallback returns null (partial data is acceptable)

 Key detail

 SmallRye FT works natively with Uni<>. Fallback methods must have the exact same signature as the annotated method (including @Source parameters  
 for field resolvers).

 ---
 Feature 5: Redis Caching

 Dependencies to add

 graphql-gateway-service/pom.xml — add:
 <artifactId>quarkus-redis-cache</artifactId>

 Configuration changes

 graphql-gateway-service/.../application.properties:
 - Change quarkus.cache.type=caffeine → quarkus.cache.type=redis
 - Add TTLs: quarkus.cache.redis."products-cache".ttl=60S, quarkus.cache.redis."product-cache".ttl=120S, etc.

 Files to modify

 ProductResolver.java — add @CacheResult(cacheName = "products-cache") on getAllProducts(), @CacheResult(cacheName = "product-cache") + @CacheKey  
 on getProduct(id)

 UserResolver.java — add @CacheResult(cacheName = "users-cache") on getAllUsers(), @CacheResult(cacheName = "user-cache") on getUser(id)

 Do NOT cache orders or field resolvers (orders are write-heavy after Feature 3).

 ---
 Feature 3: Event-Driven Architecture (Kafka)

 Dependencies to add

 order-service/pom.xml and payment-service/pom.xml — add:
 <artifactId>quarkus-smallrye-reactive-messaging-kafka</artifactId>

 Infrastructure (docker-compose.yml)

 Add Zookeeper (confluentinc/cp-zookeeper:7.5.0) and Kafka (confluentinc/cp-kafka:7.5.0) services. Update order-service and payment-service to     
 depend on kafka.

 New files to create

 ┌──────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────┐        
 │                             File                             │                                 Purpose                                 │        
 ├──────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤        
 │ order-service/.../event/OrderCreatedEvent.java               │ Event DTO (orderId, userId, totalAmount, status, createdAt, productIds) │        
 ├──────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤        
 │ order-service/.../event/OrderEventProducer.java              │ CDI bean with @Channel("order-events-out") MutinyEmitter                │        
 ├──────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤        
 │ order-service/.../dto/CreateOrderRequest.java                │ Request DTO for POST /orders                                            │        
 ├──────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤        
 │ payment-service/.../event/OrderCreatedEvent.java             │ Consumer-side copy of event DTO                                         │        
 ├──────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤        
 │ payment-service/.../event/OrderCreatedEventDeserializer.java │ Extends ObjectMapperDeserializer<OrderCreatedEvent>                     │
 ├──────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤        
 │ payment-service/.../event/OrderEventConsumer.java            │ @Incoming("order-events-in") handler that creates PaymentEntity         │        
 └──────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────┘        

 Files to modify

 order-service/.../resource/OrderResource.java — add POST /orders endpoint that persists an order and publishes OrderCreatedEvent via the producer 

 order-service/.../application.properties — add Kafka config (channel order-events-out, topic order-events, bootstrap localhost:29092 /
 %docker.kafka:9092)

 payment-service/.../application.properties — add Kafka config (channel order-events-in, group.id payment-service, dead-letter-queue failure       
 strategy)

 ---
 Feature 4: JWT Authentication (Keycloak)

 Dependencies to add

 graphql-gateway-service/pom.xml — add:
 <artifactId>quarkus-oidc</artifactId>

 Infrastructure (docker-compose.yml)

 Add Keycloak (quay.io/keycloak/keycloak:23.0) on port 8180 with start-dev --import-realm. Mount realm-export.json. Gateway depends on keycloak.   

 New files to create

 keycloak/realm-export.json — Pre-configured realm quarkgate with:
 - Client: graphql-gateway (public, direct access grants enabled)
 - Roles: user, admin
 - Users: testuser/test123 (role: user), adminuser/admin123 (role: admin)
 - Redirect URIs: localhost:8080/*, localhost:5173/*

 graphql-gateway-service/.../client/AuthHeaderPropagationFilter.java (optional) — ClientRequestFilter that propagates X-Authenticated-User header  
 to downstream services using SecurityIdentity

 Configuration changes

 graphql-gateway-service/.../application.properties:
 quarkus.oidc.auth-server-url=http://localhost:8180/realms/quarkgate
 quarkus.oidc.client-id=graphql-gateway
 quarkus.oidc.application-type=service
 quarkus.http.auth.permission.public.paths=/graphql,/graphql/*,/q/*,/graphql-ui/*
 quarkus.http.auth.permission.public.policy=permit
 %docker.quarkus.oidc.auth-server-url=http://keycloak:8180/realms/quarkgate

 Auth is optional at the HTTP layer (read queries work without tokens). Use @RolesAllowed on specific mutations if needed.

 ---
 Verification Plan

 1. Feature 2: Stop one microservice (e.g., product-service). Query { products { name } } via GraphQL — should return empty list (fallback)        
 instead of error. Check logs for [FALLBACK] messages.
 2. Feature 5: Query { products { name } } twice. Second call should be significantly faster. Check Redis with redis-cli KEYS * to verify cached   
 entries. Verify TTL expiry after 60s.
 3. Feature 3: POST http://localhost:8083/orders with a JSON body. Then check GET http://localhost:8084/payments/order/{id} — a payment record     
 should exist (created by the Kafka consumer).
 4. Feature 4: Get a token from Keycloak:
 curl -X POST http://localhost:8180/realms/quarkgate/protocol/openid-connect/token \
   -d "grant_type=password&client_id=graphql-gateway&username=testuser&password=test123"
 4. Send GraphQL requests with Authorization: Bearer <token>. Verify protected mutations reject unauthenticated requests.
 5. Full stack: docker-compose up --build and verify all services start healthy. Run existing k6 benchmarks to ensure no regression.

 All four features are implemented. Here's a summary:                                                                                                
  Feature 2: Fault Tolerance & Circuit Breakers                                                                                                    
                                                                                                                                                     - ProductResolver.java — @Timeout(5s), @Retry(max=3, delay=200ms), @CircuitBreaker, @Fallback on getAllProducts() and getProduct(id)             
  - UserResolver.java — Same pattern on getAllUsers(), getUser(id), getOrdersForUser(@Source)                                                        - OrderResolver.java — Same pattern on getAllOrders(), getOrder(id), getProductsForOrder(@Source), getPaymentForOrder(@Source)                     - All fallback methods match exact signatures (including @Source parameter for field resolvers)                                                  

  Feature 5: Redis Caching

  - Replaced quarkus-redis-client with quarkus-redis-cache in gateway pom.xml
  - Changed quarkus.cache.type=caffeine → redis with TTLs (60s for lists, 120s for single items)
  - Added @CacheResult on ProductResolver.getAllProducts/getProduct and UserResolver.getAllUsers/getUser
  - Orders and field resolvers intentionally NOT cached

  Feature 3: Kafka Event-Driven Architecture

  - Added quarkus-smallrye-reactive-messaging-kafka to order-service and payment-service
  - Added Zookeeper + Kafka services to docker-compose.yml
  - Created OrderCreatedEvent DTO, OrderEventProducer, CreateOrderRequest in order-service
  - Added POST /orders endpoint that persists and publishes events
  - Created OrderCreatedEventDeserializer and OrderEventConsumer in payment-service (auto-creates payment on event)
  - Configured dead-letter-queue failure strategy for consumer

  Feature 4: JWT Authentication (Keycloak)

  - Added quarkus-oidc to gateway pom.xml
  - Added Keycloak service (port 8180) to docker-compose with realm import
  - Created keycloak/realm-export.json with realm quarkgate, client graphql-gateway, roles user/admin, users testuser/adminuser
  - GraphQL and health endpoints are publicly accessible (no token required for reads)
  - Docker profile override for Keycloak URL

