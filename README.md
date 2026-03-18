# جسور - Jusoor Tutoring Marketplace

A full-stack tutoring marketplace platform connecting students with teachers.

## Tech Stack
- **Frontend:** React (Vite), TailwindCSS, Lucide React, React Router
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Auth:** JWT (JSON Web Tokens)

## Project Structure
```
HKCapp/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── api/         # Axios instance
│       ├── components/  # Layout, shared components
│       ├── context/     # Auth context
│       └── pages/       # Login, Register, Dashboard, Teachers, Offers, Wallet, Profile
├── server/          # Express backend
│   └── src/
│       ├── middleware/  # JWT auth middleware
│       ├── models/     # Mongoose models (User, Offer, Transaction)
│       └── routes/     # API routes (auth, users, offers, wallet)
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally on port 27017

### 1. Start MongoDB
```bash
mongod
```

### 2. Start Backend
```bash
cd server
npm install
npm run dev
```
Server runs on `http://localhost:5000`

### 3. Start Frontend
```bash
cd client
npm install
npm run dev
```
Frontend runs on `http://localhost:5173` and proxies API calls to the backend.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login with phone/password |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/users/profile` | Update profile |
| GET | `/api/users/teachers` | List teachers |
| POST | `/api/offers` | Create offer (student) |
| GET | `/api/offers` | Get user's offers |
| PUT | `/api/offers/:id/negotiate` | Counter-offer |
| PUT | `/api/offers/:id/accept` | Accept offer |
| PUT | `/api/offers/:id/reject` | Reject offer |
| POST | `/api/offers/:id/pay-fee` | Pay 15 SAR platform fee (teacher) |
| POST | `/api/wallet/deposit` | Deposit funds |
| GET | `/api/wallet/transactions` | Transaction history |

## Key Features
- Student/Teacher role-based registration
- Teacher browsing with subject/gender filters
- Offer creation and price negotiation
- Accept/Reject offers
- Platform fee (15 SAR) payment to unlock student contact info
- Wallet system with deposit and transaction history
- RTL Arabic UI
