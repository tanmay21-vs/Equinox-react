# Equinox integrated workflow report

## Execution status

The end-to-end workflows below were reviewed against the source and original SQL procedures. They could not be executed because npm installation did not complete and no MongoDB replica set or Razorpay sandbox session was available. These are not reported as passes.

| Scenario | Required evidence | Current source state | Test status |
|---|---|---|---|
| A — Register, duplicate registration, login, refresh, logout, invalid/expired JWT | Account records commit together; duplicate accounts rejected; browser session restored; protected endpoints reject invalid tokens | Registration uses a transaction; JWT middleware tests exist but could not load due missing dependency in this environment. | BLOCKED |
| B — Wallet activation and two-account transfer | Valid payment credits 500 Eq exactly once; ledger/notification/trust records match; both balances reconcile; inactive recipient/insufficient funds rejected | Activation ledger/notification/trust baseline and recipient-active checks added. | BLOCKED — MongoDB/Razorpay unavailable. |
| C — Card issuance, freeze/unfreeze and limits | Card issued only after captured payment; card fields render; frozen card cannot be used; no more than three slots | DTO normalization, bcrypt CVV hash, slot reservation/indexes, and selected-card checks added. | BLOCKED — no DB/provider/concurrency test. |
| D — Marketplace and contracts | Listing renders with owner name; contract references valid skill and participants; settlement transfers exactly once and updates trust | DTO normalization and settlement trust/notification side effects added. | BLOCKED. |
| E — Community pools | Pool displays creator/progress/count; valid contribution atomically debits wallet, records contribution/ledger, closes at target, and emits notification | Pool DTO and contribution transaction/notification present in source. | BLOCKED. |
| F — Reviews/trust | Only valid contract participants review; duplicate reviews rejected; score and history match SQL fixture values | Validation, unique index, and TrustScore summary update present in source. | BLOCKED — no DB fixture comparison. |
| G — QR and UPI | QR resolves intended recipient; malformed QR rejected; UPI pending intent is not misrepresented as completed payment | UI source reviewed; UPI endpoint records PENDING intent without moving funds; pending display corrected. | BLOCKED — browser/camera not exercised. |
| H — Dashboard/query/navigation | All UI-required IDs/names/timestamps are populated; presets render; no console or network errors | Bootstrap response normalization added; four safe read-only presets remain. | BLOCKED. |
| I — Payment failure/cancel/retry | Failed or dismissed checkout closes pending order; retry is possible; duplicate fulfillment prevented | User-scoped abandon endpoint and frontend callbacks added; signature/idempotency guard improved. | BLOCKED — Razorpay/browser unavailable. |

## Commands/results recorded

- `node --check backend/src/server.js` — PASS.
- `node --check backend/src/models/index.js` — PASS.
- `node --check backend/src/middleware/auth.js` — PASS.
- `node --check frontend/public/assets/app.js` — PASS.
- `php -l` on the original PHP reference — PASS; the original project was not modified.
- Backend test suite — BLOCKED because the interrupted dependency installation left `jsonwebtoken` unavailable in `node_modules`.
- Frontend production build — BLOCKED because npm dependencies could not be installed in this environment.
- MongoDB transaction/API tests, browser E2E and Razorpay sandbox — NOT RUN.

## Required completion steps on a suitable environment

1. Extract the archive and run `npm ci` in `backend` and `frontend` with network access.
2. Configure a dedicated MongoDB replica set; ensure the new unique indexes build successfully.
3. Configure a long random `JWT_SECRET` and Razorpay **test-mode** credentials only.
4. Run `cd backend && npm run check && npm test` and `cd frontend && npm run build`.
5. Run API integration tests with two or more synthetic users and verify wallet balances, transactions, notifications, trust scores, cards, contracts and pools directly in MongoDB.
6. Use browser automation to execute the UI workflows and inspect console/network logs at desktop and mobile sizes.
7. Test checkout cancellation/failure, repeated verification, concurrent card orders, concurrent transfers, contributions and contract settlement.
8. Compare trust-score outputs against known SQL procedure fixtures and document any intentional differences.

Do not use real money or production user data during verification.
