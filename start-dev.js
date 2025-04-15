const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to check if port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const netstat = exec(`netstat -ano | findstr :${port}`);
    let data = '';
    
    netstat.stdout.on('data', (chunk) => {
      data += chunk;
    });
    
    netstat.on('close', (code) => {
      resolve(data.includes(':' + port));
    });
  });
}

// Function to kill process on a port (Windows)
async function killProcessOnPort(port) {
  return new Promise((resolve) => {
    const findPID = exec(`netstat -ano | findstr :${port}`);
    let data = '';
    
    findPID.stdout.on('data', (chunk) => {
      data += chunk;
    });
    
    findPID.on('close', async () => {
      // Extract PID from netstat output
      const lines = data.split('\n');
      for (const line of lines) {
        if (line.includes(':' + port)) {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 4) {
            const pid = parts[4];
            console.log(`Killing process with PID ${pid} on port ${port}`);
            exec(`taskkill /F /PID ${pid}`);
          }
        }
      }
      resolve();
    });
  });
}

// Function to run a command and return a promise
function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

// Main function
async function main() {
  try {
    // Check if port 8545 is already in use
    const portInUse = await isPortInUse(8545);
    if (portInUse) {
      console.log("Port 8545 is already in use. Attempting to kill the process...");
      await killProcessOnPort(8545);
      // Wait a moment for the process to be fully terminated
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 1. Start Hardhat node (in the background)
    const hardhatNode = spawn('npx', ['hardhat', 'node'], {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    
    // Give the node a moment to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 2. Generate the config with 20 accounts
    await runCommand('npx', ['hardhat', 'generate-config', '--limit', '20'], process.cwd());
    
    // 3. Deploy contracts
    await runCommand('npx', ['hardhat', 'run', '--network', 'localhost', 'scripts/deploy.js'], process.cwd());
    
    // 4. Update App.js with the generated addresses
    await runCommand('npx', ['hardhat', 'update-app-config'], process.cwd());
    
    // 5. Display MetaMask import instructions
    console.log("\n=== METAMASK IMPORT INSTRUCTIONS ===");
    const metamaskInstructions = fs.readFileSync(
      path.join(process.cwd(), 'config', 'metamask-import.txt'),
      'utf8'
    );
    console.log(metamaskInstructions);
    console.log("=====================================\n");
    
    // 6. Start React development server
    await runCommand('npm', ['start'], process.cwd());
    
    // Clean up (this will run if the React server is stopped)
    process.on('SIGINT', () => {
      console.log('Stopping Hardhat node...');
      hardhatNode.kill();
      process.exit();
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();