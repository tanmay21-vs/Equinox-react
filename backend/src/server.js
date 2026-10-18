import 'dotenv/config';
import Razorpay from 'razorpay';
import express from 'express'; import cors from 'cors'; import bcrypt from 'bcryptjs'; import jwt from 'jsonwebtoken'; import mongoose from 'mongoose'; import crypto from 'node:crypto';
import {User,Wallet,models} from './models/index.js'; import {auth} from './middleware/auth.js';
const app=express(); app.use(cors({origin:process.env.CLIENT_ORIGIN||'http://localhost:5173'})); app.use(express.json({limit:'1mb'}));
const fail=(res,status,error)=>res.status(status).json({success:false,error}); const uid=()=>crypto.randomUUID();
<<<<<<< HEAD
const validMoney = value => Number.isFinite(value) && value > 0 && value <= 9999999999.99 && Math.abs(value * 100 - Math.round(value * 100)) < 1e-7;
const validDateOnly = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
app.get('/api/health',(_,res)=>res.json({success:true,message:'Equinox API is healthy',timestamp:new Date().toISOString(),razorpay_configured:Boolean(process.env.RAZORPAY_KEY_ID&&process.env.RAZORPAY_KEY_SECRET)}));
app.post('/api/register',async(req,res,next)=>{const session=await mongoose.startSession();try{const {full_name,email,password,date_of_birth,phone_number,location_city}=req.body||{};if(typeof full_name!=='string'||!full_name.trim()||full_name.trim().length>120||typeof email!=='string'||email.trim().length>190||typeof password!=='string'||!date_of_birth)return fail(res,422,'Please complete all required fields before creating the account.');const normalizedEmail=email.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(normalizedEmail))return fail(res,422,'Please enter a valid email address.');if(password.length<6||password.length>128)return fail(res,422,'Password must be between 6 and 128 characters long.');if(phone_number&&(typeof phone_number!=='string'||!/^\+?[0-9]{10,15}$/.test(phone_number)))return fail(res,422,'Please enter a valid phone number.');const birthTime=Date.parse(date_of_birth);if(!validDateOnly(date_of_birth)||Number.isNaN(birthTime)||birthTime>Date.now())return fail(res,422,'Please enter a valid date of birth that is not in the future.');if(await User.exists({email:normalizedEmail}))return fail(res,409,'This email address is already registered.');const userId=crypto.randomUUID();await session.withTransaction(async()=>{const [user]=await User.create([{_id:userId,full_name:full_name.trim(),email:normalizedEmail,password_hash:await bcrypt.hash(password,12),date_of_birth,phone_number:typeof phone_number==='string'?(phone_number.trim()||undefined):undefined,location_city:typeof location_city==='string'?location_city.trim():undefined}],{session});await Wallet.create([{_id:crypto.randomUUID(),user_id:user._id}],{session});await models.Setting.create([{user_id:user._id,settings:{}}],{session})});res.status(201).json({success:true,message:'Your Equinox citizen account has been created. Sign in to continue.'})}catch(e){next(e)}finally{await session.endSession()}});
app.post('/api/login',async(req,res,next)=>{try{const {email,password}=req.body||{};if(!email||!password)return fail(res,422,'Email and password are required.');const user=await User.findOne({email:String(email).trim().toLowerCase()});if(!user||!await bcrypt.compare(password,user.password_hash))return fail(res,401,'The email or password you entered is incorrect.');const token=jwt.sign({sub:String(user._id)},process.env.JWT_SECRET,{expiresIn:'12h'});await models.LoginHistory.create({user_id:user._id,ip_address:req.ip,user_agent:req.get('user-agent')||''});res.json({success:true,token,message:'Welcome back to Equinox.'})}catch(e){next(e)}});
app.use('/api',auth);

