import { ethers } from 'ethers';
import { toast } from 'react-toastify';

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this feature.');
      }

      // Create a Web3Provider using window.ethereum
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Get the signer
      this.signer = this.provider.getSigner();

      // Get the network
      const network = await this.provider.getNetwork();
      
      // Contract address should be environment specific
      const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
      
      if (!contractAddress) {
        throw new Error('Contract address not configured');
      }

      // Create contract instance
      this.contract = new ethers.Contract(
        contractAddress,
        [
          "function markAttendance(string memory sessionId, string memory studentId, uint256 timestamp) public",
          "function getAttendance(string memory sessionId) public view returns (string[] memory)",
          "function createSession(string memory sessionId, string memory classId, uint256 startTime) public",
          "function endSession(string memory sessionId, uint256 endTime) public",
          "function verifyAttendance(string memory sessionId, string memory studentId) public view returns (bool)",
        ],
        this.signer
      );

      this.initialized = true;
    } catch (error) {
      console.error('Blockchain service initialization failed:', error);
      throw error;
    }
  }

  async markAttendance(sessionId, studentId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const tx = await this.contract.markAttendance(sessionId, studentId, timestamp);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      toast.success('Attendance marked on blockchain');
      return receipt;
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      toast.error('Failed to mark attendance on blockchain');
      throw error;
    }
  }

  async createSession(sessionId, classId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const startTime = Math.floor(Date.now() / 1000);
      const tx = await this.contract.createSession(sessionId, classId, startTime);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      toast.success('Session created on blockchain');
      return receipt;
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create session on blockchain');
      throw error;
    }
  }

  async endSession(sessionId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const endTime = Math.floor(Date.now() / 1000);
      const tx = await this.contract.endSession(sessionId, endTime);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      toast.success('Session ended on blockchain');
      return receipt;
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error('Failed to end session on blockchain');
      throw error;
    }
  }

  async getAttendance(sessionId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const attendance = await this.contract.getAttendance(sessionId);
      return attendance;
    } catch (error) {
      console.error('Failed to get attendance:', error);
      toast.error('Failed to fetch attendance from blockchain');
      throw error;
    }
  }

  async verifyAttendance(sessionId, studentId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const isPresent = await this.contract.verifyAttendance(sessionId, studentId);
      return isPresent;
    } catch (error) {
      console.error('Failed to verify attendance:', error);
      toast.error('Failed to verify attendance on blockchain');
      throw error;
    }
  }

  async getWalletAddress() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const address = await this.signer.getAddress();
      return address;
    } catch (error) {
      console.error('Failed to get wallet address:', error);
      throw error;
    }
  }

  async getBalance() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const balance = await this.signer.getBalance();
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }
}

export default new BlockchainService();
