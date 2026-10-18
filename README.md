## Requirements
- Node.js 20+ and npm
- MongoDB 7+ running locally or a MongoDB Atlas connection string

## Setup
1. Copy `backend/.env.example` to `backend/.env`. Set `MONGODB_URI` and replace `JWT_SECRET` with a long random secret. Add Razorpay credentials only for a properly configured test account.
2. In a terminal: `cd backend && npm install && npm run dev`
3. In a second terminal: `cd frontend && npm install && npm run dev`
4. Open `http://localhost:5173`.
