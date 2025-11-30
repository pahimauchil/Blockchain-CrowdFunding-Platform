# 🚀 FundAid - Blockchain Crowdfunding Platform

A decentralized crowdfunding platform where creators launch campaigns, donors contribute via blockchain, and admins moderate content. **React** + **Node.js** + **MongoDB** + **Solidity**.

---

## 📋 Quick Navigation
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment Setup](#environment-setup)
- [Running](#running)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [Smart Contract](#smart-contract)
- [Contributing](#contributing)

---

## ✨ Features

### Donors
- Browse campaigns without wallet connection
- Connect MetaMask wallet
- Donate to campaigns securely (on-chain)
- View campaign progress and donor list

### Creators
- Submit campaigns for admin review
- Receive AI trust score analysis
- Post updates to campaigns
- Track donations in real-time

### Admins
- Review and approve/reject pending campaigns
- View analytics dashboard
- Monitor user activity
- Manage platform statistics

### All Users
- Dark mode support
- Responsive design (mobile-friendly)
- Secure JWT authentication
- AI-powered campaign analysis

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose |
| **Blockchain** | Solidity, ThirdWeb, Sepolia Testnet |
| **Auth** | JWT + MetaMask Web3 |
| **AI Analysis** | Groq API (+ rule-based fallback) |

---

## 📋 Prerequisites

**Install on your system:**
- Node.js v16+ ([Download](https://nodejs.org/))
- npm v7+ (comes with Node.js)
- Git ([Download](https://git-scm.com/))
- MongoDB ([Local](https://www.mongodb.com/try/download/community) or [Atlas Cloud](https://www.mongodb.com/cloud/atlas))

**Accounts & Wallets:**
- MetaMask wallet ([Install](https://metamask.io/))
- ThirdWeb account + Client ID ([Get here](https://thirdweb.com/dashboard/settings/api-keys))
- Sepolia testnet ETH ([Get from faucet](https://www.sepoliafaucet.com/))

**Optional:**
- Groq API key ([Get here](https://console.groq.com/keys)) for AI analysis

---

## 📦 Setup

### 1. Clone Repository
```bash
git clone https://github.com/pahimauchil/Blockchain-CrowdFunding-Platform.git
cd crowdfunding
```

### 2. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd ../client
npm install
```

**Web3:**
```bash
cd ../web3
npm install
```

---

## 🔐 Environment Setup

Create `.env` files in each directory:

### `server/.env`
```env
PORT=5000
NODE_ENV=development

# MongoDB - Use MongoDB Atlas or local
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crowdfunding?retryWrites=true&w=majority
# Or locally: mongodb://localhost:27017/crowdfunding

# Any random string for JWT
JWT_SECRET=any_random_secret_string

# Optional: Groq API Key (if not set, uses rule-based AI analysis)
GROQ_API_KEY=your_groq_api_key_here
```

**Getting MongoDB URI:**
- **Cloud (Recommended):** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) → Create account → Cluster → Connect → Copy connection string
- **Local:** Default is `mongodb://localhost:27017/crowdfunding`

---

### `client/.env`
```env
# Get from: https://thirdweb.com/dashboard/settings/api-keys
VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here

# Backend API URL
VITE_API_URL=http://localhost:5000/api
```

**Getting ThirdWeb Client ID:**
1. Go to [ThirdWeb Dashboard](https://thirdweb.com/dashboard)
2. Sign in with your wallet
3. Settings → API Keys
4. Create new API key
5. Copy the Client ID

---

## 🚀 Running

Open 3 terminal windows:

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```
Runs on: `http://localhost:5000`

**Terminal 2 - Frontend Application:**
```bash
cd client
npm run dev
```
Runs on: `http://localhost:5173`

**Terminal 3 - MongoDB (if using local):**
```bash
# Windows
mongod

# macOS/Linux
mongod --config /usr/local/etc/mongod.conf
```

**Then open browser:** `http://localhost:5173`

---

## 📁 Project Structure

```
crowdfunding/
├── client/                    # React Frontend (Vite)
│   ├── src/
│   │   ├── pages/            # Home, CreateCampaign, Profile, Admin pages
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # State management (Web3, Theme, Notifications)
│   │   ├── utils/            # Helper functions
│   │   ├── constants/        # API URLs, nav links
│   │   └── App.jsx           # Main app with routing
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── server/                    # Node.js + Express Backend
│   ├── server.js             # Express app entry point
│   ├── routes/               # auth.js, campaigns.js, admin.js
│   ├── models/               # Campaign, User, Donation schemas
│   ├── middleware/           # JWT authentication
│   ├── services/             # aiService.js (trust score analysis)
│   ├── config/               # db.js (MongoDB connection)
│   └── package.json
│
└── web3/                      # Solidity Smart Contracts
    ├── contracts/CrowdFunding.sol
    ├── hardhat.config.js
    ├── scripts/              # Deploy & verify scripts
    └── package.json
```

---

## 👥 User Roles

| Role | Permissions |
|------|------------|
| **Donor** | Browse, donate, view profiles (default user) |
| **Creator** | All donor + create campaigns, post updates |
| **Admin** | All creator + approve campaigns, view analytics, manage users |

---

## ⚙️ Smart Contract

**Address (Sepolia Testnet):** `0xAB12c29169F8C2d683C91A926c3808300946A32E`

**Main Functions:**
- `createCampaign()` - Creates campaign on blockchain
- `donateToCampaign()` - Send ETH to campaign (direct transfer to creator)
- `getCampaigns()` - Fetch all campaigns
- `getDonators()` - Get list of donors for a campaign

**Note:** Campaigns are stored in both smart contract (blockchain) AND MongoDB (metadata, approvals, updates).

---

## 🔗 Useful Links

- [Smart Contract (Sepolia)](https://sepolia.etherscan.io/address/0xAB12c29169F8C2d683C91A926c3808300946A32E)
- [React Docs](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Solidity Docs](https://docs.soliditylang.org/)
- [ThirdWeb SDK](https://docs.thirdweb.com/)
- [MetaMask Integration](https://docs.metamask.io/)

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'Add feature'`
4. Push: `git push origin feature/your-feature`
5. Open Pull Request

---

## 👥 Built with ❤️ by

- [Pahima R Uchil](https://github.com/pahimauchil)
- [Sanjana Shetty](https://github.com/thanvishettttyy) 
- [Udit Shetty](https://github.com/uditshettyy)
- [Thanvi Shetty](https://github.com/SanjanaShettyy)

*Questions? Open an issue on [GitHub](https://github.com/pahimauchil/Blockchain-CrowdFunding-Platform/issues)*

