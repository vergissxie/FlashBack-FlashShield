const fs = require('fs');
const path = require('path');
const { ethers } = require('/home/moons/projects/FlashShield/contracts/node_modules/ethers');
const projectRoot = '/home/moons/projects/FlashShield';
const envText = fs.readFileSync(path.join(projectRoot, '.env'), 'utf8');
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).filter(l => !l.trim().startsWith('#') && l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
(async () => {
  const p = new ethers.JsonRpcProvider(env.ETHEREUM_SEPOLIA_RPC_URL);
  const r = await p.getTransactionReceipt('0x7ae6e811f727526f8e3859ac11d03fc5f4e170643c12b1547695f5e58f38d930');
  console.log(JSON.stringify({ blockNumber: r.blockNumber, blockHash: r.blockHash }, null, 2));
})();