async function recalculateTrustScore(userId, session) {
  const user = await User.findById(userId).session(session);
  if (!user) return;
  const wallet = await Wallet.findOne({ user_id: userId }).session(session);
  const [sent, received, completed, reviews, previousRecord] = await Promise.all([
    wallet ? models.Transaction.countDocuments({ sender_wallet: wallet._id, status: 'SUCCESS' }).session(session) : 0,
    wallet ? models.Transaction.countDocuments({ receiver_wallet: wallet._id, status: 'SUCCESS' }).session(session) : 0,
    models.Contract.countDocuments({ $or: [{ provider_id: userId }, { consumer_id: userId }], status: 'COMPLETED' }).session(session),
    models.Review.find({ subject_id: userId }).session(session).lean(),
    models.TrustScore.findOne({ user_id: userId }).session(session),
  ]);
  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length : 3;
  const accountAgeDays = Math.max(0, Math.floor((Date.now() - new Date(user.createdAt || Date.now()).getTime()) / 86400000));
  const score = Math.max(0, Math.min(100, Math.round(Math.min(sent, 40) * 0.625 + Math.min(received, 40) * 0.375 + (averageRating / 5) * 35 + Math.min(completed, 10) * 1.5 + Math.min(accountAgeDays / 365, 1) * 10)));
  const previous = Number(previousRecord?.current_score ?? user.trust_score ?? 50);
  user.trust_score = score;
  await user.save({ session });
  await models.TrustScore.updateOne({ user_id: userId }, { $set: { current_score: score, total_sent: sent, total_received: received, completed_contracts: completed, last_updated: new Date() }, $setOnInsert: { user_id: userId } }, { upsert: true, session });
  await models.TrustHistory.create([{ _id: uid(), user_id: userId, score_delta: score - previous, reason: 'Trust score recalculated' }], { session });
}
app.get('/api/bootstrap', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub).lean();
    if (!user) return fail(res, 401, 'User account not found.');
    const wallet = await Wallet.findOne({ user_id: user._id }).lean();
    if (!wallet) return fail(res, 409, 'Wallet not found for this account.');
    const allWallets = await Wallet.find().lean();
    const walletByUser = new Map(allWallets.map(w => [String(w.user_id), String(w._id)]));
    const userIds = [...new Set(allWallets.map(w => String(w.user_id)))];
    const allUsers = await User.find({ _id: { $in: userIds } }).select('full_name trust_score location_city kyc_status').lean();
    const userById = new Map(allUsers.map(u => [String(u._id), u]));
    const userByWallet = new Map(allWallets.map(w => [String(w._id), userById.get(String(w.user_id))]).filter(([, u]) => Boolean(u)));
    const [rawTransactions, rawNotifications, rawTrustHistory, rawLoginHistory, rawCards, rawPayments, allSkills, rawContracts, rawPools, directory, contributions] = await Promise.all([
      models.Transaction.find({ $or: [{ sender_wallet: wallet?._id }, { receiver_wallet: wallet?._id }] }).sort({ createdAt: -1 }).limit(100).lean(),
      models.Notification.find({ user_id: user._id }).sort({ createdAt: -1 }).limit(50).lean(),
      models.TrustHistory.find({ user_id: user._id }).sort({ createdAt: -1 }).limit(50).lean(),
      models.LoginHistory.find({ user_id: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
      models.Card.find({ user_id: user._id }).sort({ createdAt: -1 }).lean(),
      models.PaymentOrder.find({ user_id: user._id }).sort({ createdAt: -1 }).limit(50).lean(),
      models.Skill.find().sort({ createdAt: -1 }).limit(500).lean(),
      models.Contract.find({ $or: [{ provider_id: user._id }, { consumer_id: user._id }] }).sort({ createdAt: -1 }).lean(),
      models.Pool.find().sort({ createdAt: -1 }).lean(),
      User.find({ _id: { $ne: user._id } }).select('full_name trust_score location_city kyc_status').limit(100).lean(),
      models.Contribution.aggregate([{ $group: { _id: '$pool_id', count: { $sum: 1 } } }]),
    ]);
    const skillById = new Map(allSkills.map(skill => [String(skill._id), skill]));
    const skillCounts = new Map();
    for (const skill of allSkills) if (skill.is_active) skillCounts.set(String(skill.user_id), (skillCounts.get(String(skill.user_id)) || 0) + 1);
    const contributionCounts = new Map(contributions.map(row => [String(row._id), Number(row.count)]));
    const profile = { ...user, user_id: String(user._id), wallet_id: wallet ? String(wallet._id) : null, balance: wallet?.balance || 0, status: wallet?.status || 'DORMANT', trust_score: user.trust_score ?? 50 };
    delete profile.password_hash;
    const transactions = rawTransactions.map(t => ({
      transaction_id: String(t._id), sender_wallet: t.sender_wallet || null, receiver_wallet: t.receiver_wallet,
      sender_name: t.sender_wallet ? (userByWallet.get(String(t.sender_wallet))?.full_name || 'Citizen') : 'System',
      receiver_name: userByWallet.get(String(t.receiver_wallet))?.full_name || 'Citizen',
      amount: t.amount, transaction_type: t.transaction_type, status: t.status, note: t.note || '',
      latitude: t.latitude, longitude: t.longitude, created_at: t.createdAt,
    }));
    const notifications = rawNotifications.map(n => ({ ...n, notification_id: String(n._id), body: n.message || '', created_at: n.createdAt }));
    const trust_history = rawTrustHistory.map(h => ({ ...h, log_id: String(h._id), created_at: h.createdAt }));
    const login_history = rawLoginHistory.map(h => ({ ...h, log_id: String(h._id), device_fingerprint: h.user_agent || 'Unknown device', login_status: h.login_status || 'SUCCESS', created_at: h.createdAt }));
    const cards = rawCards.map(c => ({
      card_id: String(c._id), card_name: c.card_name || 'Primary',
      masked_card_number: `•••• •••• •••• ${String(c.card_number || '').slice(-4)}`,
      expiry_date: c.expiry || '', is_frozen: Boolean(c.is_frozen), status: c.status || (c.is_frozen ? 'FROZEN' : 'ACTIVE'),
      created_at: c.createdAt, brand: String(c.card_number || '').replace(/\s/g, '').startsWith('4') ? 'VISA' : 'EQUINOX',
    }));
    const payments = rawPayments.map(p => ({
      payment_order_id: String(p._id), payment_purpose: p.purpose, amount_inr: Number(p.amount || 0), currency: p.currency || 'INR',
      payment_status: p.status === 'CREATED' ? 'PENDING' : p.status, fulfillment_status: p.status === 'PAID' ? 'COMPLETED' : 'PENDING',
      gateway_order_id: p.provider_order_id, gateway_payment_id: p.provider_payment_id || null,
      gateway_status: p.status === 'PAID' ? 'captured' : 'pending', receipt: p.metadata?.receipt || '',
      resource_reference: p.metadata?.card_id || p.metadata?.wallet_id || null, created_at: p.createdAt,
      metadata: { ...(p.metadata || {}), card_name: p.metadata?.requested_card_name || p.metadata?.card_name }, title: p.purpose === 'WALLET_ACTIVATION' ? 'Wallet Activation Fee' : 'Virtual Card Issuance Fee',
    }));
    const skills = allSkills.filter(s => s.is_active).map(skill => ({ ...skill, skill_id: String(skill._id), full_name: userById.get(String(skill.user_id))?.full_name || 'Equinox Citizen', created_at: skill.createdAt }));
    const contracts = rawContracts.map(c => ({
      ...c, contract_id: String(c._id), skill_name: skillById.get(String(c.skill_id))?.skill_name || 'Service',
      provider_name: userById.get(String(c.provider_id))?.full_name || 'Citizen', consumer_name: userById.get(String(c.consumer_id))?.full_name || 'Citizen', created_at: c.createdAt,
    }));
    const pools = rawPools.map(pool => ({
      ...pool, pool_id: String(pool._id), creator_name: userById.get(String(pool.creator_id))?.full_name || 'Citizen', created_at: pool.createdAt,
      progress_percent: pool.target_amount > 0 ? Math.min(100, Number(pool.raised_amount || 0) / Number(pool.target_amount) * 100) : 0,
      contribution_count: contributionCounts.get(String(pool._id)) || 0,
    }));
    const directoryWithWallets = directory.map(u => {
      const directoryWallet = allWallets.find(w => String(w.user_id) === String(u._id));
      return { ...u, user_id: String(u._id), wallet_id: walletByUser.get(String(u._id)) || null, wallet_status: directoryWallet?.status || 'DORMANT', skill_count: skillCounts.get(String(u._id)) || 0 };
    });
    res.json({ success: true, profile, insights: {
      account_age_days: Math.floor((Date.now() - new Date(user.createdAt || Date.now()).getTime()) / 86400000), card_count: cards.length, ledger_count: transactions.length,
      total_sent_eq: transactions.filter(t => t.status === 'SUCCESS' && String(t.sender_wallet) === String(wallet?._id)).reduce((a, t) => a + Number(t.amount || 0), 0),
      total_received_eq: transactions.filter(t => t.status === 'SUCCESS' && t.transaction_type !== 'POOL' && String(t.receiver_wallet) === String(wallet?._id)).reduce((a, t) => a + Number(t.amount || 0), 0),
    }, payment_config: { checkout_enabled: Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim()), key_id: process.env.RAZORPAY_KEY_ID || '', wallet_activation_fee_inr: 1500, card_issuance_fee_inr: 1500 }, transactions, notifications, trust_history, login_history, cards, payments, skills, contracts, pools, directory: directoryWithWallets,
      query_presets: [
        { id: 'trust_distribution', label: 'Trust score distribution', description: 'Count users grouped by current trust score.' },
        { id: 'user_activity', label: 'Transaction activity', description: 'Summarize transaction counts and totals by type.' },
        { id: 'pool_progress', label: 'Community pool progress', description: 'Show target, raised amount, and status for pools.' },
        { id: 'recent_transactions', label: 'Recent transactions', description: 'Display the latest 50 ledger entries.' },
      ],
    });
  } catch (e) { next(e); }
});
app.post('/api/wallet/transfer',async(req,res,next)=>{const session=await mongoose.startSession();try{const {wallet_id,amount,note,latitude,longitude,device_fingerprint,card_id}=req.body;const value=Number(amount);if(!wallet_id||!validMoney(value))return fail(res,422,'Enter a valid recipient wallet and a positive amount with no more than two decimal places.');let result;await session.withTransaction(async()=>{const sender=await Wallet.findOne({user_id:req.user.sub}).session(session);const receiver=await Wallet.findById(wallet_id).session(session);if(!sender||sender.status!=='ACTIVE')throw Object.assign(new Error('Activate your wallet before sending Eq.'),{status:409});if(card_id){const selectedCard=await models.Card.findOne({_id:card_id,user_id:req.user.sub}).session(session);if(!selectedCard)throw Object.assign(new Error('The selected card was not found for this account.'),{status:404});if(selectedCard.is_frozen||selectedCard.status!=='ACTIVE')throw Object.assign(new Error('The selected card is frozen or inactive.'),{status:409});}if(!receiver||String(receiver._id)===String(sender._id))throw Object.assign(new Error('Please enter a valid recipient wallet.'),{status:422});if(receiver.status!=='ACTIVE')throw Object.assign(new Error('The recipient wallet must be active to receive Eq.'),{status:409});if(sender.balance<value)throw Object.assign(new Error('Insufficient wallet balance.'),{status:409});sender.balance-=value;receiver.balance+=value;await sender.save({session});await receiver.save({session});await models.Transaction.create([{_id:crypto.randomUUID(),sender_wallet:sender._id,receiver_wallet:receiver._id,amount:value,transaction_type:'P2P',status:'SUCCESS',note,latitude,longitude,device_fingerprint}],{session});await models.Notification.create([{_id:uid(),user_id:receiver.user_id,title:'Eq Received',message:`${value} Eq has been received in your wallet.`,is_read:false}],{session});result={success:true,message:`Successfully transferred ${value} Eq.`}});res.json(result)}catch(e){fail(res,e.status||500,e.message||'Transfer failed.')}finally{await session.endSession()}});
app.post('/api/skills',async(req,res,next)=>{try{const {skill_name,description,rate_per_hour}=req.body;const rate=Number(rate_per_hour);if(!skill_name?.trim()||!Number.isFinite(rate)||rate<=0)return fail(res,422,'Enter a skill name and a positive hourly rate.');const doc=await models.Skill.create({_id:crypto.randomUUID(),user_id:req.user.sub,skill_name:skill_name.trim(),description,rate_per_hour:rate,is_active:true});res.status(201).json({success:true,message:'Your skill listing has been published.',skill:doc})}catch(e){next(e)}});
app.post('/api/pools',async(req,res,next)=>{try{const {title,description,target_amount,deadline}=req.body;const target=Number(target_amount);if(!title?.trim()||title.trim().length>150||!validMoney(target)||!deadline||Number.isNaN(Date.parse(deadline))||new Date(deadline)<=new Date())return fail(res,422,'Enter a pool title, positive target amount with at most two decimal places, and a future deadline.');const pool=await models.Pool.create({_id:crypto.randomUUID(),creator_id:req.user.sub,title:title.trim(),description,target_amount:target,deadline:new Date(deadline),status:'ACTIVE',raised_amount:0});res.status(201).json({success:true,message:'Community pool created successfully.',pool})}catch(e){next(e)}});
app.post('/api/pools/contribute',async(req,res,next)=>{const session=await mongoose.startSession();try{const amount=Number(req.body.amount);if(!req.body.pool_id||!validMoney(amount))return fail(res,422,'Enter a valid positive contribution amount with no more than two decimal places.');let payload;await session.withTransaction(async()=>{const wallet=await Wallet.findOne({user_id:req.user.sub}).session(session);const pool=await models.Pool.findById(req.body.pool_id).session(session);if(!wallet||wallet.status!=='ACTIVE')throw Object.assign(new Error('Activate your wallet before contributing.'),{status:409});if(!pool||pool.status!=='ACTIVE'||new Date(pool.deadline)<=new Date())throw Object.assign(new Error('This pool is no longer accepting contributions.'),{status:409});if(wallet.balance<amount)throw Object.assign(new Error('Insufficient wallet balance.'),{status:409});wallet.balance-=amount;pool.raised_amount+=amount;if(pool.raised_amount>=pool.target_amount)pool.status='COMPLETED';await wallet.save({session});await pool.save({session});await models.Contribution.create([{_id:crypto.randomUUID(),pool_id:pool._id,donor_wallet:wallet._id,amount}],{session});await models.Transaction.create([{_id:crypto.randomUUID(),sender_wallet:wallet._id,receiver_wallet:wallet._id,amount,transaction_type:'POOL',status:'SUCCESS',note:`Contribution to ${pool.title}`}],{session});await models.Notification.create([{_id:uid(),user_id:req.user.sub,title:'Pool Contribution Recorded',message:`${amount} Eq was recorded against the ${pool.title} community pool.`,is_read:false}],{session});payload={success:true,message:'Your contribution was recorded.',pool}});res.json(payload)}catch(e){fail(res,e.status||500,e.message||'Contribution failed.')}finally{await session.endSession()}});
app.post('/api/contracts',async(req,res,next)=>{try{const {skill_id,hours}=req.body;const h=Number(hours);const skill=await models.Skill.findById(skill_id);if(!skill||!skill.is_active)return fail(res,404,'This skill listing is unavailable.');if(!Number.isInteger(Number(skill.rate_per_hour))||Number(skill.rate_per_hour)<=0)return fail(res,409,'This skill listing has an invalid hourly rate.');if(String(skill.user_id)===String(req.user.sub))return fail(res,422,'You cannot create a contract with your own listing.');if(!Number.isInteger(h)||h<=0)return fail(res,422,'Enter a valid number of hours.');const contract=await models.Contract.create({_id:crypto.randomUUID(),provider_id:skill.user_id,consumer_id:req.user.sub,skill_id:skill._id,hours:h,total_eq:h*Number(skill.rate_per_hour),status:'OPEN'});res.status(201).json({success:true,message:'Service contract created.',contract})}catch(e){next(e)}});
app.post('/api/contracts/settle',async(req,res,next)=>{const session=await mongoose.startSession();try{const contractId=req.body?.contract_id;if(!contractId)return fail(res,422,'A contract ID is required.');await session.withTransaction(async()=>{const c=await models.Contract.findById(contractId).session(session);if(!c)throw Object.assign(new Error('Contract not found.'),{status:404});if(String(c.consumer_id)!==String(req.user.sub)&&String(c.provider_id)!==String(req.user.sub))throw Object.assign(new Error('You are not a party to this contract.'),{status:403});if(c.status==='COMPLETED')throw Object.assign(new Error('This contract has already been settled.'),{status:409});if(c.status!=='OPEN')throw Object.assign(new Error('This contract is not eligible for settlement.'),{status:409});const buyer=await Wallet.findOne({user_id:c.consumer_id}).session(session),seller=await Wallet.findOne({user_id:c.provider_id}).session(session);if(!buyer||!seller||buyer.status!=='ACTIVE'||seller.status!=='ACTIVE')throw Object.assign(new Error('Both parties must have active wallets.'),{status:409});if(!Number.isFinite(Number(c.total_eq))||Number(c.total_eq)<=0)throw Object.assign(new Error('The contract has an invalid settlement amount.'),{status:409});if(buyer.balance<c.total_eq)throw Object.assign(new Error('Insufficient balance to settle this contract.'),{status:409});buyer.balance-=c.total_eq;seller.balance+=c.total_eq;c.status='COMPLETED';await buyer.save({session});await seller.save({session});await c.save({session});await models.Transaction.create([{_id:crypto.randomUUID(),sender_wallet:buyer._id,receiver_wallet:seller._id,amount:c.total_eq,transaction_type:'CONTRACT',status:'SUCCESS',note:`Contract ${c._id}`}],{session});await models.Notification.create([{_id:uid(),user_id:c.provider_id,title:'Contract Settled',message:`${c.total_eq} Eq settled for completed service contract ${c._id}.`,is_read:false}],{session});await recalculateTrustScore(c.consumer_id,session);await recalculateTrustScore(c.provider_id,session)});res.json({success:true,message:'Contract settled successfully.'})}catch(e){if(e.status)return fail(res,e.status,e.message);next(e)}finally{await session.endSession()}});
app.post('/api/reviews',async(req,res,next)=>{const session=await mongoose.startSession();try{const {subject_id,contract_id,rating,comment}=req.body||{};const score=Number(rating);if(!subject_id||!Number.isInteger(score)||score<1||score>5)return fail(res,422,'Choose a rating between 1 and 5.');if(String(subject_id)===String(req.user.sub))return fail(res,422,'You cannot review your own account.');if(typeof comment==='string'&&comment.length>2000)return fail(res,422,'Review comments must be 2,000 characters or fewer.');if(!await User.exists({_id:subject_id}))return fail(res,404,'The user you are reviewing does not exist.');if(contract_id){const c=await models.Contract.findById(contract_id);if(!c||c.status!=='COMPLETED'||![String(c.consumer_id),String(c.provider_id)].includes(String(req.user.sub))||![String(c.consumer_id),String(c.provider_id)].includes(String(subject_id))||String(c.consumer_id)===String(c.provider_id))return fail(res,422,'Reviews must relate to a completed contract between the participants.')}if(await models.Review.exists({reviewer_id:req.user.sub,subject_id,contract_id:contract_id||null}))return fail(res,409,'You have already reviewed this user for this contract.');await session.withTransaction(async()=>{await models.Review.create([{_id:crypto.randomUUID(),reviewer_id:req.user.sub,subject_id,contract_id:contract_id||null,rating:score,comment:typeof comment==='string'?comment.trim():''}],{session});const user=await User.findById(subject_id).session(session);if(!user)throw Object.assign(new Error('The user you are reviewing does not exist.'),{status:404});const wallet=await Wallet.findOne({user_id:subject_id}).session(session);const [sent,received,completed,reviews]=await Promise.all([wallet?models.Transaction.countDocuments({sender_wallet:wallet._id,status:'SUCCESS'}).session(session):0,wallet?models.Transaction.countDocuments({receiver_wallet:wallet._id,status:'SUCCESS'}).session(session):0,models.Contract.countDocuments({$or:[{provider_id:subject_id},{consumer_id:subject_id}],status:'COMPLETED'}).session(session),models.Review.find({subject_id}).session(session).lean()]);const avg=reviews.length?reviews.reduce((sum,r)=>sum+Number(r.rating||0),0)/reviews.length:3;const days=Math.max(0,Math.floor((Date.now()-new Date(user.createdAt||Date.now()).getTime())/86400000));const trust=Math.max(0,Math.min(100,Math.round(Math.min(sent,40)*0.625+Math.min(received,40)*0.375+(avg/5)*35+Math.min(completed,10)*1.5+Math.min(days/365,1)*10)));const previousRecord=await models.TrustScore.findOne({user_id:subject_id}).session(session);const previous=Number(previousRecord?.current_score??user.trust_score??50);user.trust_score=trust;await user.save({session});await models.TrustScore.updateOne({user_id:subject_id},{$set:{current_score:trust,total_sent:sent,total_received:received,completed_contracts:completed,last_updated:new Date()},$setOnInsert:{user_id:subject_id}},{upsert:true,session});await models.TrustHistory.create([{_id:crypto.randomUUID(),user_id:subject_id,score_delta:trust-previous,reason:'Trust score recalculated from activity, completed contracts, account age, and reviews'}],{session})});res.status(201).json({success:true,message:'Review submitted and trust score recalculated.'})}catch(e){if(e?.code===11000)return fail(res,409,'You have already reviewed this user for this contract.');if(e.status)return fail(res,e.status,e.message);next(e)}finally{await session.endSession()}});
app.post('/api/cards/freeze',async(req,res,next)=>{try{const card=await models.Card.findOne({_id:req.body.card_id,user_id:req.user.sub});if(!card)return fail(res,404,'Card not found.');card.is_frozen=!card.is_frozen;card.status=card.is_frozen?'FROZEN':'ACTIVE';await card.save();res.json({success:true,message:card.is_frozen?'Card frozen successfully.':'Card unfrozen successfully.',card:{card_id:String(card._id),card_name:card.card_name,masked_card_number:`•••• •••• •••• ${String(card.card_number||'').slice(-4)}`,expiry_date:card.expiry,is_frozen:card.is_frozen,status:card.status}})}catch(e){next(e)}});
=======
app.get('/api/health',(_,res)=>res.json({success:true,message:'Equinox API is healthy',timestamp:new Date().toISOString(),razorpay_configured:Boolean(process.env.RAZORPAY_KEY_ID&&process.env.RAZORPAY_KEY_SECRET)}));
app.post('/api/register',async(req,res,next)=>{try{const {full_name,email,password,date_of_birth,phone_number,location_city}=req.body;if(!full_name?.trim()||!email||!password||!date_of_birth)return fail(res,422,'Please complete all required fields before creating the account.');if(!/^\S+@\S+\.\S+$/.test(email))return fail(res,422,'Please enter a valid email address.');if(password.length<6)return fail(res,422,'Password must be at least 6 characters long.');if(phone_number&&!/^\+?[0-9]{10,15}$/.test(phone_number))return fail(res,422,'Please enter a valid phone number.');if(Number.isNaN(Date.parse(date_of_birth)))return fail(res,422,'Please enter a valid date of birth.');if(await User.exists({email:email.toLowerCase()}))return fail(res,409,'This email address is already registered.');const user=await User.create({_id:crypto.randomUUID(),full_name,email,password_hash:await bcrypt.hash(password,12),date_of_birth,phone_number,location_city});await Wallet.create({_id:crypto.randomUUID(),user_id:user._id});await models.Setting.create({user_id:user._id,settings:{}});res.status(201).json({success:true,message:'Your Equinox citizen account has been created. Sign in to continue.'})}catch(e){next(e)}});
app.post('/api/login',async(req,res,next)=>{try{const {email,password}=req.body;if(!email||!password)return fail(res,422,'Email and password are required.');const user=await User.findOne({email:email.toLowerCase()});if(!user||!await bcrypt.compare(password,user.password_hash))return fail(res,401,'The email or password you entered is incorrect.');const token=jwt.sign({sub:String(user._id)},process.env.JWT_SECRET,{expiresIn:'12h'});await models.LoginHistory.create({user_id:user._id,ip_address:req.ip,user_agent:req.get('user-agent')||''});res.json({success:true,token,message:'Welcome back to Equinox.'})}catch(e){next(e)}});
app.use('/api',auth);
app.get('/api/bootstrap',async(req,res,next)=>{try{const user=await User.findById(req.user.sub).lean();if(!user)return fail(res,401,'User account not found.');const wallet=await Wallet.findOne({user_id:user._id}).lean();const otherWallets=await Wallet.find().lean();const walletMap=new Map(otherWallets.map(w=>[String(w.user_id),String(w._id)]));const [transactions,notifications,trust_history,login_history,cards,payments,skills,contracts,pools,directory]=await Promise.all([models.Transaction.find({$or:[{sender_wallet:wallet?._id},{receiver_wallet:wallet?._id}]}).sort({createdAt:-1}).limit(100).lean(),models.Notification.find({user_id:user._id}).sort({createdAt:-1}).limit(50).lean(),models.TrustHistory.find({user_id:user._id}).sort({createdAt:-1}).limit(50).lean(),models.LoginHistory.find({user_id:user._id}).sort({createdAt:-1}).limit(20).lean(),models.Card.find({user_id:user._id}).sort({createdAt:-1}).lean(),models.PaymentOrder.find({user_id:user._id}).sort({createdAt:-1}).limit(50).lean(),models.Skill.find({is_active:true}).sort({createdAt:-1}).limit(100).lean(),models.Contract.find({$or:[{provider_id:user._id},{consumer_id:user._id}]}).sort({createdAt:-1}).lean(),models.Pool.find({status:'ACTIVE'}).sort({createdAt:-1}).lean(),User.find({_id:{$ne:user._id}}).select('full_name trust_score location_city').limit(100).lean()]);const profile={...user,user_id:String(user._id),wallet_id:wallet?String(wallet._id):null,balance:wallet?.balance||0,status:wallet?.status||'DORMANT',trust_score:user.trust_score||50};delete profile.password_hash;const directoryWithWallets=directory.map(u=>({...u,wallet_id:walletMap.get(String(u._id))||null}));res.json({success:true,profile,insights:{account_age_days:Math.floor((Date.now()-new Date(user.createdAt||Date.now()).getTime())/86400000),card_count:cards.length,ledger_count:transactions.length,total_sent_eq:transactions.filter(t=>String(t.sender_wallet)===String(wallet?._id)).reduce((a,t)=>a+Number(t.amount||0),0),total_received_eq:transactions.filter(t=>String(t.receiver_wallet)===String(wallet?._id)).reduce((a,t)=>a+Number(t.amount||0),0)},payment_config:{checkout_enabled:Boolean(process.env.RAZORPAY_KEY_ID&&process.env.RAZORPAY_KEY_SECRET),key_id:process.env.RAZORPAY_KEY_ID||''},transactions,notifications,trust_history,login_history,cards,payments,skills,contracts,pools,directory:directoryWithWallets,query_presets:[]})}catch(e){next(e)}});
app.post('/api/wallet/transfer',async(req,res,next)=>{const session=await mongoose.startSession();try{const {wallet_id,amount,note,latitude,longitude,device_fingerprint}=req.body;const value=Number(amount);if(!wallet_id||!Number.isFinite(value)||value<=0)return fail(res,422,'Enter a valid recipient wallet and a positive amount.');let result;await session.withTransaction(async()=>{const sender=await Wallet.findOne({user_id:req.user.sub}).session(session);const receiver=await Wallet.findById(wallet_id).session(session);if(!sender||sender.status!=='ACTIVE')throw Object.assign(new Error('Activate your wallet before sending Eq.'),{status:409});if(!receiver||String(receiver._id)===String(sender._id))throw Object.assign(new Error('Please enter a valid recipient wallet.'),{status:422});if(sender.balance<value)throw Object.assign(new Error('Insufficient wallet balance.'),{status:409});sender.balance-=value;receiver.balance+=value;await sender.save({session});await receiver.save({session});await models.Transaction.create([{_id:crypto.randomUUID(),sender_wallet:sender._id,receiver_wallet:receiver._id,amount:value,transaction_type:'P2P',status:'SUCCESS',note,latitude,longitude,device_fingerprint}],{session});result={success:true,message:`Successfully transferred ${value} Eq.`}});res.json(result)}catch(e){fail(res,e.status||500,e.message||'Transfer failed.')}finally{await session.endSession()}});
app.post('/api/skills',async(req,res,next)=>{try{const {skill_name,description,rate_per_hour}=req.body;const rate=Number(rate_per_hour);if(!skill_name?.trim()||!Number.isFinite(rate)||rate<=0)return fail(res,422,'Enter a skill name and a positive hourly rate.');const doc=await models.Skill.create({_id:crypto.randomUUID(),user_id:req.user.sub,skill_name:skill_name.trim(),description,rate_per_hour:rate,is_active:true});res.status(201).json({success:true,message:'Your skill listing has been published.',skill:doc})}catch(e){next(e)}});
app.post('/api/pools',async(req,res,next)=>{try{const {title,description,target_amount,deadline}=req.body;const target=Number(target_amount);if(!title?.trim()||!Number.isFinite(target)||target<=0||!deadline||Number.isNaN(Date.parse(deadline)))return fail(res,422,'Enter a pool title, valid target amount, and deadline.');const pool=await models.Pool.create({_id:crypto.randomUUID(),creator_id:req.user.sub,title:title.trim(),description,target_amount:target,deadline:new Date(deadline),status:'ACTIVE',raised_amount:0});res.status(201).json({success:true,message:'Community pool created successfully.',pool})}catch(e){next(e)}});
app.post('/api/pools/contribute',async(req,res,next)=>{const session=await mongoose.startSession();try{const amount=Number(req.body.amount);if(!req.body.pool_id||!Number.isFinite(amount)||amount<=0)return fail(res,422,'Enter a valid contribution amount.');let payload;await session.withTransaction(async()=>{const wallet=await Wallet.findOne({user_id:req.user.sub}).session(session);const pool=await models.Pool.findById(req.body.pool_id).session(session);if(!wallet||wallet.status!=='ACTIVE')throw Object.assign(new Error('Activate your wallet before contributing.'),{status:409});if(!pool||pool.status!=='ACTIVE'||new Date(pool.deadline)<new Date())throw Object.assign(new Error('This pool is no longer accepting contributions.'),{status:409});if(wallet.balance<amount)throw Object.assign(new Error('Insufficient wallet balance.'),{status:409});wallet.balance-=amount;pool.raised_amount+=amount;if(pool.raised_amount>=pool.target_amount)pool.status='COMPLETED';await wallet.save({session});await pool.save({session});await models.Contribution.create([{_id:crypto.randomUUID(),pool_id:pool._id,donor_wallet:wallet._id,amount}],{session});await models.Transaction.create([{_id:crypto.randomUUID(),sender_wallet:wallet._id,receiver_wallet:wallet._id,amount,transaction_type:'POOL',status:'SUCCESS',note:`Contribution to ${pool.title}`}],{session});payload={success:true,message:'Your contribution was recorded.',pool}});res.json(payload)}catch(e){fail(res,e.status||500,e.message||'Contribution failed.')}finally{await session.endSession()}});
app.post('/api/contracts',async(req,res,next)=>{try{const {skill_id,hours}=req.body;const h=Number(hours);const skill=await models.Skill.findById(skill_id);if(!skill||!skill.is_active)return fail(res,404,'This skill listing is unavailable.');if(String(skill.user_id)===String(req.user.sub))return fail(res,422,'You cannot create a contract with your own listing.');if(!Number.isInteger(h)||h<=0)return fail(res,422,'Enter a valid number of hours.');const contract=await models.Contract.create({_id:crypto.randomUUID(),provider_id:skill.user_id,consumer_id:req.user.sub,skill_id:skill._id,hours:h,total_eq:h*Number(skill.rate_per_hour),status:'OPEN'});res.status(201).json({success:true,message:'Service contract created.',contract})}catch(e){next(e)}});
app.post('/api/contracts/settle',async(req,res,next)=>{try{const c=await models.Contract.findById(req.body.contract_id);if(!c)return fail(res,404,'Contract not found.');if(String(c.consumer_id)!==String(req.user.sub)&&String(c.provider_id)!==String(req.user.sub))return fail(res,403,'You are not a party to this contract.');if(c.status==='COMPLETED')return fail(res,409,'This contract has already been settled.');const session=await mongoose.startSession();try{await session.withTransaction(async()=>{const buyer=await Wallet.findOne({user_id:c.consumer_id}).session(session),seller=await Wallet.findOne({user_id:c.provider_id}).session(session);if(!buyer||!seller||buyer.status!=='ACTIVE'||seller.status!=='ACTIVE')throw Object.assign(new Error('Both parties must have active wallets.'),{status:409});if(buyer.balance<c.total_eq)throw Object.assign(new Error('Insufficient balance to settle this contract.'),{status:409});buyer.balance-=c.total_eq;seller.balance+=c.total_eq;c.status='COMPLETED';await buyer.save({session});await seller.save({session});await c.save({session});await models.Transaction.create([{_id:crypto.randomUUID(),sender_wallet:buyer._id,receiver_wallet:seller._id,amount:c.total_eq,transaction_type:'CONTRACT',status:'SUCCESS',note:`Contract ${c._id}`}],{session})})}finally{await session.endSession()}res.json({success:true,message:'Contract settled successfully.'})}catch(e){fail(res,e.status||500,e.message||'Contract settlement failed.')}});
app.post('/api/reviews',async(req,res,next)=>{try{const {subject_id,contract_id,rating,comment}=req.body;const score=Number(rating);if(!subject_id||!Number.isInteger(score)||score<1||score>5)return fail(res,422,'Choose a rating between 1 and 5.');if(String(subject_id)===String(req.user.sub))return fail(res,422,'You cannot review your own account.');if(contract_id){const c=await models.Contract.findById(contract_id);if(!c||c.status!=='COMPLETED'||![String(c.consumer_id),String(c.provider_id)].includes(String(req.user.sub))||![String(c.consumer_id),String(c.provider_id)].includes(String(subject_id)))return fail(res,422,'Reviews must relate to a completed contract between the participants.')}if(await models.Review.exists({reviewer_id:req.user.sub,subject_id,contract_id:contract_id||null}))return fail(res,409,'You have already reviewed this user for this contract.');await models.Review.create({_id:crypto.randomUUID(),reviewer_id:req.user.sub,subject_id,contract_id:contract_id||null,rating:score,comment});const reviews=await models.Review.find({subject_id});const trust=Math.max(0,Math.min(100,Math.round(50+(reviews.reduce((s,r)=>s+r.rating,0)/Math.max(1,reviews.length)-3)*12)));await User.findByIdAndUpdate(subject_id,{trust_score:trust});await models.TrustHistory.create({user_id:subject_id,score_delta:trust-50,reason:'Community review trust recalculation'});res.status(201).json({success:true,message:'Review submitted successfully.'})}catch(e){next(e)}});
app.post('/api/cards/freeze',async(req,res,next)=>{try{const card=await models.Card.findOne({_id:req.body.card_id,user_id:req.user.sub});if(!card)return fail(res,404,'Card not found.');card.is_frozen=!card.is_frozen;card.status=card.is_frozen?'FROZEN':'ACTIVE';await card.save();res.json({success:true,message:card.is_frozen?'Card frozen successfully.':'Card unfrozen successfully.',card})}catch(e){next(e)}});
>>>>>>> 442411461945c4ea333a647c24314f833484790b
// Razorpay checkout: server-created orders, signature verification, and idempotent fulfillment.
const razorpayConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
const razorpayClient = () => {
  if (!razorpayConfigured()) return null;
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID.trim(), key_secret: process.env.RAZORPAY_KEY_SECRET.trim() });
};
const PAYMENT_AMOUNTS_INR = Object.freeze({ WALLET_ACTIVATION: 150000, CARD_ISSUANCE: 150000 });

