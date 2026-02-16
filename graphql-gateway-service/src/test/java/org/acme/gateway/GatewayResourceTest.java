package org.acme.gateway;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;

@QuarkusTest
public class GatewayResourceTest {

    private static final String GRAPHQL_ENDPOINT = "/graphql";

    private io.restassured.response.ValidatableResponse graphqlQuery(String query) {
        String body = String.format("{\"query\": \"%s\"}", query.replace("\"", "\\\"").replace("\n", " "));
        return given()
                .contentType("application/json")
                .body(body)
                .when()
                .post(GRAPHQL_ENDPOINT)
                .then();
    }

    @Test
    void testGraphQLEndpointIsAvailable() {
        graphqlQuery("{ __schema { types { name } } }")
                .statusCode(200)
                .body(containsString("__schema"));
    }

    @Test
    void testIntrospectionReturnsQueryType() {
        graphqlQuery("{ __schema { queryType { name } } }")
                .statusCode(200)
                .body(containsString("Query"));
    }

    @Test
    void testQueryUsersSchema() {
        graphqlQuery("{ __type(name: \\\"User\\\") { fields { name } } }")
                .statusCode(200)
                .body(containsString("username"))
                .body(containsString("email"));
    }

    @Test
    void testQueryProductsSchema() {
        graphqlQuery("{ __type(name: \\\"Product\\\") { fields { name } } }")
                .statusCode(200)
                .body(containsString("name"))
                .body(containsString("price"));
    }

    @Test
    void testQueryOrdersSchema() {
        graphqlQuery("{ __type(name: \\\"Order\\\") { fields { name } } }")
                .statusCode(200)
                .body(containsString("status"))
                .body(containsString("totalAmount"));
    }

    @Test
    void testHealthEndpoint() {
        given()
                .when().get("/q/health")
                .then()
                .statusCode(200)
                .body(containsString("UP"));
    }

    @Test
    void testMetricsEndpoint() {
        given()
                .when().get("/q/metrics")
                .then()
                .statusCode(200);
    }

    @Test
    void testInvalidQueryReturnsError() {
        graphqlQuery("{ invalidField }")
                .statusCode(200)
                .body(containsString("errors"));
    }
}
