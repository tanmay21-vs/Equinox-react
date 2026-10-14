# Equinox Razorpay payment route fix

This update replaces the placeholder `503` Razorpay routes in `backend/src/server.js` with server-created Razorpay orders, signature verification, gateway payment fetch/status checks, audit events, and transactional fulfillment.

## Configuration

Set these in `backend/.env` (never in frontend files):

- `RAZORPAY_KEY_ID=rzp_test_...`
- `RAZORPAY_KEY_SECRET=...`
- `MONGODB_URI=...`
- `JWT_SECRET=...`
- `CLIENT_ORIGIN=http://localhost:5173`

Restart the backend after changing `.env`. Use Razorpay **test-mode** keys and test payment methods only until the complete workflow has been verified.

## Fulfillment behavior

- `WALLET_ACTIVATION`: creates an INR 1,500 order; after a valid signature and confirmed captured payment, activates the wallet and credits 500 Eq once.
- `CARD_ISSUANCE`: creates an INR 1,500 order; after a valid signature and confirmed captured payment, issues a virtual card, subject to active wallet and three-card limit.
- The backend checks payment order ownership, order ID, signature, amount, currency, and captured status before fulfillment.
- Payment records and audit events are persisted. Fulfillment is wrapped in a MongoDB transaction, so MongoDB must run as a replica set (MongoDB Atlas supports this).
- Direct UPI transfers remain explicitly unsupported; the route returns `501` and does not claim a transfer occurred.

## Local checks

From `backend`:

```powershell
npm install
npm run dev
```

Check `http://localhost:3001/api/health`. Its `razorpay_configured` field should be `true` (this only indicates non-empty variables; it does not validate them). Restart the backend after editing `.env`.

Then test using a dedicated test account and Razorpay test-mode credentials. Confirm the wallet balance/status or issued card in MongoDB after successful checkout. Do not manually edit balances or use live credentials during initial testing.

## Important limits

This update addresses the payment endpoints only. It is not a certification that every Equinox feature matches the PHP application. The virtual card is a simulated Equinox application record, not a bank-issued payment card. Test mode and all relevant failure/retry cases must be verified before any production use.
