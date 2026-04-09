-- ============================================
-- Sample / Seed Data
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
-- AREAS
-- ============================================
INSERT INTO area (area_name) VALUES
('Zone A - Central Market'),
('Zone B - Railway Station'),
('Zone C - Industrial Area'),
('Zone D - Residential North'),
('Zone E - Residential South'),
('Zone F - University Campus'),
('Zone G - Hospital Road'),
('Zone H - Bus Stand'),
('Zone I - Old Town'),
('Zone J - New Colony'),
('Zone K - IT Park'),
('Zone L - Lake Area');

-- ============================================
-- ADMIN (password: admin123)
-- ============================================
INSERT INTO admin (username, password) VALUES
('admin', '$2a$10$7n96pByqFKBfH1Y1sH.1aOn3YMz9oJIWnmlBNERTxQ2lkGtb7sOpS');

-- ============================================
-- DEPARTMENT OFFICERS (password: officer123)
-- ============================================
INSERT INTO dept_officer (dept_id, username, name, password) VALUES
(1, 'road_officer', 'Rajesh Kumar', '$2a$10$HmyTKwltGS9rCS8v93P53.WhY2T5f/QGjUJovQjQI14CmTX1smDHm'),
(2, 'water_officer', 'Priya Sharma', '$2a$10$HmyTKwltGS9rCS8v93P53.WhY2T5f/QGjUJovQjQI14CmTX1smDHm'),
(3, 'garbage_officer', 'Amit Patel', '$2a$10$HmyTKwltGS9rCS8v93P53.WhY2T5f/QGjUJovQjQI14CmTX1smDHm'),
(4, 'light_officer', 'Sunita Verma', '$2a$10$HmyTKwltGS9rCS8v93P53.WhY2T5f/QGjUJovQjQI14CmTX1smDHm'),
(5, 'drain_officer', 'Vikram Singh', '$2a$10$HmyTKwltGS9rCS8v93P53.WhY2T5f/QGjUJovQjQI14CmTX1smDHm'),
(6, 'general_officer', 'Neha Gupta', '$2a$10$HmyTKwltGS9rCS8v93P53.WhY2T5f/QGjUJovQjQI14CmTX1smDHm');

-- ============================================
-- SAMPLE CITIZENS (password: citizen123)
-- ============================================
INSERT INTO citizen (name, email, phone, area, password) VALUES
('Aarav Mehta', 'aarav@example.com', '9876543210', 'Zone A - Central Market', '$2a$10$sgEtOOn0he.XXvitB.ZWq.FFg0PHsjhy2smH.HbWVlUJtbO0Cl9.6'),
('Diya Reddy', 'diya@example.com', '9876543211', 'Zone D - Residential North', '$2a$10$sgEtOOn0he.XXvitB.ZWq.FFg0PHsjhy2smH.HbWVlUJtbO0Cl9.6'),
('Rohan Joshi', 'rohan@example.com', '9876543212', 'Zone B - Railway Station', '$2a$10$sgEtOOn0he.XXvitB.ZWq.FFg0PHsjhy2smH.HbWVlUJtbO0Cl9.6'),
('Meera Nair', 'meera@example.com', '9876543213', 'Zone F - University Campus', '$2a$10$sgEtOOn0he.XXvitB.ZWq.FFg0PHsjhy2smH.HbWVlUJtbO0Cl9.6'),
('Karan Desai', 'karan@example.com', '9876543214', 'Zone I - Old Town', '$2a$10$sgEtOOn0he.XXvitB.ZWq.FFg0PHsjhy2smH.HbWVlUJtbO0Cl9.6');

-- ============================================
-- SAMPLE COMPLAINTS
-- ============================================
INSERT INTO complaint (citizen_id, area_id, dept_id, category, title, description, status, priority, date, resolved_date) VALUES
-- Resolved complaints
(1, 1, 1, 'Road', 'Large pothole near market', 'There is a dangerous pothole near the central market entrance causing accidents.', 'Resolved', 'High', '2026-01-05 09:30:00', '2026-01-07 14:00:00'),
(2, 4, 2, 'Water', 'No water supply since morning', 'Our entire block has no water supply since 6 AM today.', 'Resolved', 'Critical', '2026-01-10 06:15:00', '2026-01-10 18:00:00'),
(3, 2, 3, 'Garbage', 'Garbage dump overflowing', 'The garbage collection point near railway station is overflowing for 3 days.', 'Resolved', 'High', '2026-01-15 08:00:00', '2026-01-17 10:00:00'),

