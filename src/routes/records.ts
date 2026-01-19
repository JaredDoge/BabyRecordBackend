import express from 'express'
import pool from '../db/connection'

const router = express.Router()

// Get all records (optionally filtered by caregiver_id)
router.get('/', async (req, res) => {
  try {
    const { caregiver_id } = req.query

    const connection = await pool.getConnection()
    
    let records: any[]
    if (caregiver_id) {
      // Get records for specific caregiver
      [records] = await connection.query(
        `SELECT r.record_id, r.caregiver_id, c.caregiver_name, r.time, r.event
         FROM records r
         JOIN caregivers c ON r.caregiver_id = c.caregiver_id
         WHERE r.caregiver_id = ?
         ORDER BY r.time DESC`,
        [caregiver_id]
      ) as any[]
    } else {
      // Get all records from all caregivers
      [records] = await connection.query(
        `SELECT r.record_id, r.caregiver_id, c.caregiver_name, r.time, r.event
         FROM records r
         JOIN caregivers c ON r.caregiver_id = c.caregiver_id
         ORDER BY r.time DESC`
      ) as any[]
    }

    connection.release()
    res.json(records)
  } catch (error) {
    console.error('Get records error:', error)
    res.status(500).json({ message: '查詢記錄失敗' })
  }
})

// Get single record
router.get('/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params

    const connection = await pool.getConnection()
    
    const [records] = await connection.query(
      `SELECT r.record_id, r.caregiver_id, c.caregiver_name, r.time, r.event
       FROM records r
       JOIN caregivers c ON r.caregiver_id = c.caregiver_id
       WHERE r.record_id = ?`,
      [recordId]
    ) as any[]

    connection.release()

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
router.post('/', async (req, res) => {
  try {
    const { caregiver_id, time, event } = req.body

    if (!caregiver_id || !time || !event) {
      return res.status(400).json({ message: 'caregiver_id, time, and event are required' })
    }

    if (event !== '餵奶' && event !== '擠奶') {
      return res.status(400).json({ message: 'event must be 餵奶 or 擠奶' })
    }

    const connection = await pool.getConnection()
    
    const [result] = await connection.query(
      'INSERT INTO records (caregiver_id, time, event) VALUES (?, ?, ?)',
      [caregiver_id, time, event]
    ) as any[]

    connection.release()
    res.json({ record_id: result.insertId })
  } catch (error) {
    console.error('Create record error:', error)
    res.status(500).json({ message: '新增記錄失敗' })
  }
})

// Update record
router.put('/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params
    const { time, event } = req.body

    if (!time || !event) {
      return res.status(400).json({ message: 'time and event are required' })
    }

    if (event !== '餵奶' && event !== '擠奶') {
      return res.status(400).json({ message: 'event must be 餵奶 or 擠奶' })
    }

    const connection = await pool.getConnection()
    
    const [result] = await connection.query(
      'UPDATE records SET time = ?, event = ? WHERE record_id = ?',
      [time, event, recordId]
    ) as any[]

    connection.release()

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
router.delete('/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params

    const connection = await pool.getConnection()
    
    const [result] = await connection.query(
      'DELETE FROM records WHERE record_id = ?',
      [recordId]
    ) as any[]

    connection.release()

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
