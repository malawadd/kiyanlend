# KiyanLend 

A privacy-first peer-to-peer lending platform built with Next.js, Convex, and blockchain technology. Borrowers can create loan requests with encrypted financial data, while lenders can fund proposals and run AI-powered risk assessments.

## Features

- 🔐 **Privacy-First**: Secure financial document management
- 🤖 **AI Risk Assessment**: AI analysis of borrower creditworthiness  
- 💎 **Blockchain Integration**: Loan proposals published to Mantle Sepolia testnet
- 🔗 **Multi-Wallet Support**: Connect multiple wallets for identity verification
- 👤 **Humanity Verification**: Worldcoin integration for human verification
- 💰 **Direct P2P Funding**: Lenders fund proposals directly on-chain

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Convex (real-time database & serverless functions)
- **Blockchain**: Wagmi, RainbowKit, Viem (Mantle Sepolia testnet)
- **Identity**: Worldcoin for humanity verification

## Prerequisites

- Node.js 18+ and npm/yarn
- Git
- A Convex account (free at [convex.dev](https://convex.dev))
- Wallet browser extension (MetaMask, Rainbow, etc.)

## Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lendclient
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Convex**
   ```bash
   npx convex dev
   ```
   This will:
   - Create a new Convex project (if first time)
   - Generate authentication configuration
   - Start the Convex development server

4. **Create environment file**
   
   Create `.env.local` in the project root:
   ```env
   # Convex (auto-generated after running convex dev)
   NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
   
   # Worldcoin (optional - for humanity verification)
   NEXT_PUBLIC_WLD_APP_ID=your-worldcoin-app-id
   
   # Blockchain Configuration
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234...  # Deployed smart contract address
   NEXT_PUBLIC_ALCHEMY_ID=your-alchemy-id  # For RPC access
   ```

## Running Locally

1. **Start Convex development server** (if not already running)
   ```bash
   npx convex dev
   ```

2. **Start Next.js development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── borrow/            # Borrower interface
│   ├── lend/              # Lender marketplace
│   └── profile/           # User profile management
├── components/            # React components
│   ├── borrower/          # Borrower-specific components
│   ├── lender/            # Lender-specific components
│   └── ui/                # Reusable UI components
├── convex/                # Convex backend functions & schema
├── lib/                   # Utility functions & configurations
└── public/                # Static assets
```

## Core Functionality

### For Borrowers
1. **Create Account**: Connect wallet and verify humanity (optional)
2. **Upload Documents**: Secure financial document management
3. **Create Loan Request**: Specify amount, duration, and purpose
4. **Publish to Blockchain**: Make request visible to lenders on-chain
5. **Receive Funding**: Get funded directly by lenders

### For Lenders
1. **Browse Marketplace**: View active loan requests
2. **Run AI Assessment**: Analyze borrower data (costs 0.5 credits)
3. **Fund Proposals**: Send ETH directly to borrowers on-chain
4. **Track Investments**: Monitor funded loans and returns

## Smart Contract Integration

The platform uses smart contracts deployed on Mantle Sepolia testnet for:
- Publishing loan proposals on-chain
- Direct P2P funding without intermediaries
- Transparent transaction history

Contract functions:
- `createProposal(amount, dataId)`: Publish loan request
- `fundProposal(proposalId)`: Fund a loan proposal

## Development Notes

### Database Schema (Convex)
- `loanRequests`: Loan request data and metadata
- `wallets`: User connected wallets
- `assessments`: AI risk assessment results
- `users`: User profiles and credits

### Key Components
- `BlockchainPublish`: Publishes loans to smart contract
- `FundProposal`: Handles on-chain funding transactions
- `WalletManager`: Multi-wallet connection interface
- `SecretVaultManager`: Secure document management

## Troubleshooting

### Common Issues

1. **Convex connection issues**
   ```bash
   npx convex dev --reset
   ```

2. **Wallet connection problems**
   - Ensure you're on Mantle Sepolia testnet
   - Clear browser cache and reconnect wallet

3. **Transaction failures**
   - Check you have sufficient testnet ETH
   - Verify smart contract address in environment

4. **Build errors**
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   ```

