# Baby Record Backend

TypeScript Express backend API for baby feeding and pumping records.

## Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials

4. Run migrations:
```bash
npm run migrate
```

5. Start development server:
```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

## API Endpoints

### Caregivers
- `POST /api/caregivers/login` - Login/create caregiver
  - Body: `{ caregiver_name: string }`
  - Returns: `{ caregiver_id: number }`

### Records
- `GET /api/records` - Get all records (from all caregivers)
- `GET /api/records?caregiver_id=:id` - Get records for a specific caregiver (optional filter)
- `GET /api/records/:recordId` - Get single record
- `POST /api/records` - Create record
  - Body: `{ caregiver_id: number, time: string (ISO), event: '餵奶' | '擠奶' }`
- `PUT /api/records/:recordId` - Update record
  - Body: `{ time: string (ISO), event: '餵奶' | '擠奶' }`
- `DELETE /api/records/:recordId` - Delete record
