import { Burn } from "./Burn";
import { Mint } from "./Mint";
import { Transfer } from "./Transfer";
import { Withdraw } from "./Withdraw";

interface OperationsProps {
	handlePrivateMint: (amount: bigint) => Promise<void>;
	handlePrivateBurn: (amount: bigint) => Promise<void>;
	handlePrivateTransfer: (to: string, amount: string) => Promise<void>;
	handlePrivateWithdraw: (amount: string) => Promise<void>;
	mode: "standalone" | "converter";
	isDecryptionKeySet: boolean;
	refetchBalance: () => void;
}

export function Operations({
	handlePrivateMint,
	handlePrivateBurn,
	handlePrivateTransfer,
	handlePrivateWithdraw,
	isDecryptionKeySet,
	mode,
	refetchBalance,
}: OperationsProps) {
	const handlePrivateMint_ = async (amount: bigint) => {
		await handlePrivateMint(amount);
		refetchBalance();
	};

	const handlePrivateBurn_ = async (amount: bigint) => {
		await handlePrivateBurn(amount);
		refetchBalance();
	};

	const handlePrivateTransfer_ = async (to: string, amount: string) => {
		await handlePrivateTransfer(to, amount);
		refetchBalance();
	};


	const handlePrivateWithdraw_ = async (amount: string) => {
		await handlePrivateWithdraw(amount);
		refetchBalance();
	};

	return (
		<div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/10">
			<h2 className="text-2xl font-bold text-white mb-6 text-center">🔐 Encrypted Operations</h2>

			<p className="text-gray-300 text-center mb-8 max-w-4xl mx-auto">
				All operations below are fully encrypted using elliptic curve cryptography.
				When you deposit, transfer, or withdraw tokens, the data is encrypted with your public key
				so that only you can decrypt and view your balances. For transfer operations, the recipient's
				public key will be automatically fetched from the protocol to encrypt the tokens for them.
			</p>

			{mode === "standalone" && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
						<div className="text-center mb-4">
							<div className="text-4xl mb-2">🪙</div>
							<h3 className="text-lg font-bold text-purple-300 mb-2">Mint Tokens</h3>
							<p className="text-gray-300 text-sm">
								Create new encrypted tokens from nothing. Only available in standalone mode.
							</p>
						</div>
						<Mint
							handlePrivateMint={handlePrivateMint_}
							isDecryptionKeySet={isDecryptionKeySet}
						/>
					</div>

					<div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl p-6 border border-red-500/20">
						<div className="text-center mb-4">
							<div className="text-4xl mb-2">🔥</div>
							<h3 className="text-lg font-bold text-red-300 mb-2">Burn Tokens</h3>
							<p className="text-gray-300 text-sm">
								Permanently destroy encrypted tokens. Only available in standalone mode.
							</p>
						</div>
						<Burn
							handlePrivateBurn={handlePrivateBurn_}
							isDecryptionKeySet={isDecryptionKeySet}
						/>
					</div>
				</div>
			)}

			{mode === "converter" && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
						<div className="text-center mb-3">
							<div className="text-2xl mb-1">💸</div>
							<h3 className="text-base font-bold text-green-300 mb-1">Withdraw Tokens</h3>
							<p className="text-gray-300 text-xs">
								Convert encrypted tokens back to regular ERC-20 tokens. Only available when nest is unlocked.
							</p>
						</div>
						<Withdraw
							handlePrivateWithdraw={handlePrivateWithdraw_}
							isDecryptionKeySet={isDecryptionKeySet}
						/>
					</div>

					<div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
						<div className="text-center mb-3">
							<div className="text-2xl mb-1">🔄</div>
							<h3 className="text-base font-bold text-blue-300 mb-1">Transfer Tokens</h3>
							<p className="text-gray-300 text-xs">
								Send encrypted tokens to another user. Only available when nest is unlocked.
							</p>
						</div>
						<Transfer
							handlePrivateTransfer={handlePrivateTransfer_}
							isDecryptionKeySet={isDecryptionKeySet}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
