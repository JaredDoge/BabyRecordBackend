import express from 'express'
import pool from '../db/connection'

const router = express.Router()

// Login/Create caregiver
router.post('/login', async (req, res) => {
  try {
    const { caregiver_name } = req.body

    if (!caregiver_name || typeof caregiver_name !== 'string' || caregiver_name.trim() === '') {
      return res.status(400).json({ message: '照顧者名稱不能為空' })
    }

    const connection = await pool.getConnection()
    
    // Try to find existing caregiver
    const [existing] = await connection.query(
      'SELECT caregiver_id FROM caregivers WHERE caregiver_name = ?',
      [caregiver_name.trim()]
    ) as any[]

    if (existing.length > 0) {
      connection.release()
      return res.json({ caregiver_id: existing[0].caregiver_id })
    }

    // Create new caregiver
    const [result] = await connection.query(
      'INSERT INTO caregivers (caregiver_name) VALUES (?)',
      [caregiver_name.trim()]
    ) as any[]

    connection.release()
    res.json({ caregiver_id: result.insertId })
  } catch (error: any) {
    console.error('Login error:', error)
    if (error.code === 'ER_DUP_ENTRY') {
      // Retry to get existing caregiver
      try {
        const connection = await pool.getConnection()
        const [existing] = await connection.query(
          'SELECT caregiver_id FROM caregivers WHERE caregiver_name = ?',
          [req.body.caregiver_name.trim()]
        ) as any[]
        connection.release()
        if (existing.length > 0) {
          return res.json({ caregiver_id: existing[0].caregiver_id })
        }
      } catch (retryError) {
        // Fall through to error response
      }
    }
    res.status(500).json({ message: '登入失敗，請稍後再試' })
  }
})

export default router
