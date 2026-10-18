# Database migration inventory

The original `database/schema.sql` contains these tables:

- `users_profile` → `User` (profile, auth hash, KYC status, trust score)
- `user_settings` → `Setting` (currently stores a generic settings object; SQL theme/language/notification fields are not fully mapped)
- `user_kyc_docs` → `KycDocument` model added; no complete document upload/review API or UI
- `wallets_equinox` → `Wallet` (balance, status, activation time and card count)
- `payment_orders` → `PaymentOrder` (provider order/payment IDs, status, metadata)
- `payment_audit_logs` → `PaymentAudit`
- `equinox_cards` → `Card` (masked dashboard DTO; CVV stored as bcrypt hash)
- `transactions_master` → `Transaction`
- `community_pools` → `Pool`
- `pool_contributions` → `Contribution`
- `skill_listings` → `Skill`
- `service_contracts` → `Contract`
- `trust_scores` → `TrustScore`
- `trust_history` → `TrustHistory`
- `user_reviews` → `Review`
- `notifications` → `Notification`
- `login_history` → `LoginHistory`

## Original database logic that must be preserved

The original SQL schema defines `enforce_card_limit`, `update_pool_raised`, `close_pool_on_target`, `recalc_trust_on_review`, and `notify_on_transaction` triggers, plus procedures for wallet activation, transfers, pool contributions, trust recalculation and contract settlement.

The migration now implements several of these effects in transactional application code: activation ledger/notification/trust initialization, transfer notification, pool contribution notification, settlement notifications and trust recalculation. These source changes still require database integration tests to prove atomicity and concurrency behavior.

## Known parity gaps

- The SQL settings model is not fully mapped to individual setting fields.
- KYC document persistence has a model but no complete upload/submission/review workflow.
- The SQL demonstrator is a safe named-preset MongoDB demonstrator, not arbitrary SQL execution or full MySQL schema visualization.
- Direct UPI is a pending intent only, not an external payment integration.
- Original SQL trigger/procedure behavior has not been validated against a running database using fixture-based equivalence tests.
