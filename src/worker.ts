import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
}

type RecordEvent = '餵奶' | '擠奶' | '大便' | '小便'
type D1RunResult = { success: boolean; meta?: { last_row_id?: number; changes?: number } }

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

app.get('/health', (c) => c.json({ status: 'ok' }))

// Get records (optionally filter by caregiver_name)
app.get('/api/records', async (c) => {
  const caregiver_name = c.req.query('caregiver_name')
  const sql = caregiver_name
    ? `SELECT record_id, caregiver_name, time, event, notes
       FROM records
       WHERE caregiver_name = ?
       ORDER BY time DESC`
    : `SELECT record_id, caregiver_name, time, event, notes
       FROM records
       ORDER BY time DESC`

  const stmt = c.env.DB.prepare(sql)
  const result = caregiver_name ? await stmt.bind(caregiver_name).all() : await stmt.all()

  return c.json(result.results ?? [])
})

// Get single record
app.get('/api/records/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const result = await c.env.DB.prepare(
    `SELECT record_id, caregiver_name, time, event, notes
     FROM records
     WHERE record_id = ?`
  )
    .bind(id)
    .first()

  if (!result) return c.json({ message: '記錄不存在' }, 404)
  return c.json(result)
})

// Create record
app.post('/api/records', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { caregiver_name, time, event, notes } = body as {
    caregiver_name?: string
    time?: string
    event?: RecordEvent
    notes?: string
  }

  if (!caregiver_name || !time || !event) {
    return c.json({ message: 'caregiver_name, time, event are required' }, 400)
  }
  if (!caregiver_name.trim()) {
    return c.json({ message: 'caregiver_name cannot be empty' }, 400)
  }
  if (!['餵奶', '擠奶', '大便', '小便'].includes(event)) {
    return c.json({ message: 'event must be 餵奶/擠奶/大便/小便' }, 400)
  }

  const res = await c.env.DB.prepare(
    'INSERT INTO records (caregiver_name, time, event, notes) VALUES (?, ?, ?, ?)'
  )
    .bind(caregiver_name.trim(), time, event, notes || '')
    .run() as unknown as D1RunResult

  return c.json({ record_id: res.meta?.last_row_id ?? null })
})

// Update record
app.put('/api/records/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json().catch(() => ({}))
  const { time, event, notes } = body as { time?: string; event?: RecordEvent; notes?: string }

  if (!time || !event) {
    return c.json({ message: 'time and event are required' }, 400)
  }
  if (!['餵奶', '擠奶', '大便', '小便'].includes(event)) {
    return c.json({ message: 'event must be 餵奶/擠奶/大便/小便' }, 400)
  }

  const res = await c.env.DB.prepare(
    'UPDATE records SET time = ?, event = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE record_id = ?'
  )
    .bind(time, event, notes !== undefined ? notes : '', id)
    .run() as unknown as D1RunResult

  if ((res.meta?.changes ?? 0) === 0) return c.json({ message: '記錄不存在' }, 404)
  return c.json({ record_id: id })
})

// Delete record
app.delete('/api/records/:id', async (c) => {
  const id = Number(c.req.param('id'))

  const res = await c.env.DB.prepare('DELETE FROM records WHERE record_id = ?')
    .bind(id)
    .run() as unknown as D1RunResult

  if ((res.meta?.changes ?? 0) === 0) return c.json({ message: '記錄不存在' }, 404)
  return c.json({ record_id: id })
})

// Get global settings
app.get('/api/settings', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT feeding_interval, pumping_interval, last_modified_by, updated_at FROM settings WHERE caregiver_name = ?'
  )
    .bind('global')
    .first()

  if (!result) {
    return c.json({
      feeding_interval: 180,
      pumping_interval: 240,
      last_modified_by: 'System',
      updated_at: new Date().toISOString()
    })
  }
  return c.json(result)
})

// Update global settings
app.put('/api/settings', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { feeding_interval, pumping_interval, caregiver_name } = body as {
    feeding_interval?: number
    pumping_interval?: number
    caregiver_name?: string
  }

  if (typeof feeding_interval !== 'number' || typeof pumping_interval !== 'number' || !caregiver_name) {
    return c.json({ message: 'feeding_interval, pumping_interval, and caregiver_name (modifier) are required' }, 400)
  }

  await c.env.DB.prepare(
    `INSERT INTO settings (caregiver_name, feeding_interval, pumping_interval, last_modified_by, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(caregiver_name) DO UPDATE SET
       feeding_interval = EXCLUDED.feeding_interval,
       pumping_interval = EXCLUDED.pumping_interval,
       last_modified_by = EXCLUDED.last_modified_by,
       updated_at = CURRENT_TIMESTAMP`
  )
    .bind('global', feeding_interval, pumping_interval, caregiver_name)
    .run()

  return c.json({ success: true })
})

export default app
