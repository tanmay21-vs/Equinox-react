# Equinox feature verification matrix

**Status meanings:** `SOURCE FIXED / NOT RUN` means code was changed or inspected but runtime behavior was not executed. `BLOCKED` means a required dependency/service was unavailable. `PARTIAL` means the feature intentionally retains a limitation. `NOT IMPLEMENTED` means no complete implementation is present.

| Feature | Frontend / backend | Source-level finding and current state | Runtime verification |
|---|---|---|---|
| React/Vite startup | `frontend/src/main.jsx`, Vite | Legacy HTML is still injected into a React shell; not a component refactor. | BLOCKED — production build not run. |
| Registration | `/api/register`, User/Wallet/Setting | Transactional creation and input validation present; phone normalization added. | BLOCKED — replica-set transaction not run. |
| Login/JWT | `/api/login`, `middleware/auth.js` | Email trim/lowercase; JWT middleware exists; successful login history is stored. | BLOCKED — test dependencies incomplete; DB login not run. |
| Session restoration/logout | `app.js`, `/api/bootstrap` | Legacy UI uses local storage and bootstrap; browser flow not exercised. | BLOCKED. |
| Dashboard/profile | `/api/bootstrap` | Response fields normalized; password hash excluded. | BLOCKED — MongoDB/API/browser not run. |
| Wallet activation | Razorpay create/verify | Adds activation ledger entry, notification, timestamp, and trust-score baseline transactionally; outstanding activation order guard added. | BLOCKED — Razorpay and MongoDB unavailable. |
| Wallet transfer | `/api/wallet/transfer` | Amount precision, active sender/recipient, selected-card ownership/status, ledger and receiver notification handled in source. | BLOCKED — balances/atomicity not exercised. |
| Transaction history | bootstrap + `renderTransactions` | IDs, timestamps, counterpart names normalized; pending UPI and pool display signs corrected. | SOURCE FIXED / NOT RUN. |
| Virtual card issuance | Razorpay verify + Card model | Card slot reservation, unique indexes, bcrypt CVV hash, normalized issued-card response. | BLOCKED — payment/database/concurrency tests not run. |
| Card listing/freeze | `/api/cards/freeze` | DTO aliases added; raw CVV hash/full number omitted from dashboard and freeze response. | SOURCE FIXED / NOT RUN. |
| Razorpay failure/cancel | `/api/payments/abandon-order`, frontend callbacks | Failed/dismissed checkout closes the local pending order to release the activation/card slot. | BLOCKED — provider/browser callbacks not exercised. |
| Razorpay idempotency | `/api/payments/verify` | Signature checked before already-fulfilled response; different payment ID rejected. | BLOCKED — sandbox test not run. |
| Direct UPI | `/api/payments/upi` | Records only a pending intent; no external UPI payment or wallet debit. | PARTIAL — intentionally not a real payment integration. |
| QR generation/scanning | Bundled QR libraries + `app.js` | Assets and handlers exist; no camera/QR browser workflow executed. | BLOCKED. |
| Skill marketplace | `/api/skills`, bootstrap | Skill IDs, owner names, and timestamps normalized. | BLOCKED — database/browser workflow not run. |
| Contract creation | `/api/contracts` | Skill ownership, active listing, hours and rate validation exist; bootstrap joins names/IDs. | BLOCKED. |
| Contract settlement | `/api/contracts/settle` | Atomic balance/contract/ledger updates; notifications and trust-score recalculation added. | BLOCKED — transaction/concurrency tests not run. |
| Community pool creation | `/api/pools` | Future deadline and positive two-decimal target validation; pool DTO includes creator/progress/count. | BLOCKED. |
| Pool contribution | `/api/pools/contribute` | Atomic wallet/pool/contribution/ledger updates and notification in source. | BLOCKED — database/concurrency tests not run. |
| Reviews | `/api/reviews` | Participant/completed-contract checks, unique index and trust-score summary update. | BLOCKED — index and DB behavior not run. |
| Trust score/history | `TrustScore`, `TrustHistory` | SQL-equivalent score formula is implemented in review/settlement code; trust summary persisted. | BLOCKED — values not compared against SQL fixtures at runtime. |
| Notifications | bootstrap + transaction routes | Transfer, activation, pool and provider settlement notifications added; fields normalized for UI. | BLOCKED — database/browser test not run. |
| Login/security history | `/api/login`, bootstrap | Login history fields normalized for UI. | BLOCKED. |
| Directory | bootstrap | Wallet status, skill count, KYC status and wallet IDs populated. | BLOCKED. |
| Query demonstrator | `/api/query-demonstrator` | Four named read-only MongoDB presets; no arbitrary SQL execution. | PARTIAL — query execution not run. |
| KYC document workflow | `KycDocument` model | Data model exists, but no complete upload/submission/review API or UI. | NOT IMPLEMENTED. |
| Live state endpoint | `/api/stream` | Restored JSON wallet, unread notification and payment summary response shape. | BLOCKED — API runtime not tested. |
| Responsive/accessibility/console | Legacy DOM UI | No live browser inspection or accessibility audit completed. | BLOCKED. |

No row above should be interpreted as a successful end-to-end test unless it explicitly says runtime verification passed. No end-to-end scenario passed in this environment.
