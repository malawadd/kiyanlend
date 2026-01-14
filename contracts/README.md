
## 📋 Contract Overview

### KiyanLend.sol
Main lending contract for peer-to-peer loan management with multi-currency support.

### ServicePayment.sol  
Payment contract for purchasing AI analysis credits using MUSD tokens.

### MockERC20.sol
Testing token contract for development environments.

## 🏦 KiyanLend Contract

### State Variables
```solidity
IERC20 public constant MUSD = IERC20(0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503);
uint256 private _proposalCounter;

enum ProposalState { SeekingFunds, Active, Completed, Defaulted }
enum Currency { NATIVE, MUSD }

struct Proposal {
    uint256 id;
    address payable entrepreneur;
    address investor;
    uint256 capitalAmount;
    ProposalState state;
    string nillionDataId;
    Currency currency;
}

mapping(uint256 => Proposal) public proposals;
```

### Functions

#### `createProposal(uint256 _capitalAmount, string memory _nillionDataId, Currency _currency)`
Creates a new loan proposal.

**Parameters:**
- `_capitalAmount`: Amount of capital requested (in wei for BTC, in token units for MUSD)
- `_nillionDataId`: Identifier for encrypted financial documents stored on Nillion
- `_currency`: 0 for NATIVE (BTC), 1 for MUSD

**Requirements:**
- Capital amount must be greater than 0

**Events:** Emits `ProposalCreated`

**Usage Example:**
```solidity
// Create BTC loan proposal for 1 BTC
kiyanLend.createProposal(
    1 BTCer, 
    "nillion-data-id-123", 
    0 // Currency.NATIVE
);

// Create MUSD loan proposal for 1000 MUSD
kiyanLend.createProposal(
    1000 * 10**18, 
    "nillion-data-id-456", 
    1 // Currency.MUSD
);
```

#### `fundProposal(uint256 _proposalId)` payable
Funds a loan proposal as an investor.

**Parameters:**
- `_proposalId`: ID of the proposal to fund

**Requirements:**
- Proposal must be in SeekingFunds state
- Caller cannot be the proposal creator
- For BTC proposals: msg.value must equal capitalAmount
- For MUSD proposals: msg.value must be 0, requires prior token approval

**Events:** Emits `ProposalFunded`

**Usage Example:**
```solidity
// Fund BTC proposal
kiyanLend.fundProposal{value: 1 BTCer}(1);

// Fund MUSD proposal (requires prior approval)
musdToken.approve(kiyanLendAddress, 1000 * 10**18);
kiyanLend.fundProposal(2);
```

#### `completeProposal(uint256 _proposalId)` payable
Completes BTC loan repayment.

**Parameters:**
- `_proposalId`: ID of the proposal to complete

**Requirements:**
- Only proposal creator can call
- Proposal must be in Active state
- Must be BTC proposal (Currency.NATIVE)
- msg.value must be >= capitalAmount

**Events:** Emits `ProposalCompleted`

**Usage Example:**
```solidity
// Repay 1 BTC loan with 10% interest
kiyanLend.completeProposal{value: 1.1 BTCer}(1);
```

#### `completeProposalWithMusd(uint256 _proposalId, uint256 _payAmount)`
Completes MUSD loan repayment.

**Parameters:**
- `_proposalId`: ID of the proposal to complete
- `_payAmount`: Amount of MUSD to repay

**Requirements:**
- Only proposal creator can call
- Proposal must be in Active state
- Must be MUSD proposal (Currency.MUSD)
- _payAmount must be >= capitalAmount
- Requires prior token approval

**Events:** Emits `ProposalCompleted`

**Usage Example:**
```solidity
// Repay 1000 MUSD loan with 12% interest
uint256 repayAmount = 1120 * 10**18;
musdToken.approve(kiyanLendAddress, repayAmount);
kiyanLend.completeProposalWithMusd(2, repayAmount);
```

#### `nextProposalId()` view returns (uint256)
Returns the ID that will be assigned to the next proposal.

### Events

```solidity
event ProposalCreated(
    uint256 indexed id,
    address indexed entrepreneur,
    uint256 capitalAmount,
    string nillionDataId,
    Currency currency
);

event ProposalFunded(
    uint256 indexed id,
    address indexed investor,
    uint256 capitalAmount,
    Currency currency
);

event ProposalCompleted(
    uint256 indexed id,
    address entrepreneur,
    address investor,
    uint256 payAmount,
    Currency currency
);

event ProposalDefaulted(uint256 indexed id, address indexed entrepreneur);
```

