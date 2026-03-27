-- ============================================
-- Predictive Public Complaint Intelligence
-- and Hotspot Detection System
-- Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS complaint_system;
USE complaint_system;

-- ============================================
-- AREA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS area (
    area_id INT AUTO_INCREMENT PRIMARY KEY,
    area_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE INDEX idx_area_name ON area(area_name);

-- ============================================
-- DEPARTMENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS department (
    dept_id INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ============================================
-- CITIZEN TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS citizen (
    citizen_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    area VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- ADMIN TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- DEPARTMENT OFFICER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dept_officer (
    officer_id INT AUTO_INCREMENT PRIMARY KEY,
    dept_id INT NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dept_id) REFERENCES department(dept_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- COMPLAINT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS complaint (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id INT NOT NULL,
    area_id INT NOT NULL,
    dept_id INT DEFAULT NULL,
    category ENUM('Road','Water','Garbage','Light','Drainage','Other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('Pending','In Progress','Resolved','Escalated') DEFAULT 'Pending',
    priority ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_date DATETIME DEFAULT NULL,
    FOREIGN KEY (citizen_id) REFERENCES citizen(citizen_id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES area(area_id) ON DELETE CASCADE,
    FOREIGN KEY (dept_id) REFERENCES department(dept_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_complaint_area ON complaint(area_id);
CREATE INDEX idx_complaint_category ON complaint(category);
CREATE INDEX idx_complaint_status ON complaint(status);
CREATE INDEX idx_complaint_date ON complaint(date);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    action_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaint(complaint_id) ON DELETE CASCADE
) ENGINE=InnoDB;
