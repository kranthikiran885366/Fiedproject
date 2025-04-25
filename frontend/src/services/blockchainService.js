import Web3 from 'web3';
import AttendanceContract from '../contracts/AttendanceContract.json';

class BlockchainService {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Connect to local blockchain or provider
      this.web3 = new Web3(Web3.givenProvider || 'http://localhost:8545');
      
      // Get network ID
      const networkId = await this.web3.eth.net.getId();
      
      // Get contract instance
      const deployedNetwork = AttendanceContract.networks[networkId];
      this.contract = new this.web3.eth.Contract(
        AttendanceContract.abi,
        deployedNetwork && deployedNetwork.address
      );

      // Get accounts
      const accounts = await this.web3.eth.getAccounts();
      this.account = accounts[0];
    } catch (error) {
      console.error('Blockchain initialization error:', error);
    }
  }

  async recordAttendance(data) {
    if (!this.contract) {
      throw new Error('Blockchain contract not initialized');
    }

    const {
      studentId,
      classId,
      timestamp,
      location,
      verificationMethod,
      verificationData
    } = data;

    // Create hash of attendance record
    const attendanceHash = this.web3.utils.soliditySha3(
      studentId,
      classId,
      timestamp,
      JSON.stringify(location),
      verificationMethod,
      verificationData
    );

    try {
      // Record attendance on blockchain
      const result = await this.contract.methods
        .recordAttendance(
          studentId,
          classId,
          timestamp,
          attendanceHash
        )
        .send({ from: this.account });

      return {
        success: true,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber
      };
    } catch (error) {
      console.error('Blockchain recording error:', error);
      throw error;
    }
  }

  async verifyAttendance(attendanceId) {
    if (!this.contract) {
      throw new Error('Blockchain contract not initialized');
    }

    try {
      const record = await this.contract.methods
        .getAttendanceRecord(attendanceId)
        .call();

      return {
        verified: true,
        record: {
          studentId: record.studentId,
          classId: record.classId,
          timestamp: record.timestamp,
          hash: record.attendanceHash
        }
      };
    } catch (error) {
      console.error('Blockchain verification error:', error);
      throw error;
    }
  }

  async getAttendanceHistory(studentId, startDate, endDate) {
    if (!this.contract) {
      throw new Error('Blockchain contract not initialized');
    }

    try {
      const records = await this.contract.methods
        .getStudentAttendanceHistory(studentId, startDate, endDate)
        .call();

      return records.map(record => ({
        id: record.id,
        studentId: record.studentId,
        classId: record.classId,
        timestamp: record.timestamp,
        hash: record.attendanceHash,
        blockNumber: record.blockNumber
      }));
    } catch (error) {
      console.error('Blockchain history retrieval error:', error);
      throw error;
    }
  }

  async getClassAttendance(classId, date) {
    if (!this.contract) {
      throw new Error('Blockchain contract not initialized');
    }

    try {
      const records = await this.contract.methods
        .getClassAttendance(classId, date)
        .call();

      return records.map(record => ({
        id: record.id,
        studentId: record.studentId,
        timestamp: record.timestamp,
        hash: record.attendanceHash,
        blockNumber: record.blockNumber
      }));
    } catch (error) {
      console.error('Blockchain class attendance retrieval error:', error);
      throw error;
    }
  }
}

export default new BlockchainService();
