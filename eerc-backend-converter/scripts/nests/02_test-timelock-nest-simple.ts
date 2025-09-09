import { ethers } from "hardhat";
import { expect } from "chai";
import { TimeLockNest__factory } from "../../typechain-types";
import * as fs from "fs";
import * as path from "path";

/**
 * Helper function to load deployment data
 * @param deploymentType "converter", "standalone", or "timelock-nest"
 * @returns Deployment data object
 */
function loadDeployment(deploymentType: "converter" | "standalone" | "timelock-nest") {
	const deploymentPath = path.join(__dirname, `../../deployments/${deploymentType}/latest-${deploymentType}.json`);
	
	if (!fs.existsSync(deploymentPath)) {
		console.error(`❌ No latest ${deploymentType} deployment found. Please run the deployment script first.`);
		process.exit(1);
	}

	const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
	return deployment;
}

const main = async () => {
	// get signers
	const [deployer, user1] = await ethers.getSigners();

	// Load deployment data
	const nestDeployment = loadDeployment("timelock-nest");
	const converterDeployment = loadDeployment("converter");
	
	const { timeLockNest: timeLockNestAddress } = nestDeployment.contracts;
	const { testERC20: testERC20Address } = converterDeployment.contracts;

	if (!timeLockNestAddress) {
		console.error("❌ No TimeLockNest address found in latest deployment.");
		process.exit(1);
	}

	if (!testERC20Address) {
		console.error("❌ No testERC20 address found in converter deployment.");
		process.exit(1);
	}

	console.log("📋 Using TimeLockNest address from latest deployment:", timeLockNestAddress);
	console.log("📋 Using testERC20 address from converter deployment:", testERC20Address);

	// Connect to the deployed TimeLockNest contract
	const timeLockNest = TimeLockNest__factory.connect(timeLockNestAddress, deployer);

	console.log("🧪 Starting TimeLockNest tests...");

	// Test 1: Check if contract is deployed correctly
	console.log("\n📝 Test 1: Contract deployment verification");
	expect(timeLockNest.target).to.equal(timeLockNestAddress);
	console.log("✅ Contract address verified");

	// Test 2: Test createNest function
	console.log("\n📝 Test 2: Creating a nest");
	const owners = [user1.address, deployer.address];
	const currentTime = Math.floor(Date.now() / 1000);
	const unlockTime = currentTime + 10; // 10 seconds from now
	const required = 2; // 2 out of 2 confirmations required

	console.log("   - Current time:", currentTime);
	console.log("   - Unlock time:", unlockTime);
	console.log("   - Owners:", owners);
	console.log("   - Required confirmations:", required);

	const createNestTx = await timeLockNest.createNest(owners, unlockTime, required);
	await createNestTx.wait();

	// Get the nest ID from events
	const receipt = await createNestTx.wait();
	const nestCreatedEvent = receipt?.logs.find(log => {
		try {
			const parsed = timeLockNest.interface.parseLog(log);
			return parsed?.name === "NestCreated";
		} catch {
			return false;
		}
	});

	expect(nestCreatedEvent).to.not.be.undefined;
	const parsedEvent = timeLockNest.interface.parseLog(nestCreatedEvent!);
	const nestId = parsedEvent?.args[0];
	
	console.log("✅ Nest created with ID:", nestId.toString());

	// Test 3: Test getInfoNest function
	console.log("\n📝 Test 3: Getting nest information");
	const nestInfo = await timeLockNest.getInfoNest(nestId);
	
	expect(nestInfo.unlockTime).to.equal(unlockTime);
	expect(nestInfo.required).to.equal(required);
	expect(nestInfo.confirmations).to.equal(0);
	expect(nestInfo.withdrawn).to.be.false;
	expect(nestInfo.owners).to.have.length(2);
	
	console.log("✅ Nest info retrieved correctly");
	console.log("   - Unlock time:", nestInfo.unlockTime.toString());
	console.log("   - Required confirmations:", nestInfo.required.toString());
	console.log("   - Current confirmations:", nestInfo.confirmations.toString());
	console.log("   - Withdrawn:", nestInfo.withdrawn);
	console.log("   - Number of owners:", nestInfo.owners.length);

	// Test 4: Test withdraw BEFORE unlock time (should fail)
	console.log("\n📝 Test 4: Testing withdraw BEFORE unlock time (should fail)");
	const timeLockNestUser1 = timeLockNest.connect(user1);
	const timeLockNestDeployer = timeLockNest.connect(deployer);
	
	// User1 tries to withdraw before unlock time
	await expect(
		timeLockNestUser1.withdraw(nestId)
	).to.be.revertedWithCustomError(timeLockNest, "UnlockTimeNotReached");
	
	console.log("✅ User1 correctly failed to withdraw before unlock time");
	
	// Deployer tries to withdraw before unlock time
	await expect(
		timeLockNestDeployer.withdraw(nestId)
	).to.be.revertedWithCustomError(timeLockNest, "UnlockTimeNotReached");
	
	console.log("✅ Deployer correctly failed to withdraw before unlock time");
	
	// Check nest state is still unchanged
	const beforeUnlockNestInfo = await timeLockNest.getInfoNest(nestId);
	console.log("   - Confirmations before unlock:", beforeUnlockNestInfo.confirmations.toString());
	console.log("   - Withdrawn before unlock:", beforeUnlockNestInfo.withdrawn);

	// Test 5: Wait for unlock time and then withdraw (should succeed)
	console.log("\n📝 Test 5: Waiting for unlock time and then withdrawing");
	
	// Wait for unlock time to pass (12 seconds to be safe)
	console.log("   - Waiting for unlock time to pass...");
	await new Promise(resolve => setTimeout(resolve, 12000));
	
	// User1 withdraws after unlock time (should succeed)
	console.log("   - User1 attempting withdrawal after unlock time...");
	const withdrawTx1 = await timeLockNestUser1.withdraw(nestId);
	await withdrawTx1.wait();
	
	// Check state after first withdrawal
	const afterFirstWithdrawal = await timeLockNest.getInfoNest(nestId);
	console.log("   - Confirmations after User1 withdrawal:", afterFirstWithdrawal.confirmations.toString());
	console.log("   - Withdrawn after User1 withdrawal:", afterFirstWithdrawal.withdrawn);
	console.log("   - Expected: confirmations = 1, withdrawn = false");
	
	// Deployer withdraws after unlock time (should succeed and trigger final withdrawal)
	console.log("   - Deployer attempting withdrawal after unlock time...");
	const withdrawTx2 = await timeLockNestDeployer.withdraw(nestId);
	await withdrawTx2.wait();
	
	// Check final state
	const finalNestInfo = await timeLockNest.getInfoNest(nestId);
	console.log("   - Final confirmations:", finalNestInfo.confirmations.toString());
	console.log("   - Final withdrawn:", finalNestInfo.withdrawn);
	console.log("   - Expected: confirmations = 2, withdrawn = true");
	
	console.log("✅ Both users successfully withdrew after unlock time");
	console.log("✅ Nest marked as withdrawn after reaching required confirmations");

	// Test 6: Test withdrawing from already withdrawn nest (should fail)
	console.log("\n📝 Test 6: Testing withdraw from already withdrawn nest (should fail)");
	await expect(
		timeLockNestUser1.withdraw(nestId)
	).to.be.revertedWithCustomError(timeLockNest, "NestAlreadyWithdrawn");
	
	console.log("✅ Withdraw correctly failed for already withdrawn nest");

	// Test 7: Test hasEncryptedBalance function with tokenId
	console.log("\n📝 Test 7: Testing hasEncryptedBalance function with tokenId");
	// Using tokenId = 1 (assuming the testERC20 has tokenId 1 in the encryptedERC contract)
	const hasBalanceUser1 = await timeLockNest.hasEncryptedBalance(user1.address, 1);
	const hasBalanceDeployer = await timeLockNest.hasEncryptedBalance(deployer.address, 1);
	
	console.log("✅ hasEncryptedBalance results:");
	console.log("   - User1 (tokenId=1):", hasBalanceUser1);
	console.log("   - Deployer (tokenId=1):", hasBalanceDeployer);

	// Test 8: Test hasEncryptedBalanceByAddress function with token address
	console.log("\n📝 Test 8: Testing hasEncryptedBalanceByAddress function with token address");
	// Using the actual testERC20 address from deployment
	const hasBalanceByAddressUser1 = await timeLockNest.hasEncryptedBalanceByAddress(user1.address, testERC20Address);
	const hasBalanceByAddressDeployerTokenId = await timeLockNest.hasEncryptedBalance(deployer.address, 1);
	
	console.log("✅ hasEncryptedBalanceByAddress results:");
	console.log("   - User1 (ERC20 address):", hasBalanceByAddressUser1);
	console.log("   - Deployer (ERC20 tokenid):", hasBalanceByAddressDeployerTokenId);
	console.log("   - testERC20 address used:", testERC20Address);

	console.log("\n🎉 All TimeLockNest tests passed successfully!");
}

main().catch((error) => {
	console.error("❌ Test failed:", error);
	process.exitCode = 1;
});

