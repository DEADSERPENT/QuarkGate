-- ══════════════════════════════════════════════════════════════
-- QuarkGate Order Service - Seed Data (Amounts in INR)
-- ══════════════════════════════════════════════════════════════

-- Akshay's orders
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (1, 1, 'DELIVERED', 4998.00, '2025-04-01T10:00:00', '1,2');
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (2, 1, 'SHIPPED', 2199.00, '2025-05-15T14:30:00', '3');
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (3, 1, 'DELIVERED', 12999.00, '2025-06-20T11:15:00', '11');

-- Priya's orders
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (4, 2, 'DELIVERED', 4798.00, '2025-06-01T09:00:00', '6,4');
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (5, 2, 'PROCESSING', 1299.00, '2025-07-10T16:20:00', '5');

-- Rahul's orders
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (6, 3, 'PENDING', 1499.00, '2025-06-10T16:45:00', '1');
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (7, 3, 'DELIVERED', 5298.00, '2025-07-22T09:30:00', '2,6');

-- Sneha's orders
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (8, 4, 'SHIPPED', 10499.00, '2025-08-05T14:00:00', '13');
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (9, 4, 'DELIVERED', 2498.00, '2025-08-18T10:45:00', '7,8');

-- Arjun's orders
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (10, 5, 'CANCELLED', 4999.00, '2025-09-01T08:30:00', '10');
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (11, 5, 'DELIVERED', 6497.00, '2025-09-15T13:00:00', '3,5,14');

-- Kavya's order
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (12, 6, 'PROCESSING', 15498.00, '2025-10-02T11:20:00', '2,11');

-- Vikram's order
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (13, 7, 'SHIPPED', 3798.00, '2025-10-18T09:00:00', '1,14');

-- Ananya's order
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (14, 8, 'PENDING', 4499.00, '2025-11-05T15:30:00', '12');

-- Rohan's order
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (15, 9, 'DELIVERED', 2298.00, '2025-11-20T10:10:00', '5,9');

-- Divya's order
INSERT INTO orders (id, userid, status, totalamount, createdat, productids) VALUES (16, 10, 'SHIPPED', 14498.00, '2025-12-01T12:00:00', '13,11');

ALTER SEQUENCE orders_seq RESTART WITH 17;
