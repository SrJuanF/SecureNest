import { ethers } from "hardhat";
import { saveDeploymentData } from "../../src/utils/utils";
import * as fs from "fs";
import * as path from "path";

const main = async () => {
	// get deployer
	const [deployer] = await ethers.getSigners();

	// Load the latest converter deployment to get the encryptedERC address
	const latestDeploymentPath = path.join(__dirname, "../../deployments/converter/latest-converter.json");
	
	if (!fs.existsSync(latestDeploymentPath)) {
		console.error("❌ No latest converter deployment found. Please run the converter deployment scripts first.");
		process.exit(1);
	}

	const latestDeployment = JSON.parse(fs.readFileSync(latestDeploymentPath, "utf8"));
	const { contracts } = latestDeployment;
	const { encryptedERC } = contracts;

	if (!encryptedERC) {
		console.error("❌ No encryptedERC address found in latest deployment.");
		process.exit(1);
	}

	console.log("📋 Using encryptedERC address from latest deployment:", encryptedERC);

	// Deploy TimeLockNest contract
	const timeLockNestFactory = await ethers.getContractFactory("TimeLockNest");
	const timeLockNest = await timeLockNestFactory.deploy(encryptedERC);
	await timeLockNest.waitForDeployment();

	console.log("✅ TimeLockNest deployed at:", timeLockNest.target);

	// Create deployment data object
	const deploymentData = {
		network: "fuji",
		deployer: deployer.address,
		deploymentTimestamp: new Date().toISOString(),
		contracts: {
			timeLockNest: timeLockNest.target,
			encryptedERC: encryptedERC,
		},
		metadata: {
			isNest: true,
			description: "TimeLockNest contract for managing time-locked encrypted token withdrawals",
		}
	};

	// Display in console
	console.table({
		timeLockNest: timeLockNest.target,
		encryptedERC: encryptedERC,
	});

	// Save deployment data using utility function
	saveDeploymentData(deploymentData, __dirname, false, "timelock-nest"); // false for standalone deployment, custom folder
};

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
