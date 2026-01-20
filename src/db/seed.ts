import pool from './connection'
import dotenv from 'dotenv'

dotenv.config()

async function seed() {
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

    // Test connection first
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    console.log('Database connection successful!')

    // Define caregivers to insert
    const caregivers = ['阿公', '阿嬤', '爸爸', '媽媽']

    console.log('\nInserting caregivers...')

    for (const name of caregivers) {
      try {
        // Check if caregiver already exists
        const [existing] = await pool.query(
          'SELECT caregiver_id FROM caregivers WHERE caregiver_name = ?',
          [name]
        ) as any[]

        if (existing.length > 0) {
          console.log(`  ✓ ${name} already exists (ID: ${existing[0].caregiver_id})`)
        } else {
          // Insert new caregiver
          const [result] = await pool.query(
            'INSERT INTO caregivers (caregiver_name) VALUES (?)',
            [name]
          ) as any[]
          console.log(`  ✓ Created ${name} (ID: ${result.insertId})`)
        }
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`  ✓ ${name} already exists`)
        } else {
          console.error(`  ✗ Failed to create ${name}:`, error.message)
        }
      }
    }

    // Show all caregivers
    console.log('\nAll caregivers in database:')
    const [allCaregivers] = await pool.query(
      'SELECT caregiver_id, caregiver_name, created_at FROM caregivers ORDER BY caregiver_id'
    ) as any[]

    allCaregivers.forEach((caregiver: any) => {
      console.log(`  - ID: ${caregiver.caregiver_id}, Name: ${caregiver.caregiver_name}`)
    })

    console.log('\nSeed completed successfully!')
    process.exit(0)
  } catch (error: any) {
    console.error('Seed failed:', error.message)
    if (error.code === 'ENOTFOUND') {
      console.error('\nDNS resolution failed. Please check:')
      console.error('1. DB_HOST in .env file is correct')
      console.error('2. You have internet connection')
      console.error('3. The Aiven service is running')
      console.error('\nCurrent DB_HOST:', process.env.DB_HOST)
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\nConnection refused. Please check:')
      console.error('1. DB_HOST and DB_PORT are correct')
      console.error('2. The database service is accessible')
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nAccess denied. Please check:')
      console.error('1. DB_USER and DB_PASSWORD are correct')
    } else {
      console.error('Error details:', error)
    }
    process.exit(1)
  }
}

seed()