app.post('/api/payments/create-order', async (req, res, next) => {
  try {
    if (!razorpayConfigured()) return fail(res, 503, 'Checkout is unavailable because Razorpay credentials are not configured on the backend.');
    const { purpose } = req.body || {};
    if (!Object.hasOwn(PAYMENT_AMOUNTS_INR, purpose)) return fail(res, 422, 'Unsupported payment purpose.');
    const user = await User.findById(req.user.sub).lean();
    if (!user) return fail(res, 401, 'User account not found.');
    const wallet = await Wallet.findOne({ user_id: user._id });
    if (!wallet) return fail(res, 409, 'Wallet not found for this account.');
<<<<<<< HEAD
    if (wallet.status === 'FROZEN') return fail(res, 409, 'This wallet is frozen and cannot initiate payments. Contact support.');
    if (purpose === 'WALLET_ACTIVATION' && wallet.status === 'ACTIVE') return fail(res, 409, 'This wallet is already active.');
    let reservedCardSlot = null;
    if (purpose === 'CARD_ISSUANCE') {
      if (wallet.status !== 'ACTIVE') return fail(res, 409, 'Activate the wallet before requesting a virtual card.');
      const [existingCards, pendingOrders] = await Promise.all([
        models.Card.find({ user_id: user._id }).select('slot').lean(),
        models.PaymentOrder.find({ user_id: user._id, purpose: 'CARD_ISSUANCE', status: 'CREATED' }).select('metadata.reserved_card_slot').lean(),
      ]);
      if (existingCards.length + pendingOrders.length >= 3) return fail(res, 409, 'This wallet has reached the three-card limit or has three card orders pending.');
      const usedSlots = new Set([...existingCards.map(card => Number(card.slot)), ...pendingOrders.map(order => Number(order.metadata?.reserved_card_slot))].filter(slot => Number.isInteger(slot) && slot >= 1 && slot <= 3));
      reservedCardSlot = [1, 2, 3].find(slot => !usedSlots.has(slot));
      if (!reservedCardSlot) return fail(res, 409, 'No virtual card slot is available.');
    }
    if (purpose === 'WALLET_ACTIVATION') {
      const pendingActivation = await models.PaymentOrder.exists({ user_id: user._id, purpose: 'WALLET_ACTIVATION', status: 'CREATED' });
      if (pendingActivation) return fail(res, 409, 'A wallet activation payment is already pending for this account.');
=======
    if (purpose === 'WALLET_ACTIVATION' && wallet.status === 'ACTIVE') return fail(res, 409, 'This wallet is already active.');
    if (purpose === 'CARD_ISSUANCE') {
      if (wallet.status !== 'ACTIVE') return fail(res, 409, 'Activate the wallet before requesting a virtual card.');
      const cardCount = await models.Card.countDocuments({ user_id: user._id });
      if (cardCount >= 3) return fail(res, 409, 'This wallet has reached the three-card limit.');
>>>>>>> 442411461945c4ea333a647c24314f833484790b
    }
    const amount = PAYMENT_AMOUNTS_INR[purpose];
    const receipt = `eq_${crypto.randomUUID().replaceAll('-', '').slice(0, 32)}`;
    const order = await razorpayClient().orders.create({ amount, currency: 'INR', receipt, notes: { user_id: String(user._id), purpose } });
    const paymentOrder = await models.PaymentOrder.create({
      _id: crypto.randomUUID(), user_id: String(user._id), purpose, amount: amount / 100, currency: 'INR',
      status: 'CREATED', provider_order_id: order.id,
<<<<<<< HEAD
      metadata: { wallet_id: String(wallet._id), receipt, requested_card_name: String(req.body.card_name || req.body.cardName || user.full_name).slice(0, 30), ...(reservedCardSlot ? { reserved_card_slot: reservedCardSlot } : {}) }
=======
      metadata: { wallet_id: String(wallet._id), receipt, requested_card_name: String(req.body.card_name || req.body.cardName || user.full_name).slice(0, 80) }
>>>>>>> 442411461945c4ea333a647c24314f833484790b
    });
    await models.PaymentAudit.create({ payment_order_id: paymentOrder._id, event_type: 'ORDER_CREATED', payload: { provider_order_id: order.id, purpose, amount: order.amount, currency: order.currency } });
    return res.status(201).json({
      success: true,
      payment_order: { payment_order_id: String(paymentOrder._id), provider_order_id: order.id, amount: amount / 100, currency: 'INR' },
      checkout: { key: process.env.RAZORPAY_KEY_ID.trim(), order_id: order.id, amount: order.amount, currency: order.currency, name: 'Equinox', description: purpose === 'WALLET_ACTIVATION' ? 'Wallet Activation Fee' : 'Virtual Card Issuance Fee', prefill: { name: user.full_name, email: user.email } }
    });
  } catch (e) {
    console.error('Razorpay order creation failed:', e?.error?.description || e.message);
    return fail(res, 502, e?.error?.description || 'Razorpay could not create the payment order. Check the backend configuration and Razorpay dashboard.');
  }
});

app.post('/api/payments/verify', async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    if (!razorpayConfigured()) return fail(res, 503, 'Checkout is unavailable because Razorpay credentials are not configured on the backend.');
    const { payment_order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!payment_order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return fail(res, 422, 'Payment verification fields are incomplete.');
    const paymentOrder = await models.PaymentOrder.findOne({ _id: payment_order_id, user_id: String(req.user.sub) });
    if (!paymentOrder) return fail(res, 404, 'Payment order not found for this account.');
    if (paymentOrder.provider_order_id !== razorpay_order_id) return fail(res, 422, 'The payment order does not match this checkout.');
<<<<<<< HEAD
=======
    if (paymentOrder.status === 'PAID') return res.json({ success: true, message: 'This payment has already been verified and fulfilled.', already_fulfilled: true });
>>>>>>> 442411461945c4ea333a647c24314f833484790b
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET.trim()).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest();
    let supplied;
    try { supplied = Buffer.from(razorpay_signature, 'hex'); } catch { supplied = Buffer.alloc(0); }
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
      await models.PaymentAudit.create({ payment_order_id: paymentOrder._id, event_type: 'SIGNATURE_REJECTED', payload: { provider_order_id: razorpay_order_id, provider_payment_id: razorpay_payment_id } });
      return fail(res, 400, 'Razorpay payment signature verification failed. No wallet or card was issued.');
    }
<<<<<<< HEAD
    if (paymentOrder.status === 'PAID') {
      if (paymentOrder.provider_payment_id !== razorpay_payment_id) return fail(res, 409, 'This payment order has already been fulfilled using a different payment.');
      return res.json({ success: true, message: 'This payment has already been verified and fulfilled.', already_fulfilled: true });
    }
=======
>>>>>>> 442411461945c4ea333a647c24314f833484790b
    const gatewayPayment = await razorpayClient().payments.fetch(razorpay_payment_id);
    if (gatewayPayment.order_id !== razorpay_order_id || Number(gatewayPayment.amount) !== Math.round(Number(paymentOrder.amount) * 100) || gatewayPayment.currency !== 'INR') return fail(res, 400, 'The payment details do not match the server-created order.');
    if (gatewayPayment.status !== 'captured') return fail(res, 409, `Payment is ${gatewayPayment.status}; fulfillment requires a captured payment.`);
    let fulfilledCard = null;
    await session.withTransaction(async () => {
      const current = await models.PaymentOrder.findOne({ _id: paymentOrder._id, user_id: String(req.user.sub) }).session(session);
      if (!current) throw Object.assign(new Error('Payment order not found.'), { status: 404 });
      if (current.status === 'PAID') return;
      if (current.status !== 'CREATED') throw Object.assign(new Error('This payment order is not eligible for fulfillment.'), { status: 409 });
      const wallet = await Wallet.findOne({ user_id: String(req.user.sub) }).session(session);
      if (!wallet) throw Object.assign(new Error('Wallet not found.'), { status: 409 });
      if (current.purpose === 'WALLET_ACTIVATION') {
<<<<<<< HEAD
        if (wallet.status === 'FROZEN') throw Object.assign(new Error('A frozen wallet cannot be activated.'), { status: 409 });
        if (wallet.status === 'ACTIVE') throw Object.assign(new Error('This wallet is already active; this payment order cannot be fulfilled twice.'), { status: 409 });
        if (wallet.status !== 'ACTIVE') { wallet.status = 'ACTIVE'; wallet.activated_at = new Date(); wallet.balance = Number(wallet.balance || 0) + 500; await wallet.save({ session }); await models.Transaction.create([{ _id: uid(), sender_wallet: null, receiver_wallet: wallet._id, amount: 500, transaction_type: 'DEPOSIT', status: 'SUCCESS', note: 'Onboarding payment successful. 500 Eq credited after wallet activation.' }], { session }); await models.Notification.create([{ _id: uid(), user_id: req.user.sub, title: 'Wallet Activated', message: 'Your wallet activation payment was fulfilled and 500 Eq has been credited.', is_read: false }], { session }); await models.TrustScore.updateOne({ user_id: req.user.sub }, { $setOnInsert: { user_id: req.user.sub, current_score: 50, total_sent: 0, total_received: 0, completed_contracts: 0, last_updated: new Date() } }, { upsert: true, session }); }
      } else if (current.purpose === 'CARD_ISSUANCE') {
        if (wallet.status !== 'ACTIVE') throw Object.assign(new Error('Activate the wallet before issuing a card.'), { status: 409 });
        const existingCards = await models.Card.find({ user_id: String(req.user.sub) }).select('slot').session(session).lean();
        if (existingCards.length >= 3) throw Object.assign(new Error('This wallet has reached the three-card limit.'), { status: 409 });
        const usedSlots = new Set(existingCards.map(card => Number(card.slot)).filter(slot => Number.isInteger(slot) && slot >= 1 && slot <= 3));
        const reservedSlot = Number(current.metadata?.reserved_card_slot);
        const slot = Number.isInteger(reservedSlot) && reservedSlot >= 1 && reservedSlot <= 3 && !usedSlots.has(reservedSlot) ? reservedSlot : [1, 2, 3].find(candidate => !usedSlots.has(candidate));
        if (!slot) throw Object.assign(new Error('This wallet has reached the three-card limit.'), { status: 409 });
        wallet.issued_card_count = existingCards.length + 1;
        await wallet.save({ session });
        const cardNumber = Array.from({ length: 4 }, () => String(crypto.randomInt(0, 10000)).padStart(4, '0')).join('');
        const cvv = String(crypto.randomInt(0, 1000)).padStart(3, '0');
        const now = new Date(); const expiry = `${String((now.getMonth() + 1)).padStart(2, '0')}/${String((now.getFullYear() + 5) % 100).padStart(2, '0')}`;
        const card = await models.Card.create([{ _id: crypto.randomUUID(), user_id: String(req.user.sub), wallet_id: String(wallet._id), slot, card_number: cardNumber, card_name: String(current.metadata?.requested_card_name || 'Equinox Citizen').slice(0, 30), expiry, cvv_hash: await bcrypt.hash(cvv, 12), is_frozen: false, status: 'ACTIVE', issued_via_payment_order_id: String(current._id) }], { session });
        fulfilledCard = { card_id: String(card[0]._id), _id: String(card[0]._id), card_number: card[0].card_number, masked_card_number: `•••• •••• •••• ${card[0].card_number.slice(-4)}`, card_name: card[0].card_name, expiry: card[0].expiry, expiry_date: card[0].expiry, cvv, status: card[0].status, is_frozen: false, brand: card[0].card_number.startsWith('4') ? 'VISA' : 'EQUINOX' };
=======
        if (wallet.status !== 'ACTIVE') { wallet.status = 'ACTIVE'; wallet.balance = Number(wallet.balance || 0) + 500; await wallet.save({ session }); }
      } else if (current.purpose === 'CARD_ISSUANCE') {
        if (wallet.status !== 'ACTIVE') throw Object.assign(new Error('Activate the wallet before issuing a card.'), { status: 409 });
        const count = await models.Card.countDocuments({ user_id: String(req.user.sub) }).session(session);
        if (count >= 3) throw Object.assign(new Error('This wallet has reached the three-card limit.'), { status: 409 });
        const cardNumber = Array.from({ length: 4 }, () => String(crypto.randomInt(0, 10000)).padStart(4, '0')).join('');
        const cvv = String(crypto.randomInt(0, 1000)).padStart(3, '0');
        const now = new Date(); const expiry = `${String((now.getMonth() + 1)).padStart(2, '0')}/${String((now.getFullYear() + 5) % 100).padStart(2, '0')}`;
        const card = await models.Card.create([{ _id: crypto.randomUUID(), user_id: String(req.user.sub), wallet_id: String(wallet._id), card_number: cardNumber, card_name: String(current.metadata?.requested_card_name || 'Equinox Citizen').slice(0, 80), expiry, cvv_hash: crypto.createHash('sha256').update(cvv).digest('hex'), is_frozen: false, status: 'ACTIVE', issued_via_payment_order_id: String(current._id) }], { session });
        fulfilledCard = { card_number: card[0].card_number, card_name: card[0].card_name, expiry: card[0].expiry, cvv, status: card[0].status, _id: card[0]._id };
>>>>>>> 442411461945c4ea333a647c24314f833484790b
      } else throw Object.assign(new Error('Unsupported payment purpose on this order.'), { status: 422 });
      current.status = 'PAID'; current.provider_payment_id = razorpay_payment_id;
      current.metadata = { ...(current.metadata || {}), captured_amount: gatewayPayment.amount, payment_method: gatewayPayment.method || null, verified_at: new Date().toISOString() };
      await current.save({ session });
      await models.PaymentAudit.create([{ payment_order_id: current._id, event_type: 'PAYMENT_VERIFIED_AND_FULFILLED', payload: { provider_order_id: razorpay_order_id, provider_payment_id: razorpay_payment_id, purpose: current.purpose } }], { session });
    });
    return res.json({ success: true, message: paymentOrder.purpose === 'WALLET_ACTIVATION' ? 'Wallet activated successfully. 500 Eq has been credited.' : 'Virtual card issued successfully.', ...(fulfilledCard ? { card: fulfilledCard } : {}) });
  } catch (e) {
    console.error('Razorpay verification/fulfillment failed:', e?.error?.description || e.message);
    return fail(res, e.status || 502, e.status ? e.message : (e?.error?.description || 'Payment verification or fulfillment failed. Contact support before retrying.'));
  } finally { await session.endSession(); }
});

