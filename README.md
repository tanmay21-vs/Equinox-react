# Equinox MERN migration (working migration baseline)

This package preserves the original HTML/CSS/DOM interface in a React/Vite shell and introduces an Express/Mongoose backend. The original PHP source is not included in this output; it remains untouched in the uploaded archive.

## Requirements
- Node.js 20+ and npm
- MongoDB 7+ configured as a replica set (a single-node local replica set is sufficient for development) or a MongoDB Atlas replica-set connection string

## Setup
1. Copy `backend/.env.example` to `backend/.env`. Set `MONGODB_URI` to a replica-set connection and replace `JWT_SECRET` with a unique random secret of at least 32 characters. Add Razorpay credentials only for a properly configured test account.
2. Configure the local MongoDB server with replica set name `rs0` and initialize it once (`rs.initiate()` in `mongosh`), or use MongoDB Atlas. Transactions will not work against a standalone `mongod`.
3. In a terminal: `cd backend && npm ci && npm run dev`
4. In a second terminal: `cd frontend && npm ci && npm run dev`
5. Open `http://localhost:5173`.

## Important migration status / limitations
- The original screen markup, stylesheet, browser logic, QR libraries and existing UI copy are retained to reduce visual drift. The UI is hosted by a React root, but its legacy DOM-rendering logic has not yet been refactored into individual React components.
- Registration, login, dashboard bootstrap, transfers, skill listings, community pool creation/contributions, contract creation/settlement, card freeze and review submission have initial MongoDB implementations. MongoDB transactions require a replica set (including Atlas); standalone local MongoDB may reject transaction operations.
- Razorpay order creation and payment verification are implemented against the Razorpay API, but cannot be confirmed end-to-end without valid test credentials and a running MongoDB replica set. UPI is a pending-intent demonstration only: it records a PENDING ledger entry and does not move wallet funds or verify an external UPI payment. Wallet activation/card issuance must be verified with test-mode credentials before being treated as complete. The query demonstrator exposes four named read-only MongoDB presets (trust distribution, transaction activity, pool progress, and recent transactions). The bootstrap API normalizes Mongoose records to the legacy UI field names for cards, payments, transactions, skills, contracts, pools, notifications, trust history, login history, and directory entries. Arbitrary SQL cannot be translated safely to MongoDB; the UI now describes the actual behavior and results include columns, row count, query label, and execution timestamp.
- The PHP project relies on MySQL procedures/triggers and SQL joins. These have to be explicitly reproduced as application services/transactional operations; a complete one-to-one semantic migration and exhaustive QA are not yet achieved by this baseline.
- No original `.env` or credentials are copied. Never commit secrets.

## Verification commands

- Frontend production build: `cd frontend && npm ci && npm run build`
- Backend syntax check: `npm run check`
- Backend unit tests: `npm test`
- Database-backed API and payment workflows require a running MongoDB replica set and valid Razorpay test credentials; do not treat static checks as end-to-end verification.

## API
`GET /api/health`, `POST /api/register`, `POST /api/login`, authenticated `GET /api/bootstrap`, `POST /api/wallet/transfer`, `POST /api/cards/freeze`, `POST /api/skills`, `POST /api/pools`, `POST /api/pools/contribute`, `POST /api/contracts`, `POST /api/contracts/settle`, `POST /api/reviews`, `POST /api/payments/create-order`, `POST /api/payments/verify`, `POST /api/payments/abandon-order`, `POST /api/payments/upi`, `POST /api/query-demonstrator`, `GET /api/stream`.

## Security note
Use only sandbox payment credentials while testing. Review every endpoint and business rule before production use.

## Credential hygiene

The repaired ZIP intentionally excludes `.env` files. Copy `.env.example` to `.env` and enter your own local values. Do not upload or commit credentials. If the original archive's `.env` contains any live credentials, rotate them before sharing the archive.
