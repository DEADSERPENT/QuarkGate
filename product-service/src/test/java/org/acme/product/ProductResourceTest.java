package org.acme.product;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@QuarkusTest
public class ProductResourceTest {

    @Test
    void testGetAllProducts() {
        given()
            .when().get("/products")
            .then()
            .statusCode(200)
            .body("$.size()", greaterThanOrEqualTo(15))
            .body("[0].name", notNullValue())
            .body("[0].price", notNullValue())
            .body("[0].category", notNullValue());
    }

    @Test
    void testGetProductById() {
        given()
            .when().get("/products/1")
            .then()
            .statusCode(200)
            .body("id", is(1))
            .body("name", is("Wireless Mouse"))
            .body("category", is("Electronics"));
    }

    @Test
    void testGetProductByIdNotFound() {
        given()
            .when().get("/products/999")
            .then()
            .statusCode(404);
    }

    @Test
    void testProductHasAllFields() {
        given()
            .when().get("/products/2")
            .then()
            .statusCode(200)
            .body("id", is(2))
            .body("name", is("Mechanical Keyboard"))
            .body("description", notNullValue())
            .body("price", notNullValue())
            .body("stockQuantity", notNullValue())
            .body("category", is("Electronics"));
    }

    @Test
    void testGetAllProductsContainsExpectedProducts() {
        given()
            .when().get("/products")
            .then()
            .statusCode(200)
            .body("name", hasItems("Wireless Mouse", "Mechanical Keyboard", "USB-C Hub", "Bluetooth Earbuds", "LED Monitor 24-inch"));
    }

    @Test
    void testMultipleCategories() {
        given()
            .when().get("/products")
            .then()
            .statusCode(200)
            .body("category", hasItems("Electronics", "Accessories", "Software", "Peripherals"));
    }
}
