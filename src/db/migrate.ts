import pool from './connection'
import dotenv from 'dotenv'

dotenv.config()

async function migrate() {
  try {
    const connection = await pool.getConnection()
    
    // Create caregivers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS caregivers (
        caregiver_id INT AUTO_INCREMENT PRIMARY KEY,
        caregiver_name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Create records table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS records (
        record_id INT AUTO_INCREMENT PRIMARY KEY,
        caregiver_id INT NOT NULL,
        time DATETIME NOT NULL,
        event ENUM('餵奶', '擠奶') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (caregiver_id) REFERENCES caregivers(caregiver_id) ON DELETE CASCADE,
        INDEX idx_caregiver_id (caregiver_id),
        INDEX idx_time (time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    connection.release()
    console.log('Migration completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrate()
