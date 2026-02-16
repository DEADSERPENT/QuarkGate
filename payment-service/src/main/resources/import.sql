-- ══════════════════════════════════════════════════════════════
-- QuarkGate Payment Service - Seed Data (Amounts in INR)
-- Indian payment methods: UPI, CREDIT_CARD, DEBIT_CARD, NET_BANKING, WALLET
-- ══════════════════════════════════════════════════════════════

INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (1, 1, 4998.00, 'CREDIT_CARD', 'SUCCESS', '2025-04-01T10:05:00');
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (2, 2, 2199.00, 'UPI', 'SUCCESS', '2025-05-15T14:35:00');
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (3, 3, 12999.00, 'NET_BANKING', 'SUCCESS', '2025-06-20T11:20:00');
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (4, 4, 4798.00, 'UPI', 'SUCCESS', '2025-06-01T09:05:00');
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (5, 5, 1299.00, 'WALLET', 'PENDING', NULL);
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (6, 6, 1499.00, 'UPI', 'PENDING', NULL);
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (7, 7, 5298.00, 'DEBIT_CARD', 'SUCCESS', '2025-07-22T09:35:00');
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (8, 8, 10499.00, 'CREDIT_CARD', 'SUCCESS', '2025-08-05T14:10:00');
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (9, 9, 2498.00, 'UPI', 'SUCCESS', '2025-08-18T10:50:00');
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (10, 10, 4999.00, 'WALLET', 'FAILED', '2025-09-01T08:35:00');
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (11, 11, 6497.00, 'NET_BANKING', 'SUCCESS', '2025-09-15T13:05:00');
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (12, 12, 15498.00, 'CREDIT_CARD', 'PENDING', NULL);
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (13, 13, 3798.00, 'UPI', 'SUCCESS', '2025-10-18T09:05:00');
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (14, 14, 4499.00, 'DEBIT_CARD', 'PENDING', NULL);
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (15, 15, 2298.00, 'UPI', 'SUCCESS', '2025-11-20T10:15:00');
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (16, 16, 14498.00, 'NET_BANKING', 'SUCCESS', '2025-12-01T12:10:00');

ALTER SEQUENCE payments_seq RESTART WITH 17;
