module.exports = {
  providerUrl: process.env.BLOCKCHAIN_PROVIDER_URL || 'http://localhost:8545',
  contractAddress: process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  accountAddress: process.env.ACCOUNT_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  gasLimit: process.env.GAS_LIMIT || 3000000,
  networkId: process.env.NETWORK_ID || '5777'
};
