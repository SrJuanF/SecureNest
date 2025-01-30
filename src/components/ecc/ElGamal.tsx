import { useState } from "react";
import { IDENTITY_POINT } from "../../pkg/constants";
import { genKeyPair } from "../../pkg/jub";
import type { IJubPoint } from "../../types";
import { GenerateKey } from "../elgamal/GenerateKey";
import { MathEquation } from "./MathEquation";

export const ElGamal = () => {
	const [keyPair, setKeyPair] = useState<{
		privateKey: bigint;
		publicKey: IJubPoint;
	}>({ privateKey: 0n, publicKey: IDENTITY_POINT });

	const handleGenerateKeyPair = () => {
		const { privateKey, publicKey } = genKeyPair();
		setKeyPair({ privateKey, publicKey: { x: publicKey[0], y: publicKey[1] } });
	};
	return (
		<>
			<div className="text-cyber-gray font-mono text-sm leading-relaxed mt-10 mb-6">
				<h2 className="text-cyber-green font-bold text-lg mb-4 text-center">
					ElGamal Encryption on BabyJubjub
				</h2>
				<p className="text-justify indent-6">
					ElGamal encryption is a widely used public-key encryption scheme,
					adapted here for the BabyJubjub elliptic curve. This scheme leverages
					the algebraic structure of elliptic curves to provide strong security
					guarantees while maintaining computational efficiency.
				</p>
			</div>

			<GenerateKey
				handleGenerateKeyPair={handleGenerateKeyPair}
				keyPair={keyPair}
			/>

			<h2 className="text-cyber-gray font-mono text-sm leading-relaxed mt-10 mb-6">
				- Encryption
			</h2>

			<MathEquation>
				<p className="text-sm font-mono">
					{/* <strong>Key Generation:</strong> */}P = xG <br />Y = xG <br />
					{/* <strong>Encryption:</strong> */}C<sub>1</sub> = kG <br />C
					<sub>2</sub> = M + kY <br />
					{/* <strong>Decryption:</strong> */}M = C<sub>2</sub> - xC<sub>1</sub>
				</p>
			</MathEquation>
		</>
	);
};
