import express, { type Request, type Response } from 'express'
import pool from '../db/connection'
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise'

const router = express.Router()

// Helper function to convert ISO 8601 to MySQL DATETIME format
function toMySQLDateTime(isoString: string): string {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// Get all records (optionally filtered by caregiver_id)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { caregiver_id } = req.query

    let records: any[]
    if (caregiver_id) {
      // Get records for specific caregiver
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT r.record_id, r.caregiver_id, c.caregiver_name, r.time, r.event
         FROM records r
         JOIN caregivers c ON r.caregiver_id = c.caregiver_id
         WHERE r.caregiver_id = ?
         ORDER BY r.time DESC`,
        [caregiver_id]
      )
      records = rows
    } else {
      // Get all records from all caregivers
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT r.record_id, r.caregiver_id, c.caregiver_name, r.time, r.event
         FROM records r
         JOIN caregivers c ON r.caregiver_id = c.caregiver_id
         ORDER BY r.time DESC`
      )
      records = rows
    }

    res.json(records)
  } catch (error) {
    console.error('Get records error:', error)
    res.status(500).json({ message: '查詢記錄失敗' })
  }
})

// Get single record
router.get('/:recordId', async (req: Request, res: Response) => {
  try {
    const { recordId } = req.params

    const [records] = await pool.query<RowDataPacket[]>(
      `SELECT r.record_id, r.caregiver_id, c.caregiver_name, r.time, r.event
       FROM records r
       JOIN caregivers c ON r.caregiver_id = c.caregiver_id
       WHERE r.record_id = ?`,
      [recordId]
    )

    if (records.length === 0) {
      return res.status(404).json({ message: '記錄不存在' })
    }

    res.json(records[0])
  } catch (error) {
    console.error('Get record error:', error)
    res.status(500).json({ message: '查詢記錄失敗' })
  }
})

// Create record
router.post('/', async (req: Request, res: Response) => {
  try {
    const { caregiver_id, time, event } = req.body

    if (!caregiver_id || !time || !event) {
      return res.status(400).json({ message: 'caregiver_id, time, and event are required' })
    }

    const allowedEvents = ['餵奶', '擠奶', '大便', '小便']
    if (!allowedEvents.includes(event)) {
      return res.status(400).json({ message: 'event must be 餵奶, 擠奶, 大便 or 小便' })
    }

    // Convert ISO 8601 to MySQL DATETIME format
    const mysqlDateTime = toMySQLDateTime(time)

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO records (caregiver_id, time, event) VALUES (?, ?, ?)',
      [caregiver_id, mysqlDateTime, event]
    )

    res.json({ record_id: result.insertId ?? (result as any).insertId })
  } catch (error) {
    console.error('Create record error:', error)
    res.status(500).json({ message: '新增記錄失敗' })
  }
})

// Update record
router.put('/:recordId', async (req: Request, res: Response) => {
  try {
    const { recordId } = req.params
    const { time, event } = req.body

    if (!time || !event) {
      return res.status(400).json({ message: 'time and event are required' })
    }

    const allowedEvents = ['餵奶', '擠奶', '大便', '小便']
    if (!allowedEvents.includes(event)) {
      return res.status(400).json({ message: 'event must be 餵奶, 擠奶, 大便 or 小便' })
    }

    // Convert ISO 8601 to MySQL DATETIME format
    const mysqlDateTime = toMySQLDateTime(time)

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE records SET time = ?, event = ? WHERE record_id = ?',
      [mysqlDateTime, event, recordId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '記錄不存在' })
    }

    res.json({ record_id: parseInt(recordId) })
  } catch (error) {
    console.error('Update record error:', error)
    res.status(500).json({ message: '更新記錄失敗' })
  }
})

// Delete record
router.delete('/:recordId', async (req: Request, res: Response) => {
  try {
    const { recordId } = req.params

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM records WHERE record_id = ?',
      [recordId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '記錄不存在' })
    }

    res.json({ record_id: parseInt(recordId) })
  } catch (error) {
    console.error('Delete record error:', error)
    res.status(500).json({ message: '刪除記錄失敗' })
  }
})

export default router
