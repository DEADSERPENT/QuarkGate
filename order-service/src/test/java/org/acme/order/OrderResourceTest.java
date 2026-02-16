package org.acme.order;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@QuarkusTest
public class OrderResourceTest {

    @Test
    void testGetAllOrders() {
        given()
            .when().get("/orders")
            .then()
            .statusCode(200)
            .body("$.size()", greaterThanOrEqualTo(16))
            .body("[0].id", notNullValue())
            .body("[0].userId", notNullValue())
            .body("[0].status", notNullValue());
    }

    @Test
    void testGetOrderById() {
        given()
            .when().get("/orders/1")
            .then()
            .statusCode(200)
            .body("id", is(1))
            .body("userId", is(1))
            .body("status", is("DELIVERED"))
            .body("totalAmount", notNullValue())
            .body("productIds", notNullValue());
    }

    @Test
    void testGetOrderByIdNotFound() {
        given()
            .when().get("/orders/999")
            .then()
            .statusCode(404);
    }

    @Test
    void testGetOrdersByUserId() {
        given()
            .when().get("/orders/user/1")
            .then()
            .statusCode(200)
            .body("$.size()", is(3))
            .body("[0].userId", is(1));
    }

    @Test
    void testGetOrdersByUserIdReturnsEmpty() {
        given()
            .when().get("/orders/user/999")
            .then()
            .statusCode(200)
            .body("$.size()", is(0));
    }

    @Test
    void testOrderDtoHasProductIds() {
        given()
            .when().get("/orders/1")
            .then()
            .statusCode(200)
            .body("productIds", notNullValue())
            .body("productIds.size()", greaterThanOrEqualTo(1));
    }

    @Test
    void testCreateOrder() {
        String requestBody = """
            {
                "userId": 1,
                "totalAmount": 2999.00,
                "productIds": [1, 5]
            }
            """;

        given()
            .contentType("application/json")
            .body(requestBody)
            .when().post("/orders")
            .then()
            .statusCode(201)
            .body("userId", is(1))
            .body("totalAmount", notNullValue())
            .body("status", is("PENDING"))
            .body("productIds", hasItems(1, 5));
    }

    @Test
    void testOrderHasTimestamp() {
        given()
            .when().get("/orders/1")
            .then()
            .statusCode(200)
            .body("createdAt", notNullValue());
    }
}
