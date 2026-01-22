-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  caregiver_name TEXT PRIMARY KEY,
  feeding_interval INTEGER DEFAULT 180,
  pumping_interval INTEGER DEFAULT 240,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
