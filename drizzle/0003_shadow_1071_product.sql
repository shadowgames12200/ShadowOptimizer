-- Migration: Add product field to licenses table for Shadow 1071 Jogos category
ALTER TABLE `licenses` ADD COLUMN `product` ENUM('shadow_optimizer','shadow_1071') NOT NULL DEFAULT 'shadow_optimizer';
