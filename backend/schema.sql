-- schema.sql
-- Creates SRMS schema based on the queries used in setup_db.js and server.js

CREATE DATABASE IF NOT EXISTS `SRMS`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `SRMS`;

-- ============================
-- Users
-- ============================
CREATE TABLE IF NOT EXISTS `users` (
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`username`)
) ENGINE=InnoDB;

-- ============================
-- Items (Stock)
-- ============================
CREATE TABLE IF NOT EXISTS `items` (
  `item_id` INT NOT NULL AUTO_INCREMENT,
  `itemname` VARCHAR(100) NOT NULL,
  `specification` TEXT,
  `unitmeasure` VARCHAR(50) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `unitprice` DECIMAL(12,2) NOT NULL,
  `totalquantity` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`item_id`),
  UNIQUE KEY `uk_items_itemname` (`itemname`)
) ENGINE=InnoDB;

-- ============================
-- Sales header
-- ============================
CREATE TABLE IF NOT EXISTS `sales` (
  `sale_id` INT NOT NULL AUTO_INCREMENT,
  `saledate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `customername` VARCHAR(150) NOT NULL,
  `totalprice` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `username` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`sale_id`),
  CONSTRAINT `fk_sales_username`
    FOREIGN KEY (`username`) REFERENCES `users`(`username`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================
-- Sale detail lines
-- ============================
CREATE TABLE IF NOT EXISTS `saledetail` (
  `saledetail_id` INT NOT NULL AUTO_INCREMENT,
  `sale_id` INT NOT NULL,
  `item_id` INT NOT NULL,
  `quantitysold` INT NOT NULL,
  `subtotalprice` DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (`saledetail_id`),
  CONSTRAINT `fk_saledetail_sale_id`
    FOREIGN KEY (`sale_id`) REFERENCES `sales`(`sale_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_saledetail_item_id`
    FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

