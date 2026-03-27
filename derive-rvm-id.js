const fs = require("fs");
const path = require("path");
const { Wallet } = require("./contracts/node_modules/ethers");

const envPath = path.join(__dirname, ".env");

if (!fs.existsSync(envPath)) {
  throw new Error(".env not found in project root");
}

const envText = fs.readFileSync(envPath, "utf8");

const line = envText
  .split(/\r?\n/)
  .find((item) => item.startsWith("DEPLOYER_PRIVATE_KEY="));

if (!line) {
  throw new Error("DEPLOYER_PRIVATE_KEY not found in .env");
}

const privateKey = line.slice("DEPLOYER_PRIVATE_KEY=".length).trim();

if (!privateKey) {
  throw new Error("DEPLOYER_PRIVATE_KEY is empty");
}

console.log(new Wallet(privateKey).address);
