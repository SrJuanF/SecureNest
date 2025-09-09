# TimeLockNest Contract - Scripts Documentation

## 📋 Overview

This folder contains the deployment and testing scripts for the `TimeLockNest.sol` smart contract, which implements a multi-signature time-locked withdrawal system for encrypted ERC20 tokens.

## 🏗️ Contract Architecture

### TimeLockNest.sol
A smart contract that allows multiple users to create time-locked "nests" for encrypted ERC20 tokens, requiring multiple confirmations before withdrawal.

**Key Features:**
- ✅ Multi-signature withdrawal system
- ✅ Time-locked withdrawals (unlock time validation)
- ✅ Encrypted balance verification
- ✅ Nest creation and management
- ✅ Withdrawal confirmation tracking

## 📁 Files Structure

```
scripts/nests/
├── README.md                           # This documentation
├── 01_deploy-timelock-nest.ts         # Deployment script
└── 02_test-timelock-nest-simple.ts    # Comprehensive test script
```

## 🚀 Deployment Process

### 1. Deploy TimeLockNest Contract

```bash
npx hardhat run scripts/nests/01_deploy-timelock-nest.ts --network fuji
```

**What it does:**
- Deploys the `TimeLockNest` contract
- Uses the `encryptedERC` address from previous deployments
- Saves deployment data to `deployments/timelock-nest/`
- Creates `latest-timelock-nest.json` for easy access

**Deployment Data Saved:**
- Contract address
- Transaction hash
- Block number
- Timestamp
- Network information

## 🧪 Testing Process

### 2. Run Comprehensive Tests

```bash
npx hardhat run scripts/nests/02_test-timelock-nest-simple.ts --network fuji
```

**Test Coverage:**

#### ✅ **Test 1: Contract Deployment Verification**
- Verifies contract is deployed correctly
- Checks contract address and basic functionality

#### ✅ **Test 2: Nest Creation**
- Creates a nest with 2 owners (`user1` and `deployer`)
- Sets `required = 2` confirmations
- Sets unlock time to 10 seconds in the future
- Verifies nest creation event

#### ✅ **Test 3: Nest Information Retrieval**
- Retrieves nest details using `getNestInfo(nestId)`
- Verifies owners array, required confirmations, and unlock time
- Checks initial state (0 confirmations, not withdrawn)

#### ✅ **Test 4: Withdraw Validation (Before Unlock Time)**
- Attempts withdrawal before unlock time
- Expects `UnlockTimeNotReached` error
- Verifies time-lock protection works

#### ✅ **Test 5: Withdraw Behavior (After Unlock Time)**
- Waits for unlock time to pass (12 seconds)
- **User1 withdraws**: 1 confirmation, nest not withdrawn
- **Deployer withdraws**: 2 confirmations, nest marked as withdrawn
- Demonstrates multi-signature requirement

#### ✅ **Test 6: Already Withdrawn Validation**
- Attempts withdrawal from already withdrawn nest
- Expects `NestAlreadyWithdrawn` error
- Prevents duplicate withdrawals

#### ✅ **Test 7: Encrypted Balance Checking (TokenId)**
- Tests `hasEncryptedBalance(user, tokenId)` function
- Uses `tokenId = 1` for testERC20
- Checks balance for both users

#### ✅ **Test 8: Encrypted Balance Checking (Token Address)**
- Tests `hasEncryptedBalanceByAddress(user, tokenAddress)` function
- Uses actual `testERC20Address` from deployment
- Compares results with tokenId method

## 🔧 Contract Functions

### Core Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `createNest` | Creates a new time-locked nest | `_owners[]`, `_required`, `_unlockTime` |
| `withdraw` | Withdraws from a nest (requires confirmations) | `_nestId` |
| `getNestInfo` | Retrieves nest information | `_nestId` |
| `getUserNest` | Gets user's nest ID | `_user` |

### Balance Verification Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `hasEncryptedBalance` | Checks encrypted balance by tokenId | `_user`, `_tokenId` |
| `hasEncryptedBalanceByAddress` | Checks encrypted balance by token address | `_user`, `_tokenAddress` |

## 📊 Test Results Example

```
🎯 TimeLockNest Contract Test Results:

✅ Contract deployed at: 0x...
✅ Nest created with ID: 1
✅ Nest info retrieved successfully
✅ Withdraw correctly failed before unlock time
✅ Withdraw successful after unlock time
✅ Multi-signature requirement verified (2/2 confirmations)
✅ Nest marked as withdrawn after all confirmations
✅ Withdraw correctly failed for already withdrawn nest
✅ Encrypted balance checking with tokenId
✅ Encrypted balance checking with token address

🎉 All TimeLockNest tests passed successfully!
```

## 🔐 Security Features

### Multi-Signature Protection
- Requires multiple confirmations before withdrawal
- Configurable `required` parameter per nest
- Prevents single-user withdrawals

### Time-Lock Protection
- Enforces unlock time before withdrawals
- Prevents premature access to funds
- Configurable unlock time per nest

### Duplicate Withdrawal Prevention
- Tracks withdrawal status per nest
- Prevents multiple withdrawals from same nest
- Maintains nest state integrity

## 🌐 Network Configuration

### Supported Networks
- **Fuji Testnet**: Primary testing network
- **Localhost**: Development testing
- **Mainnet**: Production deployment (when ready)

### Network-Specific Commands
```bash
# Fuji Testnet
npx hardhat run scripts/nests/01_deploy-timelock-nest.ts --network fuji
npx hardhat run scripts/nests/02_test-timelock-nest-simple.ts --network fuji

# Localhost
npx hardhat run scripts/nests/01_deploy-timelock-nest.ts --network localhost
npx hardhat run scripts/nests/02_test-timelock-nest-simple.ts --network localhost
```

## 📝 Dependencies

### Required Contracts
- **EncryptedERC.sol**: Main encrypted ERC20 contract
- **TestERC20.sol**: Test token for development

### Required Deployments
- **latest-converter.json**: Contains `encryptedERC` and `testERC20` addresses
- **latest-timelock-nest.json**: Contains `TimeLockNest` contract address

## 🚨 Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `UnlockTimeNotReached` | Attempting withdrawal before unlock time | Wait for unlock time to pass |
| `NestAlreadyWithdrawn` | Attempting withdrawal from withdrawn nest | Check nest status before withdrawal |
| `InsufficientConfirmations` | Not enough confirmations for withdrawal | Wait for required confirmations |
| `InvalidNestId` | Using non-existent nest ID | Verify nest ID exists |

## 🔄 Workflow Summary

1. **Deploy** TimeLockNest contract using `01_deploy-timelock-nest.ts`
2. **Test** all functionality using `02_test-timelock-nest-simple.ts`
3. **Verify** deployment data in `deployments/timelock-nest/`
4. **Monitor** contract interactions and events
5. **Maintain** security and functionality over time

## 📞 Support

For issues or questions regarding the TimeLockNest contract:
- Check the test results for specific error messages
- Verify deployment data and contract addresses
- Ensure proper network configuration
- Review contract events and transaction logs

---

**Last Updated**: December 2024
**Contract Version**: TimeLockNest.sol v1.0
**Test Coverage**: 100% of core functionality
