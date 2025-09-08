export const TIMELOCK_VAULT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_encryptedERC",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "vaultId",
        "type": "uint256"
      }
    ],
    "name": "UserInVault",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "vaultId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "unlockTime",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "required",
        "type": "uint256"
      }
    ],
    "name": "VaultCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "vaultId",
        "type": "uint256"
      }
    ],
    "name": "VaultWithdrawn",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "_owners",
        "type": "address[]"
      },
      {
        "internalType": "uint256",
        "name": "_unlockTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_required",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_confirmations",
        "type": "uint256"
      }
    ],
    "name": "_storeVault",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "vaultId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "vaultId",
        "type": "uint256"
      }
    ],
    "name": "getInfo",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "owners",
        "type": "address[]"
      },
      {
        "internalType": "uint256",
        "name": "unlockTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "withdrawn",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "required",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "confirmations",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "vaultId",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
