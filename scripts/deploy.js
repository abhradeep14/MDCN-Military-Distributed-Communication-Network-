const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get the accounts from Hardhat
  const accounts = await hre.ethers.getSigners();
  console.log(`Using account: ${accounts[0].address}`);

  // Deploy the MDCNCommand contract
  console.log("Deploying MDCNCommand contract...");
  const MDCNCommand = await hre.ethers.getContractFactory("MDCNCommand");
  const commandContract = await MDCNCommand.deploy();
  await commandContract.deployed();
  console.log(`MDCNCommand deployed to: ${commandContract.address}`);

  // Deploy the MDCNCoordination contract
  console.log("Deploying MDCNCoordination contract...");
  const MDCNCoordination = await hre.ethers.getContractFactory("MDCNCoordination");
  const coordinationContract = await MDCNCoordination.deploy();
  await coordinationContract.deployed();
  console.log(`MDCNCoordination deployed to: ${coordinationContract.address}`);

  // Deploy the MDCNTactical contract
  console.log("Deploying MDCNTactical contract...");
  const MDCNTactical = await hre.ethers.getContractFactory("MDCNTactical");
  const tacticalContract = await MDCNTactical.deploy();
  await tacticalContract.deployed();
  console.log(`MDCNTactical deployed to: ${tacticalContract.address}`);

  // Update the config file with the actual contract addresses
  const configPath = path.join(__dirname, "..", "config", "network-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    config.commandContractAddress = commandContract.address;
    config.coordinationContractAddress = coordinationContract.address;
    config.tacticalContractAddress = tacticalContract.address;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("Config file updated with contract addresses");
  }

  // Assign roles to all accounts
  console.log("Assigning roles to accounts...");
  
  // Role definitions (from the MDCNCommand contract)
  const ROLES = {
    NONE: 0,
    STRATEGIC: 1,  // Admin
    OPERATIONAL: 2,
    TACTICAL: 3
  };

  // Accounts 0-2 are already STRATEGIC (admin) by default (when they deploy the contract)
  // Let's confirm and modify the rest
  
  // Confirm the role of account 0 (the deployer, already STRATEGIC)
  const deployerRole = await commandContract.roles(accounts[0].address);
  console.log(`Deployer ${accounts[0].address} role: ${deployerRole}`);
  
  // Assign roles to accounts 1-2 as STRATEGIC (admin)
  for (let i = 1; i < 3; i++) {
    const tx = await commandContract.setRole(accounts[i].address, ROLES.STRATEGIC);
    await tx.wait();
    console.log(`Assigned STRATEGIC role to account ${i}: ${accounts[i].address}`);
  }
  
  // Assign OPERATIONAL roles to accounts 3-10 (Command & Coordination operations)
  for (let i = 3; i < 11; i++) {
    const tx = await commandContract.setRole(accounts[i].address, ROLES.OPERATIONAL);
    await tx.wait();
    console.log(`Assigned OPERATIONAL role to account ${i}: ${accounts[i].address}`);
  }
  
  // Assign TACTICAL roles to accounts 11-19 (Field operations)
  for (let i = 11; i < 20; i++) {
    const tx = await commandContract.setRole(accounts[i].address, ROLES.TACTICAL);
    await tx.wait();
    console.log(`Assigned TACTICAL role to account ${i}: ${accounts[i].address}`);
  }
  
  console.log("Role assignment complete");
  
  console.log("Deployment and setup complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });