import { useState } from "react";
import { Bounce, toast } from "react-toastify";

interface WithdrawProps {
	handlePrivateWithdraw: (amount: string) => Promise<void>;
	isDecryptionKeySet: boolean;
}

export function Withdraw({
	handlePrivateWithdraw,
	isDecryptionKeySet,
}: WithdrawProps) {
	const [withdrawAmount, setWithdrawAmount] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);
	return (
		<>
			<div className="flex-1">
				<h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent mb-3">
					💸 Withdraw
				</h3>
				<p className="text-sm text-gray-300 leading-relaxed mb-6 bg-gradient-to-r from-orange-500/10 to-red-500/10 p-4 rounded-lg border border-orange-500/20">
					<strong className="text-orange-300">Secure Withdraw:</strong> Generate zero-knowledge proof of sufficient balance → Contract encrypts withdrawn amount → Homomorphically subtract from encrypted balance → Transfer ERC-20 tokens to wallet.
				</p>
			</div>

			<div>
				<input
					type="text"
					value={withdrawAmount}
					onChange={(e) => {
						const value = e.target.value.trim();
						if (/^\d*\.?\d{0,2}$/.test(value)) {
							setWithdrawAmount(value);
						}
					}}
					placeholder={"Amount in token (eg. 1.5, 0.01)"}
					className="flex-1 bg-gradient-to-r from-slate-800/50 to-slate-700/50 text-white px-4 py-3 rounded-xl border-2 border-orange-500/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/50 outline-none font-mono w-full transition-all duration-200 hover:border-orange-400/50 placeholder:text-orange-300 placeholder:opacity-80"
				/>
				<button
					type="button"
					className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 hover:from-orange-700 hover:via-red-700 hover:to-pink-700 w-full text-white px-4 py-3 rounded-xl text-sm font-bold border-2 border-orange-400/30 disabled:opacity-50 disabled:cursor-not-allowed mb-2 transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-orange-500/25 mt-3"
					onClick={async () => {
						setLoading(true);
						handlePrivateWithdraw(withdrawAmount)
							.then(() => {
								setLoading(false);
								setWithdrawAmount("");
							})
							.catch((error) => {
								const isUserRejected = error?.message.includes("User rejected");

								toast.error(
									<div className="bg-gradient-to-r from-red-500/90 to-pink-500/90 backdrop-blur-sm rounded-lg p-4 border border-red-400/30 shadow-lg">
										<div className="flex items-center gap-3">
											<div className="text-2xl">❌</div>
											<div>
												<h4 className="text-white font-bold text-sm">Withdraw Failed</h4>
												<p className="text-red-100 text-xs mt-1">
													{isUserRejected
														? "Transaction rejected by user"
														: "An error occurred while withdrawing tokens. Please try again."}
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
					disabled={!withdrawAmount || loading || !isDecryptionKeySet}
				>
					{loading ? "Withdrawing..." : "Withdraw"}
				</button>
			</div>
		</>
	);
}
