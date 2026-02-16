-- ══════════════════════════════════════════════════════════════
-- QuarkGate Product Service - Seed Data (Prices in INR)
-- ══════════════════════════════════════════════════════════════

-- Electronics
INSERT INTO products (id, name, description, price, stockquantity, category) VALUES (1, 'Wireless Mouse', 'Logitech ergonomic wireless mouse with nano USB receiver and 18-month battery life', 1499.00, 150, 'Electronics');
INSERT INTO products (id, name, description, price, stockquantity, category) VALUES (2, 'Mechanical Keyboard', 'Cosmic Byte CB-GK-16 RGB mechanical keyboard with Outemu Blue switches and N-key rollover', 3499.00, 75, 'Electronics');
INSERT INTO products (id, name, description, price, stockquantity, category) VALUES (3, 'USB-C Hub', 'Portronics Mport 7C — 7-in-1 USB-C hub with 4K HDMI, SD card reader, and 100W PD charging', 2199.00, 200, 'Electronics');
INSERT INTO products (id, name, description, price, stockquantity, category) VALUES (4, 'Webcam HD 1080p', 'Zebronics Zeb-Ultimate Pro webcam with full HD 1080p, built-in mic, and auto-focus', 2999.00, 90, 'Electronics');
INSERT INTO products (id, name, description, price, stockquantity, category) VALUES (5, 'Bluetooth Earbuds', 'boAt Airdopes 141 TWS earbuds with 42-hour playback, ENx noise cancellation, and IPX4', 1299.00, 300, 'Electronics');

-- Accessories
INSERT INTO products (id, name, description, price, stockquantity, category) VALUES (6, 'Monitor Stand', 'AmazonBasics adjustable aluminum monitor riser with ventilated metal mesh platform', 1799.00, 120, 'Accessories');
INSERT INTO products (id, name, description, price, stockquantity, category) VALUES (7, 'Laptop Bag', 'Wildcraft premium 15.6-inch laptop backpack with rain cover, anti-theft pocket, and USB port', 1599.00, 180, 'Accessories');
INSERT INTO products (id, name, description, price, stockquantity, category) VALUES (8, 'Desk Organizer', 'Cello Polyset modular wooden desk organizer with 5 compartments and phone stand', 899.00, 250, 'Accessories');
INSERT INTO products (id, name, description, price, stockquantity, category) VALUES (9, 'Mouse Pad XL', 'Redgear MP80 extended gaming mouse pad (800x300mm) with anti-slip rubber base', 499.00, 400, 'Accessories');

-- Software & Books
INSERT INTO products (id, name, description, price, stockquantity, category) VALUES (10, 'Java Masterclass', 'Complete Java Programming Masterclass by Tim Buchalka — Udemy course activation code', 4999.00, 50, 'Software');
INSERT INTO products (id, name, description, price, stockquantity, category) VALUES (11, 'IntelliJ IDEA License', 'JetBrains IntelliJ IDEA Ultimate — 1-year personal subscription for Java/Kotlin development', 12999.00, 30, 'Software');
INSERT INTO products (id, name, description, price, stockquantity, category) VALUES (12, 'Cloud Credits Pack', 'AWS/GCP cloud credits starter pack (worth 5000 credits) for student projects', 4499.00, 100, 'Software');

-- Peripherals
INSERT INTO products (id, name, description, price, stockquantity, category) VALUES (13, 'LED Monitor 24-inch', 'LG 24MP400 — 24-inch Full HD IPS monitor with AMD FreeSync, 75Hz, and HDMI', 10499.00, 40, 'Peripherals');
INSERT INTO products (id, name, description, price, stockquantity, category) VALUES (14, 'Mechanical Numpad', 'Epomaker TH21 wireless mechanical numpad with hot-swappable switches and RGB', 2799.00, 60, 'Peripherals');
INSERT INTO products (id, name, description, price, stockquantity, category) VALUES (15, 'Webcam Light Ring', 'Digitek DRL-18H 18-inch LED ring light with tripod stand for video calls and streaming', 1999.00, 85, 'Peripherals');

ALTER SEQUENCE products_seq RESTART WITH 16;
