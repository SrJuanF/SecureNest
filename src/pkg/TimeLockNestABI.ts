export const TIMELOCK_NEST_ABI = [
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
        "name": "_NestId",
        "type": "uint256"
      }
    ],
    "name": "UserInNest",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "_NestId",
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
    "name": "NestCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "_NestId",
        "type": "uint256"
      }
    ],
    "name": "NestWithdrawn",
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
    "name": "_storeNest",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "_NestId",
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
        "name": "_NestId",
        "type": "uint256"
      }
    ],
    "name": "getInfoNest",
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
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserNest",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "_NestId",
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
        "name": "_NestId",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;


