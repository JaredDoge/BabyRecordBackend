import express, { type Request, type Response } from 'express'
import pool from '../db/connection'
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise'

const router = express.Router()

// Login/Create caregiver
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { caregiver_name } = req.body

    if (!caregiver_name || typeof caregiver_name !== 'string' || caregiver_name.trim() === '') {
      return res.status(400).json({ message: '照顧者名稱不能為空' })
    }

    // Try to find existing caregiver
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT caregiver_id FROM caregivers WHERE caregiver_name = ?',
      [caregiver_name.trim()]
    )

    if (existing.length > 0) {
      return res.json({ caregiver_id: existing[0].caregiver_id })
    }

    // Create new caregiver
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO caregivers (caregiver_name) VALUES (?)',
      [caregiver_name.trim()]
    )

    res.json({ caregiver_id: result.insertId ?? (result as any).insertId })
  } catch (error: any) {
    console.error('Login error:', error)
    if (error.code === 'ER_DUP_ENTRY') {
      // Retry to get existing caregiver
      try {
        const [existing] = await pool.query<RowDataPacket[]>(
          'SELECT caregiver_id FROM caregivers WHERE caregiver_name = ?',
          [req.body.caregiver_name.trim()]
        )
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
