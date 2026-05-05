CypherCare
A decentralized health record management system that combines blockchain with off-chain storage (MongoDB + IPFS) to securely manage and share patient data.

Overview
CypherCare allows:
Patients to manage health records
Providers to upload/request access to records
Patients to grant/revoke access securely
Smart contracts to enforce permissions on-chain

Tech Stack
Frontend: React
Backend: Node.js, Express
Database: MongoDB
Blockchain: Sepolia Testnet
Smart Contracts: Solidity 
Storage: IPFS (Pinata)

⚙️ Setup Instructions
1. Clone the repo
git clone https://github.com/gofoche1/HealthRecordWallet
cd HealthRecordWallet


2. Install dependencies
Backend
cd health-records-backend
npm install

Frontend
cd ../frontend
npm install


3. Setup environment variables
Create a .env file inside
health-records-backend/

Add:
PORT=5000
MONGODB_URI=your_mongodb_connection_string
FILE_ENCRYPTION_KEY=your_generated_key
PINATA_JWT=your_pinata_jwt

Note: Environment variables are not included for security reasons. Please generate your own or request them from one of the teammembers


4. Run the backend
cd health-records-backend
npm run dev

You should see:
MongoDB connected
Server running on http://localhost:5000


5. Run the frontend
cd frontend
npm start

Open:
http://localhost:3000


Smart Contract
The smart contract is already on Sepolia:
0x47f341fc6dF7fEf42B6fC16Ac55d79De1f97ca76


CypherCare Features
Upload health records (stored via IPFS)
Request access (provider -> patient)
Grant/Revoke access (on chain)
View access history
Secure encryption for files

Notes
MetaMask must be connected to Sepolia
Backend must be running for API requests
Frontend uses http://localhost:5000 for API calls
MongoDB is used for request tracking and metadata


Team
Alazar Tekeba
Glorie Ofoche
Boluwatife Afariogun

Possible Future Improvements
Full on chain request system
Real-time notifications


