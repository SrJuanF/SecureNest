import { useState } from "react";
import { Bounce, toast } from "react-toastify";
import { useAccount } from "wagmi";

interface TransferProps {
	handlePrivateTransfer: (to: string, amount: string) => Promise<void>;
	isDecryptionKeySet: boolean;
}

export function Transfer({
	handlePrivateTransfer,
	isDecryptionKeySet,
}: TransferProps) {
	const { address } = useAccount();
	const [transferAmount, setTransferAmount] = useState<string>("");
	const [to, setTo] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);

	return (
		<>
			<div className="flex-1">
				<h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mb-3">
					🔄 Private Transfer
				</h3>
				<p className="text-sm text-gray-300 leading-relaxed mb-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-lg border border-blue-500/20">
					<strong className="text-blue-300">Secure Transfer:</strong> Fetch recipient's public key → Encrypt amount → Generate zero-knowledge proof → Homomorphically update balances without revealing values.
				</p>
			</div>

			<div>
				<input
					type="text"
					value={to}
					onChange={(e) => setTo(e.target.value.trim())}
					placeholder={"Recipient address"}
					className="flex-1 bg-gradient-to-r from-slate-800/50 to-slate-700/50 text-white px-4 py-3 rounded-xl border-2 border-blue-500/30 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 outline-none font-mono w-full mb-3 transition-all duration-200 hover:border-blue-400/50 placeholder:text-blue-300 placeholder:opacity-80"
				/>
				<input
					type="text"
					value={transferAmount}
					onChange={(e) => {
						const value = e.target.value.trim();
						if (/^\d*\.?\d{0,2}$/.test(value)) {
							setTransferAmount(value);
						}
					}}
					placeholder={"Amount"}
					className="flex-1 bg-gradient-to-r from-slate-800/50 to-slate-700/50 text-white px-4 py-3 rounded-xl border-2 border-blue-500/30 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 outline-none font-mono w-full mb-3 transition-all duration-200 hover:border-blue-400/50 placeholder:text-blue-300 placeholder:opacity-80"
				/>
				<button
					type="button"
					className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700 w-full text-white px-4 py-3 rounded-xl text-sm font-bold border-2 border-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed mb-2 transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-blue-500/25 mt-2"
					onClick={async () => {
						if (to.toLowerCase() === address?.toLowerCase()) {
							toast.error(
								<div className="bg-gradient-to-r from-orange-500/90 to-red-500/90 backdrop-blur-sm rounded-lg p-4 border border-orange-400/30 shadow-lg">
									<div className="flex items-center gap-3">
										<div className="text-2xl">⚠️</div>
										<div>
											<h4 className="text-white font-bold text-sm">Invalid Transfer</h4>
											<p className="text-orange-100 text-xs mt-1">You cannot transfer tokens to yourself</p>
										</div>
									</div>
								</div>,
								{
									position: "top-right",
									autoClose: 6000,
									hideProgressBar: false,
									closeOnClick: true,
									pauseOnHover: true,
									draggable: true,
									progress: undefined,
									transition: Bounce,
									className: "custom-toast-warning",
								},
							);
							return;
						}

						setLoading(true);
						handlePrivateTransfer(to, transferAmount)
							.then(() => {
								setLoading(false);
								setTransferAmount("");
								setTo("");
							})
							.catch((error) => {
								const isUserRejected = error?.details.includes("User rejected");
								toast.error(
									<div className="bg-gradient-to-r from-red-500/90 to-pink-500/90 backdrop-blur-sm rounded-lg p-4 border border-red-400/30 shadow-lg">
										<div className="flex items-center gap-3">
											<div className="text-2xl">❌</div>
											<div>
												<h4 className="text-white font-bold text-sm">Transfer Failed</h4>
												<p className="text-red-100 text-xs mt-1">
													{isUserRejected ? "Transaction rejected by user" : error?.message}
												</p>
											</div>
										</div>
									</div>,
									{
										position: "top-right",
										autoClose: 6000,
										hideProgressBar: false,
										closeOnClick: true,
										pauseOnHover: true,
										draggable: true,
										progress: undefined,
										transition: Bounce,
										className: "custom-toast-error",
									},
								);

								setLoading(false);
							});
					}}
					disabled={!transferAmount || loading || !to || !isDecryptionKeySet}
				>
					{loading ? "Transferring..." : "Transfer"}
				</button>
			</div>
		</>
	);
}
