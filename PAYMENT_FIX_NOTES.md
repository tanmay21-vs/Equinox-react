# Payment and financial workflow notes

- Razorpay order amounts are server-defined: INR 1,500 for wallet activation and INR 1,500 per virtual card. The provider receives paise; the local payment order stores INR.
- Verification checks the HMAC signature, fetches the provider payment, verifies order ID/amount/currency/captured status, then fulfills in a MongoDB transaction.
- An already-paid order response is returned only after signature validation and only when the payment ID matches the persisted payment ID.
- Wallet activation adds 500 Eq, creates a `DEPOSIT` transaction, records an activation notification, and initializes the trust-score record in the same transaction.
- Card orders reserve one of three card slots while pending. Unique indexes are intended to prevent duplicate slot reservations and concurrent over-issuance; verify index creation and race behavior against a replica set before relying on this protection.
- Failed/dismissed checkout closes a still-`CREATED` local order so it no longer blocks a new activation order or reserves a card slot.
- UPI creates a `PENDING` intent only. It does not debit wallet balance, call a UPI provider, or verify an external transfer.
- Use Razorpay test credentials only during verification. No Razorpay sandbox checkout was executed for this archive.
- This implementation is not approved for real-money use. Payment webhooks/reconciliation, refunds for captured-but-unfulfilled orders, operational monitoring and full concurrency tests remain outside the verified scope.
