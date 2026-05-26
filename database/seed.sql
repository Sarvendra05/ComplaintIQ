-- ============================================
-- Seed Data (Production)
-- ============================================

-- ============================================
-- DEPARTMENTS
-- ============================================
INSERT INTO department (dept_name) VALUES
('Road & Infrastructure'),
('Water Supply'),
('Garbage & Sanitation'),
('Electricity & Streetlights'),
('Drainage & Sewage'),
('General Administration');

-- ============================================
-- ADMIN (password: admin@123)
-- ============================================
INSERT INTO admin (username, password) VALUES
('admin', '$2a$10$QcyKDXb.Xh2tE2h7maC2xeX32OBEBc4nOjAtsPc5QIcoq9jFON64C');

-- ============================================
-- DEPARTMENT OFFICERS (password: officer@123)
-- ============================================
INSERT INTO dept_officer (dept_id, username, name, password) VALUES
(1, 'road_officer', 'Rajesh Kumar', '$2a$10$m0irirPyuoQrU02G0HhFIeCE0SZYMIim07EHmUx/c68ztRoqH1ZM6'),
(2, 'water_officer', 'Priya Sharma', '$2a$10$m0irirPyuoQrU02G0HhFIeCE0SZYMIim07EHmUx/c68ztRoqH1ZM6'),
(3, 'garbage_officer', 'Amit Patel', '$2a$10$m0irirPyuoQrU02G0HhFIeCE0SZYMIim07EHmUx/c68ztRoqH1ZM6'),
(4, 'light_officer', 'Sunita Verma', '$2a$10$m0irirPyuoQrU02G0HhFIeCE0SZYMIim07EHmUx/c68ztRoqH1ZM6'),
(5, 'drain_officer', 'Vikram Singh', '$2a$10$m0irirPyuoQrU02G0HhFIeCE0SZYMIim07EHmUx/c68ztRoqH1ZM6'),
(6, 'general_officer', 'Neha Gupta', '$2a$10$m0irirPyuoQrU02G0HhFIeCE0SZYMIim07EHmUx/c68ztRoqH1ZM6');

-- No demo citizens — all citizens register via the website.
