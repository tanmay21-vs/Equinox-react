# Equinox MERN independent audit and repair report

## Outcome

This archive has received additional source-level repairs after an independent comparison of the supplied repaired MERN ZIP against the original PHP/MySQL project and `database/schema.sql`.

**Status: source-repaired, runtime-unverified. Do not treat this build as fully working or production-ready.** The environment could not complete a clean npm dependency installation, and no MongoDB replica set or Razorpay sandbox session was available. Consequently, database integration, browser E2E, payment checkout, concurrency behavior, and the production frontend build remain unverified.

## Confirmed defects found in the supplied repaired archive

1. The frontend and backend bootstrap response used incompatible field names for cards, payments, transactions, skills, contracts, pools, notifications, trust history, login history, and directory entries. Several UI controls therefore received missing IDs, labels, names, or timestamps.
2. Transfers did not require the recipient wallet to be active, despite that requirement in the original SQL `transfer_eq` procedure.
3. The transfer endpoint ignored the selected card and did not reject a frozen/inactive selected card.
4. Wallet activation credited the wallet without creating the corresponding `DEPOSIT` ledger record, activation notification, or base trust-score record.
5. Transfer, pool contribution, and contract settlement paths did not reproduce the original transaction-trigger notification behavior.
6. Contract settlement did not recalculate trust scores for both contract participants, unlike the original `settle_contract` procedure.
7. Card listing used fields expected by the legacy interface (`card_id`, `masked_card_number`, `expiry_date`, `brand`) that the API did not provide. The card-freeze response also returned the raw model, including fields that the UI did not need.
8. CVV hashes used plain SHA-256, which is unsuitable for a low-entropy secret. The code now uses bcrypt and avoids returning the stored hash in dashboard card DTOs.
9. The card limit could be exceeded by concurrent issuance requests. Card-slot reservations and unique indexes were added as defense-in-depth; actual concurrency behavior still requires replica-set testing.
10. A failed or dismissed Razorpay checkout left its local order in `CREATED`, which could block another activation attempt or reserve a card slot indefinitely. A user-scoped order-abandon endpoint and frontend callbacks now close failed/cancelled orders.
11. UPI was unconditionally rejected with HTTP 501 even though the original PHP implementation recorded a pending UPI intent. The migrated route now records a `PENDING` intent only; it does not debit a wallet or claim external payment success.
12. The migrated UI still contained MySQL/PHP claims and stale setup guidance that did not describe the MongoDB implementation.

## Changes applied

- Reworked the bootstrap response to normalize MongoDB records into the field names expected by the legacy UI, populate counterpart/owner names, compute pool progress and contribution counts, and omit card CVV hashes and full card numbers from the dashboard card list.
- Added the `TrustScore` and `KycDocument` data models and expanded wallet/card/payment schema constraints.
- Added successful wallet-activation ledger, notification, activation timestamp, and base trust-score records in the same transaction as activation.
- Added receiver notifications for transfers and relevant transaction notifications for pool contributions and contract settlements.
- Recalculated and persisted trust-score summaries for both parties after contract settlement; review submission now updates the trust-score summary collection as well.
- Enforced active recipient wallets, selected-card ownership/status, two-decimal monetary inputs, future pool deadlines, and valid marketplace hourly rates.
- Added card slot reservations for pending card orders, unique card number/slot indexes, and a unique outstanding wallet-activation order index.
- Added explicit failed/cancelled checkout closure and frontend calls for payment failure, checkout dismissal, and missing checkout library.
- Moved the already-paid Razorpay idempotency response behind signature verification and rejected a different payment ID for an already fulfilled order.
- Replaced plain SHA-256 CVV hashing with bcrypt and normalized card DTOs returned by the API.
- Corrected misleading MySQL/PHP copy in the migrated UI and setup documentation.

## Verification actually performed in this environment

| Check | Result | Evidence / limitation |
|---|---|---|
| `node --check backend/src/server.js` | PASS | Syntax check completed. |
| `node --check backend/src/models/index.js` | PASS | Syntax check completed. |
| `node --check backend/src/middleware/auth.js` | PASS | Syntax check completed. |
| `node --check frontend/public/assets/app.js` | PASS | Syntax check completed. |
| Static API/DTO contract checks | PASS | All frontend API call paths have backend route definitions; required legacy UI DTO aliases are present; package JSON parses; no `.env` or `node_modules` is included. This is a static check, not runtime proof. |
| `php -l` on the original `src/App.php` | PASS | Original reference file was not modified. |
| Backend automated tests | BLOCKED | Dependency installation was interrupted; `jsonwebtoken` was missing from the partial `node_modules`, so the test file could not load. No assertion failure was observed, but the suite did not run. |
| Frontend production build | BLOCKED | `npm ci` could not complete in this environment; the offline retry lacked cached npm tarballs. |
| MongoDB transaction/API integration | NOT RUN | No `mongod` executable or running replica set was available. |
| Browser end-to-end / responsive audit | NOT RUN | Frontend dependencies/build were unavailable; no live application session could be exercised. |
| Razorpay sandbox checkout | NOT RUN | No configured test credentials or provider session was available. |
| Concurrency/idempotency tests | NOT RUN | Requires a running MongoDB replica set and executable API integration tests. |

No unavailable runtime test is marked as passed.

## Remaining limitations

- The frontend still injects the legacy HTML and runs imperative DOM JavaScript inside a React/Vite shell; it is not a complete component-based React refactor.
- KYC document storage is represented in the schema/model, but a complete upload/submission/review workflow and UI are not implemented or verified in this archive. The original SQL schema contains `user_kyc_docs`, but the original UI/API also does not provide a complete KYC document submission flow.
- The SQL demonstrator supports four named read-only MongoDB presets. It does not preserve arbitrary read-only SQL execution or MySQL schema visualization one-to-one.
- UPI is a pending-intent demonstration only. It does not contact a UPI provider, verify payment, or move wallet balances.
- The new unique indexes must be successfully built by MongoDB. If an existing database contains duplicate card numbers, duplicate card slots, or multiple outstanding activation orders, resolve those records before index creation.
- No production-readiness claim is made. Complete the setup and tests in `INTEGRATED_WORKFLOW_REPORT.md` before submission or use with real users.

## Credential hygiene

The supplied original project archive contained a `.env` file with non-empty credential-like values. It was not copied into the repaired ZIP. Keep the original archive private; if any values in that file are live rather than disposable test credentials, rotate them before sharing the project further.