<<<<<<< HEAD
app.post('/api/payments/abandon-order', async (req, res, next) => {
  try {
    const orderId = typeof req.body?.payment_order_id === 'string' ? req.body.payment_order_id : '';
    const outcome = req.body?.outcome === 'FAILED' ? 'FAILED' : 'CANCELLED';
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 250) : (outcome === 'FAILED' ? 'Checkout reported payment failure.' : 'Checkout was dismissed.');
    if (!orderId) return fail(res, 422, 'A payment order ID is required.');
    const order = await models.PaymentOrder.findOne({ _id: orderId, user_id: String(req.user.sub) });
    if (!order) return fail(res, 404, 'Payment order not found for this account.');
    if (order.status === 'PAID') return res.json({ success: true, status: 'PAID', message: 'The payment was already fulfilled.' });
    if (order.status !== 'CREATED') return res.json({ success: true, status: order.status, message: 'The payment order is already closed.' });
    const closed = await models.PaymentOrder.findOneAndUpdate(
      { _id: order._id, user_id: String(req.user.sub), status: 'CREATED' },
      { $set: { status: outcome, 'metadata.close_reason': reason, 'metadata.closed_at': new Date().toISOString() } },
      { new: true },
    );
    if (!closed) {
      const latest = await models.PaymentOrder.findById(order._id).lean();
      if (latest?.status === 'PAID') return res.json({ success: true, status: 'PAID', message: 'The payment was already fulfilled.' });
      return res.json({ success: true, status: latest?.status || 'CLOSED', message: 'The payment order is already closed.' });
    }
    await models.PaymentAudit.create({ _id: uid(), payment_order_id: closed._id, event_type: outcome === 'FAILED' ? 'CHECKOUT_FAILED' : 'CHECKOUT_CANCELLED', payload: { reason } });
    return res.json({ success: true, status: closed.status, message: 'The payment order was closed without fulfilling a wallet or card.' });
  } catch (e) { next(e); }
});

