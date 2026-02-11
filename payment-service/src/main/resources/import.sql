INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (1, 1, 119.98, 'CREDIT_CARD', 'SUCCESS', '2025-04-01T10:05:00');
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (2, 2, 45.99, 'UPI', 'SUCCESS', '2025-05-15T14:35:00');
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (3, 3, 94.98, 'NET_BANKING', 'PENDING', NULL);
INSERT INTO payments (id, orderid, amount, method, status, processedat) VALUES (4, 4, 29.99, 'UPI', 'PENDING', NULL);
ALTER SEQUENCE payments_seq RESTART WITH 5;
