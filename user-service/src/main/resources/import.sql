-- ══════════════════════════════════════════════════════════════
-- QuarkGate User Service - Seed Data
-- ══════════════════════════════════════════════════════════════

INSERT INTO users (id, username, email, fullname, createdat) VALUES (1, 'akshay', 'akshay.kumar@gmail.com', 'Akshay Kumar', '2025-01-15T10:30:00');
INSERT INTO users (id, username, email, fullname, createdat) VALUES (2, 'priya', 'priya.sharma@outlook.com', 'Priya Sharma', '2025-02-20T14:00:00');
INSERT INTO users (id, username, email, fullname, createdat) VALUES (3, 'rahul', 'rahul.singh@yahoo.com', 'Rahul Singh', '2025-03-10T09:15:00');
INSERT INTO users (id, username, email, fullname, createdat) VALUES (4, 'sneha', 'sneha.patel@gmail.com', 'Sneha Patel', '2025-03-22T11:45:00');
INSERT INTO users (id, username, email, fullname, createdat) VALUES (5, 'arjun', 'arjun.reddy@hotmail.com', 'Arjun Reddy', '2025-04-05T08:20:00');
INSERT INTO users (id, username, email, fullname, createdat) VALUES (6, 'kavya', 'kavya.nair@gmail.com', 'Kavya Nair', '2025-04-18T16:30:00');
INSERT INTO users (id, username, email, fullname, createdat) VALUES (7, 'vikram', 'vikram.mehta@icloud.com', 'Vikram Mehta', '2025-05-02T13:00:00');
INSERT INTO users (id, username, email, fullname, createdat) VALUES (8, 'ananya', 'ananya.iyer@gmail.com', 'Ananya Iyer', '2025-05-15T10:10:00');
INSERT INTO users (id, username, email, fullname, createdat) VALUES (9, 'rohan', 'rohan.gupta@proton.me', 'Rohan Gupta', '2025-06-01T09:45:00');
INSERT INTO users (id, username, email, fullname, createdat) VALUES (10, 'divya', 'divya.joshi@gmail.com', 'Divya Joshi', '2025-06-12T15:20:00');

ALTER SEQUENCE users_seq RESTART WITH 11;
