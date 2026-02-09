package org.acme.gateway;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.containsString;

@QuarkusTest
public class GatewayResourceTest {

    @Test
    void testGraphQLEndpointIsAvailable() {
        given()
                .contentType("application/json")
                .body("{\"query\": \"{ __schema { types { name } } }\"}")
                .when()
                .post("/graphql")
                .then()
                .statusCode(200)
                .body(containsString("__schema"));
    }
}
