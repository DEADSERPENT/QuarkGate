package org.acme.payment;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;

@QuarkusTest
public class PaymentResourceTest {

    @Test
    void testGetPaymentByOrderId() {
        given()
            .when().get("/payments/order/1")
            .then()
            .statusCode(200)
            .body("orderId", is(1))
            .body("amount", notNullValue())
            .body("method", notNullValue())
            .body("status", notNullValue());
    }

    @Test
    void testGetPaymentByOrderIdNotFound() {
        given()
            .when().get("/payments/order/999")
            .then()
            .statusCode(404);
    }

    @Test
    void testPaymentHasAllFields() {
        given()
            .when().get("/payments/order/1")
            .then()
            .statusCode(200)
            .body("id", notNullValue())
            .body("orderId", is(1))
            .body("amount", notNullValue())
            .body("method", is("CREDIT_CARD"))
            .body("status", is("SUCCESS"))
            .body("processedAt", notNullValue());
    }

    @Test
    void testUpiPayment() {
        given()
            .when().get("/payments/order/2")
            .then()
            .statusCode(200)
            .body("orderId", is(2))
            .body("method", is("UPI"))
            .body("status", is("SUCCESS"));
    }

    @Test
    void testPendingPayment() {
        given()
            .when().get("/payments/order/5")
            .then()
            .statusCode(200)
            .body("orderId", is(5))
            .body("method", is("WALLET"))
            .body("status", is("PENDING"));
    }

    @Test
    void testFailedPayment() {
        given()
            .when().get("/payments/order/10")
            .then()
            .statusCode(200)
            .body("orderId", is(10))
            .body("status", is("FAILED"));
    }

    @Test
    void testDebitCardPayment() {
        given()
            .when().get("/payments/order/7")
            .then()
            .statusCode(200)
            .body("method", is("DEBIT_CARD"))
            .body("status", is("SUCCESS"));
    }

    @Test
    void testNetBankingPayment() {
        given()
            .when().get("/payments/order/3")
            .then()
            .statusCode(200)
            .body("method", is("NET_BANKING"))
            .body("status", is("SUCCESS"));
    }
}
