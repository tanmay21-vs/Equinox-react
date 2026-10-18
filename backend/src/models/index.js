import crypto from 'node:crypto';
import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const options = { timestamps: true, strict: false };
const uuid = () => crypto.randomUUID();

const userSchema = new Schema({
  _id: { type: String, default: uuid },
  full_name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  phone_number: { type: String, trim: true, sparse: true, unique: true },
  date_of_birth: { type: String, required: true },
  location_city: { type: String, trim: true, maxlength: 120 },
  trust_score: { type: Number, default: 50, min: 0, max: 100 },
  kyc_status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
}, options);

const walletSchema = new Schema({
  _id: { type: String, default: uuid },
  user_id: { type: String, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['DORMANT', 'ACTIVE', 'FROZEN'], default: 'DORMANT' },
  activated_at: Date,
  issued_card_count: { type: Number, default: 0, min: 0, max: 3 },
}, options);

const schemas = {
  Card: {
    user_id: { type: String, required: true }, wallet_id: { type: String, required: true },
    slot: { type: Number, min: 1, max: 3 }, card_number: { type: String, required: true, unique: true },
    card_name: String, expiry: String, cvv_hash: String,
    is_frozen: { type: Boolean, default: false }, status: String, issued_via_payment_order_id: String,
  },
  PaymentOrder: {
    user_id: { type: String, required: true }, purpose: { type: String, enum: ['WALLET_ACTIVATION', 'CARD_ISSUANCE'], required: true },
    amount: { type: Number, required: true, min: 0.01 }, currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['CREATED', 'PAID', 'FAILED', 'CANCELLED'], default: 'CREATED' },
    provider_order_id: { type: String, unique: true, sparse: true }, provider_payment_id: String, metadata: Schema.Types.Mixed,
  },
  Transaction: {
    sender_wallet: String, receiver_wallet: { type: String, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    transaction_type: { type: String, enum: ['P2P', 'DEPOSIT', 'POOL', 'CONTRACT', 'REFUND'], required: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'PENDING'], default: 'SUCCESS' },
    note: String, latitude: Number, longitude: Number, device_fingerprint: String,
  },
  Pool: {
    creator_id: String, title: { type: String, required: true, maxlength: 150 }, description: String,
    target_amount: { type: Number, required: true, min: 0.01 }, raised_amount: { type: Number, default: 0, min: 0 },
    deadline: { type: Date, required: true }, status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'], default: 'ACTIVE' }, verified: { type: Boolean, default: false },
  },
  Contribution: { pool_id: String, donor_wallet: String, amount: { type: Number, required: true, min: 0.01 } },
  Skill: { user_id: String, skill_name: { type: String, required: true, maxlength: 50 }, description: String, rate_per_hour: { type: Number, required: true, min: 1 }, is_active: { type: Boolean, default: true } },
  Contract: { provider_id: String, consumer_id: String, skill_id: String, hours: { type: Number, required: true, min: 1 }, total_eq: { type: Number, required: true, min: 0.01 }, status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED'], default: 'OPEN' } },
  Review: { reviewer_id: String, subject_id: String, contract_id: String, rating: { type: Number, required: true, min: 1, max: 5 }, comment: String },
  TrustScore: { user_id: { type: String, required: true, unique: true }, current_score: { type: Number, default: 50, min: 0, max: 100 }, total_sent: { type: Number, default: 0 }, total_received: { type: Number, default: 0 }, completed_contracts: { type: Number, default: 0 }, last_updated: { type: Date, default: Date.now } },
  TrustHistory: { user_id: String, score_delta: Number, reason: String },
  Notification: { user_id: String, title: String, message: String, is_read: { type: Boolean, default: false } },
  LoginHistory: { user_id: String, ip_address: String, user_agent: String, login_status: { type: String, default: 'SUCCESS' } },
  Setting: { user_id: String, settings: Schema.Types.Mixed },
  PaymentAudit: { payment_order_id: String, event_type: String, payload: Schema.Types.Mixed },
  KycDocument: { user_id: { type: String, required: true }, doc_type: { type: String, required: true }, doc_url: { type: String, required: true }, verified_at: Date },
};

export const User = mongoose.models.User || model('User', userSchema);
export const Wallet = mongoose.models.Wallet || model('Wallet', walletSchema);
export const models = {};
for (const [name, shape] of Object.entries(schemas)) {
  models[name] = mongoose.models[name] || model(name, new Schema({ _id: { type: String, default: uuid }, ...shape }, options));
}

models.Review.schema.index({ reviewer_id: 1, subject_id: 1, contract_id: 1 }, { unique: true, name: 'uniq_review_per_contract' });
models.Card.schema.index({ user_id: 1, slot: 1 }, { unique: true, name: 'uniq_card_slot_per_user', partialFilterExpression: { slot: { $type: 'number' } } });
models.PaymentOrder.schema.index({ user_id: 1, purpose: 1 }, { unique: true, name: 'uniq_open_activation_order', partialFilterExpression: { status: 'CREATED', purpose: 'WALLET_ACTIVATION' } });
models.PaymentOrder.schema.index({ user_id: 1, purpose: 1, 'metadata.reserved_card_slot': 1 }, { unique: true, name: 'uniq_reserved_card_slot', partialFilterExpression: { status: 'CREATED', purpose: 'CARD_ISSUANCE', 'metadata.reserved_card_slot': { $exists: true } } });
