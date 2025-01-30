import { BN128_PRIME } from "./constants";

export function uint8ArrayToBigInt(array: Uint8Array): bigint {
	console.log(array.length);

	let result = BigInt(0);

	for (let i = array.length - 1; i >= 0; i--) {
		result = (result << BigInt(8)) | BigInt(array[i]);
	}

	return result % BigInt(BN128_PRIME);
}
