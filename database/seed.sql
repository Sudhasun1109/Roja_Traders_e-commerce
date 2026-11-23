-- Seed data for WhatsApp E-Commerce Product Showcase
USE `whatsapp_ecommerce`;

-- 1. Default Admin User: username: admin / password: admin123
INSERT INTO `admins` (`id`, `username`, `mobile_number`, `password`, `role`) VALUES
(1, 'admin', '+919876543210', '$2a$10$w8bgy3VhFzGuTPHDcpVmCem3xs8q0OIAnEgOTwNgkZqV/TgDexjNm', 'admin')
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`), `mobile_number` = VALUES(`mobile_number`);

-- 2. Website Settings
INSERT INTO `website_settings` (`id`, `website_name`, `logo_url`, `whatsapp_number`, `contact_number`, `address`, `email`, `description`, `social_links`, `footer_text`) VALUES
(1, 'Roja Showcase Mart', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80', '919876543210', '+91 98765 43210', '42 MG Road, Bangalore, Karnataka - 560001, India', 'support@rojashowcase.com', 'Your premier destination for handpicked fashion, footwear, electronics and lifestyle essentials. Enquire and order easily via WhatsApp with instant customer assistance.', '{"facebook":"https://facebook.com","instagram":"https://instagram.com","twitter":"https://twitter.com"}', '© 2026 Roja Showcase Mart. All rights reserved. Built with WhatsApp Direct Commerce.')
ON DUPLICATE KEY UPDATE `website_name` = VALUES(`website_name`);

-- 3. Categories
INSERT INTO `categories` (`id`, `category_name`, `description`) VALUES
(1, 'Men\'s Fashion', 'Premium shirts, t-shirts, denim, jackets, and everyday wear for men.'),
(2, 'Footwear', 'Casual sneakers, running shoes, formal loafers, and ethnic sandals.'),
(3, 'Electronics & Gadgets', 'Smartwatches, wireless earbuds, portable power banks, and audio accessories.'),
(4, 'Watches & Accessories', 'Luxury analog timepieces, leather wallets, sunglasses, and belts.')
ON DUPLICATE KEY UPDATE `category_name` = VALUES(`category_name`);

-- 4. Products
INSERT INTO `products` (`id`, `product_name`, `description`, `price`, `discount_price`, `category_id`, `sku`, `stock_quantity`, `status`, `specifications`) VALUES
(1, 'Urban Edge Premium Oversized Tee', 'Crafted from 100% combed cotton (240 GSM) for a relaxed, streetwear look with breathable comfort and durable stitching.', 999.00, 599.00, 1, 'TSHIRT-URB-01', 35, 'active', '{"Fabric": "100% Combed Cotton", "Fit": "Oversized / Boxy", "GSM": "240 GSM Heavyweight", "Care": "Machine wash cold"}'),
(2, 'Classic Slim-Fit Oxford Casual Shirt', 'Timeless button-down collar casual shirt made with pure breathable linen blend. Suitable for office, gatherings, or weekend casuals.', 1499.00, 899.00, 1, 'SHIRT-OXF-02', 20, 'active', '{"Material": "Linen Cotton Blend", "Collar": "Button Down", "Pattern": "Solid", "Sleeve": "Full Sleeve"}'),
(3, 'AeroGlide Pro Performance Sneakers', 'Ultra-lightweight mesh upper running shoes with responsive foam cushioning and anti-slip rubber outsole.', 2499.00, 1299.00, 2, 'SHOE-AERO-01', 15, 'active', '{"Upper Material": "Breathable Flyknit Mesh", "Sole": "EVA Foam & Non-marking Rubber", "Closure": "Lace-up", "Weight": "280g"}'),
(4, 'Leather Chelsea Boots - Dark Coffee', 'Handcrafted synthetic vegan leather boots with elasticated side gussets and pull tabs for effortless styling and durability.', 3299.00, 1999.00, 2, 'BOOT-CHEL-02', 8, 'active', '{"Material": "Premium Vegan Leather", "Sole": "TPR Lugged Sole", "Toe Shape": "Round Toe", "Color": "Dark Coffee"}'),
(5, 'PulseWave ANC Wireless Earbuds', 'Active noise cancelling wireless earbuds with 36-hour playback time, Bluetooth 5.3, quad mics, and IPX5 water resistance.', 2999.00, 1499.00, 3, 'EAR-PULSE-01', 25, 'active', '{"Bluetooth": "v5.3", "Battery": "Up to 36 hours with case", "Latency": "45ms Low Latency", "Water Resistance": "IPX5"}'),
(6, 'Titanium Pro Smartwatch 1.96\" AMOLED', 'Sleek zinc alloy chassis with brilliant AMOLED always-on display, health monitoring, Bluetooth calling, and 100+ sports modes.', 4499.00, 2299.00, 3, 'WAT-SMART-02', 12, 'active', '{"Display": "1.96 inch AMOLED Always-on", "Battery": "7-10 Days", "Features": "Heart Rate, SpO2, Sleep, BT Calling", "Compatibility": "Android & iOS"}'),
(7, 'Chronograph Stainless Steel Timepiece', 'Precision quartz movement with three functioning sub-dials, date display window, scratch-resistant sapphire-coated mineral glass.', 3999.00, 1899.00, 4, 'WAT-CHRONO-01', 6, 'active', '{"Movement": "Japanese Quartz", "Glass": "Sapphire-coated Mineral Glass", "Water Resistance": "5 ATM", "Band": "316L Stainless Steel"}'),
(8, 'Handcrafted RFID Bifold Leather Wallet', 'Slim minimalist genuine leather wallet featuring built-in RFID blocking technology with 8 card slots and dual currency sleeves.', 1199.00, 649.00, 4, 'WAL-LEATH-02', 40, 'active', '{"Material": "100% Genuine Top-grain Leather", "Security": "RFID Blocking Protection", "Capacity": "8 Cards + Currency slots", "Color": "Vintage Brown"}')
ON DUPLICATE KEY UPDATE `product_name` = VALUES(`product_name`);

-- 5. Product Images
INSERT INTO `product_images` (`id`, `product_id`, `image_url`, `is_primary`) VALUES
(1, 1, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', TRUE),
(2, 1, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80', FALSE),
(3, 2, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80', TRUE),
(4, 2, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80', FALSE),
(5, 3, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80', TRUE),
(6, 3, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80', FALSE),
(7, 4, 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&auto=format&fit=crop&q=80', TRUE),
(8, 4, 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&auto=format&fit=crop&q=80', FALSE),
(9, 5, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80', TRUE),
(10, 5, 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&auto=format&fit=crop&q=80', FALSE),
(11, 6, 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80', TRUE),
(12, 6, 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80', FALSE),
(13, 7, 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80', TRUE),
(14, 7, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80', FALSE),
(15, 8, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80', TRUE),
(16, 8, 'https://images.unsplash.com/photo-1606503825008-909a67e63c0a?w=800&auto=format&fit=crop&q=80', FALSE)
ON DUPLICATE KEY UPDATE `image_url` = VALUES(`image_url`);

-- 6. Initial Stock History
INSERT INTO `stock_history` (`product_id`, `previous_stock`, `updated_stock`, `change_type`, `notes`, `updated_by`) VALUES
(1, 0, 35, 'initial', 'Initial inventory batch intake', 'admin'),
(2, 0, 20, 'initial', 'Initial inventory batch intake', 'admin'),
(3, 0, 15, 'initial', 'Initial inventory batch intake', 'admin'),
(4, 0, 8, 'initial', 'Initial inventory batch intake', 'admin'),
(5, 0, 25, 'initial', 'Initial inventory batch intake', 'admin'),
(6, 0, 12, 'initial', 'Initial inventory batch intake', 'admin'),
(7, 0, 6, 'initial', 'Initial inventory batch intake', 'admin'),
(8, 0, 40, 'initial', 'Initial inventory batch intake', 'admin');

-- 7. Sample Verified User
INSERT INTO `users` (`id`, `name`, `mobile_number`, `is_verified`, `status`) VALUES
(1, 'Sudhasun', '+919876543210', TRUE, 'active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
