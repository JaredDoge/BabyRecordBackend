import dotenv from 'dotenv'
import pool from './connection'

dotenv.config()

async function run() {
  try {
    const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
    const missingVars = requiredEnvVars.filter((k) => !process.env[k])
    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars.join(', '))
      console.error('Please check your backend/.env file')
      process.exit(1)
    }

    console.log('Connecting to database...')
    console.log('Host:', process.env.DB_HOST)
    console.log('Database:', process.env.DB_NAME)

    const conn = await pool.getConnection()
    await conn.ping()
    conn.release()
    console.log('Database connection successful!')

    console.log('Updating schema: records.event ENUM...')
    await pool.query(
      "ALTER TABLE records MODIFY COLUMN event ENUM('餵奶','擠奶','大便','小便') NOT NULL",
    )

    console.log('Schema update completed successfully!')
    process.exit(0)
  } catch (error: any) {
    console.error('Schema update failed:', error?.message ?? error)
    process.exit(1)
  }
}

run()

