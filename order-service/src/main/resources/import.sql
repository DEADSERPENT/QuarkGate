INSERT INTO orders (id, user_id, status, total_amount, created_at, product_ids) VALUES (1, 1, 'DELIVERED', 119.98, '2025-04-01T10:00:00', '1,2');
INSERT INTO orders (id, user_id, status, total_amount, created_at, product_ids) VALUES (2, 1, 'SHIPPED', 45.99, '2025-05-15T14:30:00', '3');
INSERT INTO orders (id, user_id, status, total_amount, created_at, product_ids) VALUES (3, 2, 'PROCESSING', 94.98, '2025-06-01T09:00:00', '4,5');
INSERT INTO orders (id, user_id, status, total_amount, created_at, product_ids) VALUES (4, 3, 'PENDING', 29.99, '2025-06-10T16:45:00', '1');
ALTER SEQUENCE orders_SEQ RESTART WITH 5;
