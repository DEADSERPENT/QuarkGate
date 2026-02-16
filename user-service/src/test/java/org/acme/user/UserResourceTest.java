package org.acme.user;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@QuarkusTest
public class UserResourceTest {

    @Test
    void testGetAllUsers() {
        given()
            .when().get("/users")
            .then()
            .statusCode(200)
            .body("$.size()", greaterThanOrEqualTo(10))
            .body("[0].username", notNullValue())
            .body("[0].email", notNullValue())
            .body("[0].fullName", notNullValue());
    }

    @Test
    void testGetUserById() {
        given()
            .when().get("/users/1")
            .then()
            .statusCode(200)
            .body("id", is(1))
            .body("username", is("akshay"))
            .body("email", is("akshay.kumar@gmail.com"))
            .body("fullName", is("Akshay Kumar"));
    }

    @Test
    void testGetUserByIdNotFound() {
        given()
            .when().get("/users/999")
            .then()
            .statusCode(404);
    }

    @Test
    void testGetUserByIdReturnsAllFields() {
        given()
            .when().get("/users/4")
            .then()
            .statusCode(200)
            .body("id", is(4))
            .body("username", is("sneha"))
            .body("email", is("sneha.patel@gmail.com"))
            .body("fullName", is("Sneha Patel"))
            .body("createdAt", notNullValue());
    }

    @Test
    void testGetAllUsersContainsExpectedUsers() {
        given()
            .when().get("/users")
            .then()
            .statusCode(200)
            .body("username", hasItems("akshay", "priya", "rahul", "sneha", "arjun", "kavya", "vikram", "ananya", "rohan", "divya"));
    }
}
