-- Migration to add last_modified_by and repurpose settings for global use
ALTER TABLE settings ADD COLUMN last_modified_by TEXT;

-- Initial default global settings if none exist
INSERT OR IGNORE INTO settings (caregiver_name, feeding_interval, pumping_interval, last_modified_by)
VALUES ('global', 180, 240, 'System');
