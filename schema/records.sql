-- Create records table (nickname-only; no caregivers table)
CREATE TABLE IF NOT EXISTS records (
  record_id INTEGER PRIMARY KEY AUTOINCREMENT,
  caregiver_name TEXT NOT NULL,
  time TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('餵奶','擠奶','大便','小便')),
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_records_time ON records(time);
CREATE INDEX IF NOT EXISTS idx_records_caregiver_name ON records(caregiver_name);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  caregiver_name TEXT PRIMARY KEY,
  feeding_interval INTEGER DEFAULT 180,
  pumping_interval INTEGER DEFAULT 240,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

