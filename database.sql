-- =======================================================
-- DATABASE SCHEMA: QUẢN LÝ QUỸ (MYSQL / LARAGON)
-- Quy tắc: 10.000đ / tuần (40.000đ / tháng 4 tuần)
-- =======================================================

CREATE DATABASE IF NOT EXISTS quanlyquy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quanlyquy;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS fund_contributions;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS members;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. BẢNG THÀNH VIÊN (10 THÀNH VIÊN MẪU)
CREATE TABLE members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) DEFAULT '',
    bank_id VARCHAR(50) DEFAULT 'MBBank',
    bank_account_no VARCHAR(50) DEFAULT '',
    bank_account_name VARCHAR(100) DEFAULT '',
    avatar_url TEXT,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG CÀI ĐẶT HỆ THỐNG
CREATE TABLE settings (
    `key` VARCHAR(50) PRIMARY KEY,
    `value` TEXT NOT NULL
);

-- 3. BẢNG THEO DÕI ĐÓNG QUỸ THEO TUẦN (4 TUẦN / THÁNG)
CREATE TABLE fund_contributions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    week INT NOT NULL, -- 1, 2, 3, 4
    amount DECIMAL(15,2) DEFAULT 10000,
    is_paid TINYINT(1) DEFAULT 0,
    paid_at DATETIME NULL,
    note VARCHAR(255) NULL,
    UNIQUE KEY uq_member_week (member_id, year, month, week),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 4. BẢNG GIAO DỊCH THU / CHI
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('income', 'expense') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    member_id INT NULL,
    member_name VARCHAR(100) NULL,
    description TEXT,
    receipt_url TEXT,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================
-- DỮ LIỆU MẪU SẠCH SẴN SÀNG TRIỂN KHAI (CLEAN SEED DATA)
-- =======================================================

-- Cài đặt mặc định của Thủ Quỹ (Thông tin để trống để Thủ Quỹ tự điền trên web)
INSERT INTO settings (`key`, `value`) VALUES 
('admin_pin', '888888'),
('group_password', '123456'),
('bank_id', 'MBBank'),
('bank_account_no', ''),
('bank_account_name', 'THU QUY'),
('weekly_amount', '10000'),
('monthly_amount', '40000'),
('qr_template', 'compact2'),
('custom_qr_url', '');

-- 10 thành viên mẫu (Thủ quỹ có thể đổi tên và STK trực tiếp trên web)
INSERT INTO members (id, name, phone, bank_id, bank_account_no, bank_account_name) VALUES 
(1, 'Thành viên 1', '', 'MBBank', '', ''),
(2, 'Thành viên 2', '', 'Vietcombank', '', ''),
(3, 'Thành viên 3', '', 'Techcombank', '', ''),
(4, 'Thành viên 4', '', 'ACB', '', ''),
(5, 'Thành viên 5', '', 'BIDV', '', ''),
(6, 'Thành viên 6', '', 'TPBank', '', ''),
(7, 'Thành viên 7', '', 'VPBank', '', ''),
(8, 'Thành viên 8', '', 'VietinBank', '', ''),
(9, 'Thành viên 9', '', 'MBBank', '', ''),
(10, 'Thành viên 10', '', 'Sacombank', '', '');
