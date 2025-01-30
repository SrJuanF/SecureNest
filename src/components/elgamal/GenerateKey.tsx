import type { IJubPoint } from "../../types";
import { CurvePoint } from "../ecc/CurvePoint";

interface GenerateKeyProps {
	handleGenerateKeyPair: () => void;
	keyPair: {
		privateKey: bigint;
		publicKey: IJubPoint;
	};
}

export const GenerateKey = ({
	handleGenerateKeyPair,
	keyPair,
}: GenerateKeyProps) => {
	return (
		<div className="space-y-4 font-mono">
			<h2 className="text-cyber-gray font-mono text-sm leading-relaxed mt-10 mb-6">
				- Generate Key Pair
			</h2>

			<div className="space-y-4 font-mono">
				<button
					type="button"
					onClick={handleGenerateKeyPair}
					className="bg-cyber-dark text-cyber-green px-2 py-1 rounded-md text-sm border border-cyber-green/60"
				>
					Generate Key Pair
				</button>

				{keyPair && (
					<div className="space-y-2 font-mono text-sm">
						<div className="text-cyber-gray">
							Private Key:{" "}
							<span className="text-cyber-green/60">
								{keyPair.privateKey.toString()}
							</span>
						</div>
						<CurvePoint
							label="Public Key"
							x={keyPair.publicKey.x}
							y={keyPair.publicKey.y}
							onChange={() => {}}
							shouldCollapse={false}
						/>
					</div>
				)}
			</div>
		</div>
	);
};