-- In Progress complaints
(4, 6, 4, 'Light', 'Streetlights not working', 'All streetlights on University Road are not working since a week.', 'In Progress', 'High', '2026-02-01 20:00:00', NULL),
(1, 1, 5, 'Drainage', 'Blocked drainage near market', 'The main drainage near market is completely blocked causing waterlogging.', 'In Progress', 'Critical', '2026-02-10 07:00:00', NULL),
(5, 9, 1, 'Road', 'Road completely damaged', 'The entire road in Old Town sector 3 is broken and unusable.', 'In Progress', 'High', '2026-02-15 11:00:00', NULL),

-- Pending complaints
(2, 4, NULL, 'Water', 'Low water pressure', 'Water pressure is very low in residential north area.', 'Pending', 'Medium', '2026-03-01 10:00:00', NULL),
(3, 2, NULL, 'Garbage', 'No garbage collection', 'Garbage has not been collected for 5 days in our area.', 'Pending', 'High', '2026-03-05 09:00:00', NULL),
(4, 6, NULL, 'Light', 'Park lights broken', 'All lights in University Park are broken.', 'Pending', 'Low', '2026-03-08 18:30:00', NULL),
(1, 1, NULL, 'Road', 'Speed breaker damaged', 'Speed breaker near central market school is completely damaged.', 'Pending', 'Medium', '2026-03-10 08:00:00', NULL),
(5, 9, NULL, 'Drainage', 'Sewer overflow in Old Town', 'Sewer is overflowing in Old Town residential area causing health issues.', 'Pending', 'Critical', '2026-03-12 06:00:00', NULL),
(2, 5, NULL, 'Other', 'Stray dog menace', 'Large number of stray dogs in residential south creating safety issues.', 'Pending', 'Medium', '2026-03-13 15:00:00', NULL),

-- Escalated complaints
(3, 2, 3, 'Garbage', 'Burning garbage in open', 'People are burning garbage in open near railway station causing pollution.', 'Escalated', 'Critical', '2026-02-20 07:30:00', NULL),
(5, 9, 1, 'Road', 'Dangerous open manhole', 'There is an open manhole on the main road in Old Town without any warning signs.', 'Escalated', 'Critical', '2026-02-22 10:00:00', NULL),
(1, 3, 2, 'Water', 'Factory waste in water', 'Industrial area factories are releasing waste into the water supply pipeline.', 'Escalated', 'Critical', '2026-02-25 13:00:00', NULL),

-- More complaints for hotspot data
(4, 1, NULL, 'Road', 'Footpath broken', 'The footpath near central market is completely broken.', 'Pending', 'Low', '2026-03-14 09:00:00', NULL),
(1, 1, 3, 'Garbage', 'Garbage scattered near market', 'Garbage bins are overflowing and waste is scattered everywhere.', 'Pending', 'Medium', '2026-03-15 07:30:00', NULL),
(2, 9, NULL, 'Drainage', 'Waterlogging in Old Town', 'Heavy waterlogging after rain due to blocked drains.', 'Pending', 'High', '2026-03-16 08:00:00', NULL),
(3, 2, NULL, 'Light', 'Traffic signal not working', 'The traffic signal near railway station junction is not working.', 'Pending', 'Critical', '2026-03-17 16:00:00', NULL),
(5, 9, NULL, 'Road', 'Potholes everywhere in Old Town', 'Multiple potholes on all roads in Old Town area.', 'Pending', 'High', '2026-03-18 10:30:00', NULL);

-- ============================================
-- SAMPLE AUDIT LOGS
-- ============================================
INSERT INTO audit_log (complaint_id, action, action_date) VALUES
(1, 'Complaint created', '2026-01-05 09:30:00'),
(1, 'Assigned to department ID: 1', '2026-01-05 10:00:00'),
(1, 'Status changed from Pending to In Progress', '2026-01-06 09:00:00'),
(1, 'Status changed from In Progress to Resolved', '2026-01-07 14:00:00'),
(2, 'Complaint created', '2026-01-10 06:15:00'),
(2, 'Status changed from Pending to Resolved', '2026-01-10 18:00:00'),
(13, 'Auto-escalated: unresolved for 3+ days', '2026-02-23 00:00:00'),
(14, 'Auto-escalated: unresolved for 3+ days', '2026-02-25 00:00:00'),
(15, 'Auto-escalated: unresolved for 3+ days', '2026-02-28 00:00:00');
