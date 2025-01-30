import { useState } from "react";

export const MulWithScalar = () => {
	const [value, setValue] = useState<string>("");

	const handleChange = (newValue: string) => setValue(newValue);

	return (
		<div className="">
			<div>
				<h3 className="text-cyber-gray mb-2 text-sm font-mono">
					Multiply With Generator Point
				</h3>
				<input
					type="text"
					value={value}
					onChange={(e) => {
						const value = e.target.value.trim();
						if (/^\d*$/.test(value)) {
							handleChange(value);
						}
					}}
					placeholder={"..."}
					className="flex-1 bg-cyber-black text-center text-cyber-gray p-1 rounded-lg border border-cyber-green/20 focus:border-cyber-green focus:ring-1 focus:ring-cyber-green outline-none font-mono"
				/>
			</div>
		</div>
	);
};
