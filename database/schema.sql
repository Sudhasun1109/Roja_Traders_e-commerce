-- WhatsApp E-Commerce Product Showcase Database Schema
-- Database Name: whatsapp_ecommerce

CREATE DATABASE IF NOT EXISTS `whatsapp_ecommerce` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `whatsapp_ecommerce`;

-- 1. Users Table (Customer & Admin mobile authentication)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) DEFAULT 'Customer',
  `mobile_number` VARCHAR(20) NOT NULL UNIQUE,
  `role` VARCHAR(20) NOT NULL DEFAULT 'customer',
  `password` VARCHAR(255) DEFAULT NULL,
  `is_verified` BOOLEAN DEFAULT FALSE,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_mobile` (`mobile_number`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB;

-- 2. Admins Table
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `mobile_number` VARCHAR(20) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) DEFAULT 'admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_admins_mobile` (`mobile_number`)
) ENGINE=InnoDB;

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_category_name` (`category_name`)
) ENGINE=InnoDB;

-- 4. Products Table
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10,2) NOT NULL,
  `discount_price` DECIMAL(10,2) DEFAULT NULL,
  `category_id` INT NOT NULL,
  `sku` VARCHAR(50) NOT NULL UNIQUE,
  `stock_quantity` INT NOT NULL DEFAULT 0,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `specifications` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  INDEX `idx_product_status` (`status`),
  INDEX `idx_product_price` (`price`),
  INDEX `idx_product_stock` (`stock_quantity`)
) ENGINE=InnoDB;

-- 5. Product Images Table
CREATE TABLE IF NOT EXISTS `product_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `is_primary` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  INDEX `idx_product_images_pid` (`product_id`)
) ENGINE=InnoDB;

-- 6. Stock History Table
CREATE TABLE IF NOT EXISTS `stock_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `previous_stock` INT NOT NULL,
  `updated_stock` INT NOT NULL,
  `change_type` ENUM('increase', 'decrease', 'set', 'initial') NOT NULL,
  `notes` VARCHAR(255) DEFAULT NULL,
  `updated_by` VARCHAR(50) DEFAULT 'admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_stock_history_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  INDEX `idx_stock_history_pid` (`product_id`)
) ENGINE=InnoDB;

-- 7. Website Settings Table
CREATE TABLE IF NOT EXISTS `website_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `website_name` VARCHAR(150) NOT NULL DEFAULT 'ShowcaseKart',
  `logo_url` VARCHAR(500) DEFAULT NULL,
  `whatsapp_number` VARCHAR(20) NOT NULL DEFAULT '919876543210',
  `contact_number` VARCHAR(20) DEFAULT '+91 98765 43210',
  `address` VARCHAR(500) DEFAULT '100 Commerce Boulevard, Metro City, India',
  `email` VARCHAR(100) DEFAULT 'contact@showcasekart.com',
  `description` TEXT,
  `social_links` JSON DEFAULT NULL,
  `footer_text` VARCHAR(500) DEFAULT 'All rights reserved.',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 8. Enquiries Table
CREATE TABLE IF NOT EXISTS `enquiries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `customer_name` VARCHAR(100) NOT NULL,
  `customer_mobile` VARCHAR(20) NOT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `total_quantity` INT NOT NULL,
  `enquiry_status` ENUM('pending', 'contacted', 'completed', 'cancelled') DEFAULT 'pending',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_enquiries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_enquiries_user` (`user_id`),
  INDEX `idx_enquiries_status` (`enquiry_status`)
) ENGINE=InnoDB;

-- 9. Enquiry Items Table
CREATE TABLE IF NOT EXISTS `enquiry_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `enquiry_id` INT NOT NULL,
  `product_id` INT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `quantity` INT NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  CONSTRAINT `fk_enquiry_items_enquiry` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_enquiry_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  INDEX `idx_enquiry_items_enquiry` (`enquiry_id`)
) ENGINE=InnoDB;

-- 10. OTP Verifications Table
CREATE TABLE IF NOT EXISTS `otp_verifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `mobile_number` VARCHAR(20) NOT NULL,
  `otp_hash` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `verified` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_otp_mobile` (`mobile_number`),
  INDEX `idx_otp_expires` (`expires_at`)
) ENGINE=InnoDB;