## 💳 ServicePayment Contract

### State Variables
```solidity
IERC20 public immutable musdToken;
uint8 public immutable tokenDecimals;
address public owner;

uint256 public constant MIN_POINTS = 10;
uint256 public constant MAX_POINTS = 1000;
uint256 public immutable PRICE_PER_POINT; // 0.3 * 10**decimals
```

### Functions

#### `makePayment(uint256 points)`
Purchases AI analysis points using MUSD tokens.

**Parameters:**
- `points`: Number of points to purchase (10-1000, must be divisible by 10)

**Requirements:**
- Points must be between MIN_POINTS and MAX_POINTS
- Points must be divisible by 10
- User must have approved sufficient MUSD tokens

**Events:** Emits `PaymentReceived`

**Usage Example:**
```solidity
// Purchase 100 points for 30 MUSD
uint256 cost = servicePayment.calculateMusdCost(100);
musdToken.approve(servicePaymentAddress, cost);
servicePayment.makePayment(100);
```

#### `calculateMusdCost(uint256 points)` view returns (uint256)
Calculates MUSD cost for specified points.

**Parameters:**
- `points`: Number of points to calculate cost for

**Returns:** MUSD amount required (including decimals)

**Usage Example:**
```solidity
uint256 cost = servicePayment.calculateMusdCost(50); // Returns 15 * 10**18
```

#### `getContractBalance()` view returns (uint256)
Returns current MUSD balance held by contract.

#### `withdrawTokens()` onlyOwner
Withdraws all MUSD tokens from contract to owner.

**Requirements:**
- Only contract owner can call
- Contract must have MUSD balance > 0

**Events:** Emits `TokensWithdrawn`

### Events

```solidity
event PaymentReceived(
    address indexed user, 
    uint256 pointsPurchased, 
    uint256 musdAmount, 
    uint256 timestamp
);

event TokensWithdrawn(address indexed owner, uint256 amount);
```

## 🧪 Testing

### Run All Tests
```bash
npx hardhat test
```

### Run Specific Contract Tests
```bash
# Test KiyanLend functionality
npx hardhat test test/KiyanLend.ts

# Test ServicePayment functionality  
npx hardhat test test/ServicePayment.ts
```

### Test Coverage Areas

#### KiyanLend Tests
- ✅ Proposal creation (BTC and MUSD)
- ✅ Proposal funding validation
- ✅ Self-funding prevention
- ✅ Incorrect payment amount rejection
- ✅ Loan completion with interest
- ✅ Access control enforcement
- ✅ State transition validation
- ✅ Event emission verification

#### ServicePayment Tests
- ✅ Point purchase validation
- ✅ Cost calculation accuracy
- ✅ Point range enforcement (10-1000)
- ✅ Divisibility by 10 requirement
- ✅ Owner withdrawal functionality
- ✅ Token approval requirements

### Test Scenarios
```bash
# Run comprehensive integration scenarios
npx hardhat run scripts/test-scenarios.js
```

## 📦 Deployment

### Local Network
```bash
# Start local hardhat network
npx hardhat node

# Deploy contracts locally
npx hardhat run scripts/deploy.js --network localhost
```


### Deployment Scripts

#### Basic Deployment (`scripts/deploy.js`)
Deploys MockERC20, KiyanLend, and basic setup.

#### Complete Deployment (`scripts/deploy_kiyan_lend.js`)
Comprehensive deployment with:
- Contract deployment
- Initial token minting
- Test proposal creation
- Balance verification
- Deployment summary

#### Service Payment Deployment (`scripts/deploy_service_payment.js`)
Deploys ServicePayment contract with owner setup.

## 🔧 Contract Interactions

### JavaScript/TypeScript Integration
```javascript
import { parseBTCer } from "viem";

// Connect to deployed contracts
const kiyanLend = await viem.getContractAt("KiyanLend", contractAddress);
const servicePayment = await viem.getContractAt("ServicePayment", contractAddress);

// Create loan proposal
const tx = await kiyanLend.write.createProposal([
  parseBTCer("1.0"),
  "nillion-data-123",
  0 // BTC
]);

// Purchase analysis credits
const cost = await servicePayment.read.calculateMusdCost([100n]);
await musdToken.write.approve([servicePayment.address, cost]);
await servicePayment.write.makePayment([100n]);
```
