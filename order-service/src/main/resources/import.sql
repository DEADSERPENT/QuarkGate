INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (1, 1, 'DELIVERED', 119.98, '2025-04-01T10:00:00', '1,2');
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (2, 1, 'SHIPPED', 45.99, '2025-05-15T14:30:00', '3');
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (3, 2, 'PROCESSING', 94.98, '2025-06-01T09:00:00', '4,5');
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (4, 3, 'PENDING', 29.99, '2025-06-10T16:45:00', '1');
ALTER SEQUENCE orders_seq RESTART WITH 5;