app.post('/api/payments/upi', async (req, res, next) => {
  try {
    const upiId = typeof req.body?.upi_id === 'string' ? req.body.upi_id.trim() : '';
    const amount = Number(req.body?.upi_amount);
    if (!/^.+@upi$/i.test(upiId)) return fail(res, 422, 'Enter a valid UPI ID ending in @upi.');
    if (!validMoney(amount)) return fail(res, 422, 'Enter a positive UPI amount with no more than two decimal places.');
    const wallet = await Wallet.findOne({ user_id: req.user.sub });
    if (!wallet) return fail(res, 409, 'Wallet not found for this account.');
    const transaction = await models.Transaction.create({ _id: uid(), sender_wallet: null, receiver_wallet: wallet._id, amount, transaction_type: 'P2P', status: 'PENDING', note: `UPI Payment initiated to: ${upiId}` });
    return res.status(201).json({ success: true, message: `UPI payment of Rs. ${amount.toFixed(2)} initiated to ${upiId}. Complete the payment in your UPI app. No wallet balance has been deducted or verified.`, transaction_id: String(transaction._id), upi_id: upiId, amount, status: 'PENDING' });
  } catch (e) { next(e); }
});
app.post('/api/query-demonstrator',async(req,res)=>{const presets={trust_distribution:{query:'GROUP BY trust_score (MongoDB aggregation preset)',run:()=>User.aggregate([{$group:{_id:'$trust_score',users:{$sum:1}}},{$sort:{_id:1}}])},user_activity:{query:'GROUP BY transaction_type (MongoDB aggregation preset)',run:()=>models.Transaction.aggregate([{$group:{_id:'$transaction_type',count:{$sum:1},total:{$sum:'$amount'}}},{$sort:{_id:1}}])},pool_progress:{query:'Community pool progress (MongoDB read-only preset)',run:()=>models.Pool.find().select('title target_amount raised_amount status').lean()},recent_transactions:{query:'Recent transactions (MongoDB read-only preset)',run:()=>models.Transaction.find().sort({createdAt:-1}).limit(50).lean()}};const key=String(req.body?.preset||'');if(!presets[key])return fail(res,422,'Only the available read-only preset queries can be executed in the MongoDB migration. Arbitrary SQL is not supported.');try{const rows=await presets[key].run();const columns=rows.length?Object.keys(rows[0]):(key==='trust_distribution'?['_id','users']:key==='user_activity'?['_id','count','total']:key==='pool_progress'?['_id','title','target_amount','raised_amount','status']:['_id','sender_wallet','receiver_wallet','amount','transaction_type','status','createdAt']);res.json({success:true,query:presets[key].query,columns,row_count:rows.length,executed_at:new Date().toISOString(),rows})}catch(e){console.error('Query preset failed:',e.message);fail(res,500,'The selected read-only query could not be completed.')}});
app.get('/api/stream', async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ user_id: req.user.sub }).lean();
    if (!wallet) return fail(res, 404, 'Wallet not found for this account.');
    const [unreadCount, latestNotification, paymentStats] = await Promise.all([
      models.Notification.countDocuments({ user_id: req.user.sub, is_read: false }),
      models.Notification.findOne({ user_id: req.user.sub }).sort({ createdAt: -1 }).select('createdAt').lean(),
      models.PaymentOrder.aggregate([{ $match: { user_id: String(req.user.sub) } }, { $group: { _id: null, total_payment_orders: { $sum: 1 }, latest_payment: { $max: '$createdAt' } } }]),
    ]);
    const stats = paymentStats[0] || { total_payment_orders: 0, latest_payment: null };
    return res.json({ success: true, wallet: { balance: wallet.balance, status: wallet.status, updated_at: wallet.updatedAt }, notifications: { unread_count: unreadCount, latest_notification: latestNotification?.createdAt || null }, payments: { total_payment_orders: stats.total_payment_orders, latest_payment: stats.latest_payment }, server_time: new Date().toISOString() });
  } catch (e) { next(e); }
});
app.use((err,req,res,next)=>{console.error(err);if(err?.code===11000)return fail(res,409,'A record with that unique value already exists.');res.status(500).json({success:false,error:process.env.NODE_ENV==='production'?'An unexpected server error occurred.':err.message||'Internal server error.'})});
const port=Number(process.env.PORT||3001);
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET === 'replace_with_a_long_random_secret') { console.error('JWT_SECRET must be configured with a unique random value of at least 32 characters.'); process.exit(1); }
mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/equinox_dbms?replicaSet=rs0').then(()=>app.listen(port,()=>console.log(`Equinox API listening on http://localhost:${port}`))).catch(e=>{console.error('MongoDB connection failed:',e.message);process.exit(1)});
=======
app.post('/api/payments/upi', async (req, res) => fail(res, 501, 'Direct UPI transfers are not implemented. Use the configured Razorpay Checkout payment flow; no transfer was processed.'));
app.post('/api/query-demonstrator',async(req,res)=>{const presets={trust_distribution:()=>User.aggregate([{$group:{_id:'$trust_score',users:{$sum:1}}},{$sort:{_id:1}}]),user_activity:()=>models.Transaction.aggregate([{$group:{_id:'$transaction_type',count:{$sum:1},total:{$sum:'$amount'}}}]),pool_progress:()=>models.Pool.find().select('title target_amount raised_amount status').lean(),recent_transactions:()=>models.Transaction.find().sort({createdAt:-1}).limit(50).lean()};const key=String(req.body.preset||'');if(!presets[key])return fail(res,422,'Only the available read-only preset queries can be executed in the MongoDB migration.');try{const rows=await presets[key]();res.json({success:true,columns:rows.length?Object.keys(rows[0]):[],rows})}catch(e){fail(res,500,e.message)}});
app.get('/api/stream',(req,res)=>{res.setHeader('Content-Type','text/event-stream');res.setHeader('Cache-Control','no-cache');res.write(`data: ${JSON.stringify({type:'connected',timestamp:new Date().toISOString()})}\n\n`);const timer=setInterval(()=>res.write(`data: ${JSON.stringify({type:'heartbeat',timestamp:new Date().toISOString()})}\n\n`),12000);req.on('close',()=>clearInterval(timer))});
app.use((err,req,res,next)=>{console.error(err);if(err?.code===11000)return fail(res,409,'A record with that unique value already exists.');res.status(500).json({success:false,error:process.env.NODE_ENV==='production'?'An unexpected server error occurred.':err.message||'Internal server error.'})});
const port=Number(process.env.PORT||3001); mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/equinox_dbms').then(()=>app.listen(port,()=>console.log(`Equinox API listening on http://localhost:${port}`))).catch(e=>{console.error('MongoDB connection failed:',e.message);process.exit(1)});
>>>>>>> 442411461945c4ea333a647c24314f833484790b
