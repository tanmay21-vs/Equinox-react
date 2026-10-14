# Database migration inventory

Original MySQL tables detected in `database/schema.sql`:

- `users_profile` — inspect corresponding model/service before production migration.
- `user_settings` — inspect corresponding model/service before production migration.
- `user_kyc_docs` — inspect corresponding model/service before production migration.
- `wallets_equinox` — inspect corresponding model/service before production migration.
- `payment_orders` — inspect corresponding model/service before production migration.
- `payment_audit_logs` — inspect corresponding model/service before production migration.
- `equinox_cards` — inspect corresponding model/service before production migration.
- `transactions_master` — inspect corresponding model/service before production migration.
- `community_pools` — inspect corresponding model/service before production migration.
- `pool_contributions` — inspect corresponding model/service before production migration.
- `skill_listings` — inspect corresponding model/service before production migration.
- `service_contracts` — inspect corresponding model/service before production migration.
- `trust_scores` — inspect corresponding model/service before production migration.
- `trust_history` — inspect corresponding model/service before production migration.
- `user_reviews` — inspect corresponding model/service before production migration.
- `notifications` — inspect corresponding model/service before production migration.
- `login_history` — inspect corresponding model/service before production migration.

The current Mongoose layer models core user, wallet, payment, card, transaction, pool, contribution, skill, contract, review, trust history, notification, login history, settings and payment audit concepts. SQL stored procedures/triggers require explicit semantic reimplementation and are not automatically portable.
