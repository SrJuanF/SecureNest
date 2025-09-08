import { useState } from "react";
import { Bounce, toast } from "react-toastify";

interface DepositProps {
	handlePrivateDeposit: (amount: string) => Promise<void>;
	isDecryptionKeySet: boolean;
}

export function Deposit({
	handlePrivateDeposit,
	isDecryptionKeySet,
}: DepositProps) {
	const [depositAmount, setDepositAmount] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);

	return (
		<>
			<div className="flex-1">
				<h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-3">
					💰 Deposit
				</h3>
				<p className="text-sm text-gray-300 leading-relaxed mb-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 rounded-lg border border-purple-500/20">
					<strong className="text-purple-300">Secure Deposit:</strong> Approve tokens → Contract encrypts with your public key → Added to private balance via homomorphic encryption.
				</p>
			</div>

			<div>
				<input
					type="text"
					value={depositAmount}
					onChange={(e) => {
						const value = e.target.value.trim();
						if (/^\d*\.?\d{0,2}$/.test(value)) {
							setDepositAmount(value);
						}
					}}
					placeholder={"Amount in token (eg. 1.5, 0.01)"}
					className="flex-1 bg-gradient-to-r from-slate-800/50 to-slate-700/50 text-white px-4 py-3 rounded-xl border-2 border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 outline-none font-mono w-full transition-all duration-200 hover:border-purple-400/50 placeholder:text-purple-300 placeholder:opacity-80"
				/>
				<button
					type="button"
					className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 w-full text-white px-4 py-3 rounded-xl text-sm font-bold border-2 border-purple-400/30 disabled:opacity-50 disabled:cursor-not-allowed mb-2 transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-purple-500/25 mt-3"
					onClick={async () => {
						setLoading(true);
						handlePrivateDeposit(depositAmount)
							.then(() => {
								setLoading(false);
								setDepositAmount("");
							})
							.catch((error) => {
								console.error(error);
								const isUserRejected =
									error?.details?.includes("User rejected");
								toast.error(
									<div className="bg-gradient-to-r from-red-500/90 to-pink-500/90 backdrop-blur-sm rounded-lg p-4 border border-red-400/30 shadow-lg">
										<div className="flex items-center gap-3">
											<div className="text-2xl">❌</div>
											<div>
												<h4 className="text-white font-bold text-sm">Transaction Failed</h4>
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
					disabled={!depositAmount || loading || !isDecryptionKeySet}
				>
					{loading ? "Depositing..." : "Deposit"}
				</button>
			</div>
		</>
	);
}
