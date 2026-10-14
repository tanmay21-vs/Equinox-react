# Equinox MERN migration (working migration baseline)

This package preserves the original HTML/CSS/DOM interface in a React/Vite shell and introduces an Express/Mongoose backend. The original PHP source is not included in this output; it remains untouched in the uploaded archive.

## Requirements
- Node.js 20+ and npm
- MongoDB 7+ running locally or a MongoDB Atlas connection string

## Setup
1. Copy `backend/.env.example` to `backend/.env`. Set `MONGODB_URI` and replace `JWT_SECRET` with a long random secret. Add Razorpay credentials only for a properly configured test account.
2. In a terminal: `cd backend && npm install && npm run dev`
3. In a second terminal: `cd frontend && npm install && npm run dev`
4. Open `http://localhost:5173`.

## Important migration status / limitations
- The original screen markup, stylesheet, browser logic, QR libraries and existing UI copy are retained to reduce visual drift. The UI is hosted by a React root, but its legacy DOM-rendering logic has not yet been refactored into individual React components.
- Registration, login, dashboard bootstrap, transfers, skill listings, community pool creation/contributions, contract creation/settlement, card freeze and review submission have initial MongoDB implementations. MongoDB transactions require a replica set (including Atlas); standalone local MongoDB may reject transaction operations.
- Razorpay order creation, payment verification, and UPI processing deliberately return explicit errors until the provider flow is implemented and configured. Wallet activation/card issuance are therefore not end-to-end complete. The query demonstrator supports only named read-only presets; arbitrary SQL cannot be translated safely to MongoDB.
- The PHP project relies on MySQL procedures/triggers and SQL joins. These have to be explicitly reproduced as application services/transactional operations; a complete one-to-one semantic migration and exhaustive QA are not yet achieved by this baseline.
- No original `.env` or credentials are copied. Never commit secrets.

## API
`GET /api/health`, `POST /api/register`, `POST /api/login`, authenticated `GET /api/bootstrap`, `POST /api/wallet/transfer`, `POST /api/cards/freeze`, `POST /api/skills`, `POST /api/pools`, `POST /api/pools/contribute`, `POST /api/contracts`, `POST /api/contracts/settle`, `POST /api/reviews`, `POST /api/payments/create-order`, `POST /api/payments/verify`, `POST /api/payments/upi`, `POST /api/query-demonstrator`, `GET /api/stream`.

## Security note
Use only sandbox payment credentials while testing. Review every endpoint and business rule before production use.
