// Contract addresses - Updated from latest deployments
export const CONTRACTS = {
	EERC_STANDALONE: "0x5E9c6F952fB9615583182e70eDDC4e6E4E0aC0e0", // Keep for compatibility
	EERC_CONVERTER: "0x372dAB27c8d223Af11C858ea00037Dc03053B22E",
	//ERC20: "0xb0Fe621B4Bd7fe4975f7c58E3D6ADaEb2a2A35CD",
	//EERC_CONVERTER: "0x7f184a9407C96a2B5F8B3A605dc110Cc2454c15A", // From latest-converter.json
	ERC20: "0xe96A81A5de1E8FF76e04264C37a3A53222Bb6a60", // testERC20 from latest-converter.json
	TIMELOCK_NEST: "0xED47e15B5B7643e3362AC46125cb89307E64A0D6", // From latest-timelock-nest.json (same address for now)
} as const;

// Circuit configuration
export const CIRCUIT_CONFIG = {
	register: {
		wasm: "/RegistrationCircuit.wasm",
		zkey: "/RegistrationCircuit.groth16.zkey",
	},
	mint: {
		wasm: "/MintCircuit.wasm",
		zkey: "/MintCircuit.groth16.zkey",
	},
	transfer: {
		wasm: "/TransferCircuit.wasm",
		zkey: "/TransferCircuit.groth16.zkey",
	},
	withdraw: {
		wasm: "/WithdrawCircuit.wasm",
		zkey: "/WithdrawCircuit.groth16.zkey",
	},
} as const;

// Explorer URL
export const EXPLORER_BASE_URL = "https://testnet.snowtrace.io/address/";
export const EXPLORER_BASE_URL_TX = "https://testnet.snowtrace.io/tx/";

// Mode types
export type EERCMode = "standalone" | "converter";
