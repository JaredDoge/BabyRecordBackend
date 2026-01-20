import pool from './connection'
import dotenv from 'dotenv'

dotenv.config()

async function migrate() {
  try {
    // Check environment variables
    const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars.join(', '))
      console.error('Please check your .env file in the backend directory')
      process.exit(1)
    }

    console.log('Connecting to database...')
    console.log('Host:', process.env.DB_HOST)
    console.log('Port:', process.env.DB_PORT || '3306')
    console.log('Database:', process.env.DB_NAME)
    console.log('User:', process.env.DB_USER)

    // Test connection first
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    console.log('Database connection successful!')

    // Create caregivers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS caregivers (
        caregiver_id INT AUTO_INCREMENT PRIMARY KEY,
        caregiver_name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Create records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS records (
        record_id INT AUTO_INCREMENT PRIMARY KEY,
        caregiver_id INT NOT NULL,
        time DATETIME NOT NULL,
        event ENUM('餵奶', '擠奶', '大便', '小便') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (caregiver_id) REFERENCES caregivers(caregiver_id) ON DELETE CASCADE,
        INDEX idx_caregiver_id (caregiver_id),
        INDEX idx_time (time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    console.log('Migration completed successfully')
    process.exit(0)
  } catch (error: any) {
    console.error('Migration failed:', error.message)
    if (error.code === 'ENOTFOUND') {
      console.error('\nDNS resolution failed. Please check:')
      console.error('1. DB_HOST in .env file is correct')
      console.error('2. You have internet connection')
      console.error('3. The Aiven service is running')
      console.error('\nCurrent DB_HOST:', process.env.DB_HOST)
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\nConnection refused. Please check:')
      console.error('1. DB_HOST and DB_PORT are correct')
      console.error('2. The Aiven service is accessible')
      console.error('3. Firewall settings allow the connection')
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nAccess denied. Please check:')
      console.error('1. DB_USER and DB_PASSWORD are correct')
      console.error('2. The user has proper permissions')
    } else {
      console.error('Error details:', error)
    }
    process.exit(1)
  }
}

migrate()
