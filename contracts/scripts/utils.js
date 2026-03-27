const fs = require("fs");
const path = require("path");

function loadEnvFile(projectRoot) {
  const envPath = path.join(projectRoot, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function saveDeployment(projectRoot, deployment) {
  const deploymentsDir = path.join(projectRoot, "contracts", "deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });

  const filePath = path.join(
    deploymentsDir,
    `${deployment.network}-${deployment.contractName}.json`
  );

  fs.writeFileSync(filePath, JSON.stringify(deployment, null, 2));
  return filePath;
}

module.exports = {
  loadEnvFile,
  requireEnv,
  saveDeployment,
};
