require("@nomiclabs/hardhat-waffle");
const fs = require("fs");
const path = require("path");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  
  for (const account of accounts) {
    console.log(account.address);
  }
});

// Custom task to generate config file with addresses
task("generate-config", "Generates a config file with contract and admin addresses")
  .addParam("limit", "Number of accounts to generate", 20, types.int) // Changed default to 20
  .setAction(async (taskArgs, hre) => {
    // Get default accounts from network config
    const accounts = await hre.ethers.getSigners();
    const limitedAccounts = accounts.slice(0, taskArgs.limit);
    
    // Get hardhat configured accounts (to access private keys)
    const networkConfig = hre.config.networks.hardhat.accounts;
    const mnemonic = networkConfig.mnemonic;
    const count = taskArgs.limit;
    
    // Generate account data including addresses and private keys
    const walletData = [];
    for (let i = 0; i < count; i++) {
      // Create wallet from mnemonic and path
      const wallet = hre.ethers.Wallet.fromMnemonic(
        mnemonic, 
        `m/44'/60'/0'/0/${i}`
      );
      
      walletData.push({
        address: wallet.address,
        privateKey: wallet.privateKey,
        index: i
      });
    }
    
    // First three accounts will be admins
    const adminAddresses = walletData.slice(0, 3).map(wallet => wallet.address);
    
    // Create config object with placeholders for contract addresses
    // These will be updated after deployment
    const config = {
      commandContractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      coordinationContractAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      tacticalContractAddress: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      adminAddresses,
      accounts: walletData
    };
    
    // Create config directory if it doesn't exist
    const configDir = path.join(__dirname, "config");
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }
    
    // Write config to file
    fs.writeFileSync(
      path.join(configDir, "network-config.json"),
      JSON.stringify(config, null, 2)
    );
    
    // Create MetaMask import instructions
    const metamaskInstructions = walletData.slice(0, 20).map(wallet => 
      `Account #${wallet.index}: ${wallet.address}\nPrivate Key: ${wallet.privateKey}\n`
    ).join("\n");
    
    fs.writeFileSync(
      path.join(configDir, "metamask-import.txt"),
      "Import these private keys to MetaMask:\n\n" + metamaskInstructions
    );
    
    console.log(`Config files generated in ${configDir}`);
    console.log("All 20 accounts ready for MetaMask import.");
  });

// Automatically update the App.js config
task("update-app-config", "Updates App.js with the generated config")
  .setAction(async (taskArgs, hre) => {
    // Check if config file exists
    const configPath = path.join(__dirname, "config", "network-config.json");
    if (!fs.existsSync(configPath)) {
      console.error("Config file not found. Run 'npx hardhat generate-config' first.");
      return;
    }
    
    // Read config
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    
    // Look for App.js in various possible locations
    const possibleAppJsPaths = [
      path.join(__dirname, "src", "App.js"),
      path.join(__dirname, "frontend", "src", "App.js")
    ];
    
    let appJsPath = null;
    for (const testPath of possibleAppJsPaths) {
      if (fs.existsSync(testPath)) {
        appJsPath = testPath;
        break;
      }
    }
    
    if (!appJsPath) {
      console.error("App.js not found in any of the expected locations.");
      return;
    }
    
    console.log(`Found App.js at: ${appJsPath}`);
    let appJs = fs.readFileSync(appJsPath, "utf8");
    
    // Create replacement content for contract addresses and admin whitelist
    const contractAddressesStr = 
`// Contract addresses generated from Hardhat
const commandContractAddress = "${config.commandContractAddress}";
const coordinationContractAddress = "${config.coordinationContractAddress}";
const tacticalContractAddress = "${config.tacticalContractAddress}";

// Whitelist of admin addresses - automatically generated
const adminAddresses = [
  "${config.adminAddresses[0]}".toLowerCase(), // Account #0
  "${config.adminAddresses[1]}".toLowerCase(), // Account #1
  "${config.adminAddresses[2]}".toLowerCase()  // Account #2
];`;
    
    // Replace the contract addresses in App.js
    // This uses regex to find and replace the appropriate section
    appJs = appJs.replace(
      /\/\/ (Hard-coded deployed contract addresses|Contract addresses generated from Hardhat)[\s\S]*?(const adminAddresses[\s\S]*?\];)/m,
      contractAddressesStr
    );
    
    // Write updated App.js
    fs.writeFileSync(appJsPath, appJs);
    
    console.log("App.js updated with generated addresses");
  });

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: {
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20, // Changed to 20 accounts
        passphrase: ""
      }
    }
  },
  paths: {
    artifacts: "./src/artifacts",
  }
};