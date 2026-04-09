-- ============================================
-- Views, Stored Procedures, and Triggers
-- ============================================



-- ============================================
-- VIEW: Hotspot Areas (complaint count per area)
-- ============================================
DROP VIEW IF EXISTS v_hotspot_areas;
CREATE VIEW v_hotspot_areas AS
SELECT 
    a.area_id,
    a.area_name,
    COUNT(c.complaint_id) AS complaint_count
FROM area a
LEFT JOIN complaint c ON a.area_id = c.area_id
GROUP BY a.area_id, a.area_name
ORDER BY complaint_count DESC;

-- ============================================
-- VIEW: Category Frequency
-- ============================================
DROP VIEW IF EXISTS v_category_frequency;
CREATE VIEW v_category_frequency AS
SELECT 
    category,
    COUNT(*) AS total_complaints,
    SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved,
    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN status = 'Escalated' THEN 1 ELSE 0 END) AS escalated
FROM complaint
GROUP BY category
ORDER BY total_complaints DESC;

-- ============================================
-- VIEW: Monthly Trend
-- ============================================
DROP VIEW IF EXISTS v_monthly_trend;
CREATE VIEW v_monthly_trend AS
SELECT 
    DATE_FORMAT(date, '%Y-%m') AS month,
    COUNT(*) AS total_complaints,
    SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved,
    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending
FROM complaint
GROUP BY DATE_FORMAT(date, '%Y-%m')
ORDER BY month DESC;

-- ============================================
-- VIEW: Department Performance
-- ============================================
DROP VIEW IF EXISTS v_dept_performance;
CREATE VIEW v_dept_performance AS
SELECT 
    d.dept_id,
    d.dept_name,
    COUNT(c.complaint_id) AS total_assigned,
    SUM(CASE WHEN c.status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_count,
    SUM(CASE WHEN c.status = 'Pending' THEN 1 ELSE 0 END) AS pending_count,
    SUM(CASE WHEN c.status = 'Escalated' THEN 1 ELSE 0 END) AS escalated_count,
    SUM(CASE WHEN c.status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress_count,
    ROUND(AVG(
        CASE WHEN c.resolved_date IS NOT NULL 
        THEN TIMESTAMPDIFF(HOUR, c.date, c.resolved_date) 
        ELSE NULL END
    ), 1) AS avg_resolution_hours
FROM department d
LEFT JOIN complaint c ON d.dept_id = c.dept_id
GROUP BY d.dept_id, d.dept_name
ORDER BY resolved_count DESC;

-- ============================================
-- STORED PROCEDURE: Detect Hotspots
-- ============================================
DROP PROCEDURE IF EXISTS sp_detect_hotspots;
DELIMITER //
CREATE PROCEDURE sp_detect_hotspots(IN top_n INT)
BEGIN
    SELECT 
        a.area_id,
        a.area_name,
        COUNT(c.complaint_id) AS complaint_count,
        GROUP_CONCAT(DISTINCT c.category ORDER BY c.category) AS categories,
        SUM(CASE WHEN c.status IN ('Pending','Escalated') THEN 1 ELSE 0 END) AS unresolved
    FROM area a
    JOIN complaint c ON a.area_id = c.area_id
    GROUP BY a.area_id, a.area_name
    ORDER BY complaint_count DESC
    LIMIT top_n;
END //
DELIMITER ;

-- ============================================
-- EVENT: Auto Escalate (runs frequently)
-- ============================================
-- Note: MySQL EVENT SCHEDULER must be enabled:
-- SET GLOBAL event_scheduler = ON;

DROP EVENT IF EXISTS evt_auto_escalate;
DELIMITER //
CREATE EVENT evt_auto_escalate
ON SCHEDULE EVERY 1 MINUTE
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    -- Log unassigned pending complaints getting escalated
    INSERT INTO audit_log (complaint_id, action, action_date)
    SELECT complaint_id, 'Auto-escalated: pending for 3+ days', NOW()
    FROM complaint
    WHERE status = 'Pending' AND dept_id IS NULL
    AND TIMESTAMPDIFF(DAY, date, NOW()) >= 3;

    -- Update pending complaints
    UPDATE complaint 
    SET status = 'Escalated'
    WHERE status = 'Pending' AND dept_id IS NULL
    AND TIMESTAMPDIFF(DAY, date, NOW()) >= 3;
    
    -- Log assigned complaints getting returned to Admin
    INSERT INTO audit_log (complaint_id, action, action_date)
    SELECT complaint_id, 'Auto-escalated: unresolved for 3 days by dept, returned to admin', NOW()
    FROM complaint
    WHERE status = 'In Progress' AND dept_id IS NOT NULL 
    AND assigned_date IS NOT NULL
    AND TIMESTAMPDIFF(DAY, assigned_date, NOW()) >= 3;

    -- Update assigned complaints (Return to Admin)
    UPDATE complaint 
    SET status = 'Escalated', dept_id = NULL
    WHERE status = 'In Progress' AND dept_id IS NOT NULL
    AND assigned_date IS NOT NULL
    AND TIMESTAMPDIFF(DAY, assigned_date, NOW()) >= 3;
END //
DELIMITER ;

-- ============================================
-- TRIGGER: Log complaint status changes
-- ============================================
DROP TRIGGER IF EXISTS trg_complaint_audit;
DELIMITER //
CREATE TRIGGER trg_complaint_audit
AFTER UPDATE ON complaint
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO audit_log (complaint_id, action, action_date)
        VALUES (NEW.complaint_id, 
                CONCAT('Status changed from ', OLD.status, ' to ', NEW.status), 
                NOW());
    END IF;
    IF OLD.dept_id IS NULL AND NEW.dept_id IS NOT NULL THEN
        INSERT INTO audit_log (complaint_id, action, action_date)
        VALUES (NEW.complaint_id, 
                CONCAT('Assigned to department ID: ', NEW.dept_id), 
                NOW());
    END IF;
END //
DELIMITER ;
