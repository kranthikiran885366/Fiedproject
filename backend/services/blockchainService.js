const { ethers } = require('ethers');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Class = require('../models/Class');

class BlockchainService {
    constructor() {
        this.enabled = false;
        
        if (!process.env.BLOCKCHAIN_RPC_URL) {
            console.warn('BLOCKCHAIN_RPC_URL not set. Blockchain features will be disabled.');
            return;
        }

        try {
            this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
            this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
            this.contract = new ethers.Contract(
                process.env.CONTRACT_ADDRESS,
                [
                    'function storeAttendance(bytes32 attendanceId, bytes32 studentId, bytes32 classId, uint256 timestamp, bool status)',
                    'function getAttendance(bytes32 attendanceId) view returns (bytes32, bytes32, uint256, bool)',
                    'event AttendanceStored(bytes32 indexed attendanceId, bytes32 indexed studentId, bytes32 indexed classId, uint256 timestamp, bool status)'
                ],
                this.wallet
            );
            this.enabled = true;
            console.log('Blockchain service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize blockchain service:', error);
            this.enabled = false;
        }
    }

    // Store attendance record on blockchain
    async storeAttendanceOnChain(attendanceId, studentId, classId, timestamp, status) {
        if (!this.enabled) {
            console.warn('Blockchain service is disabled');
            return null;
        }

        try {
            const tx = await this.contract.storeAttendance(
                ethers.encodeBytes32String(attendanceId),
                ethers.encodeBytes32String(studentId),
                ethers.encodeBytes32String(classId),
                timestamp,
                status
            );
            
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Blockchain storage failed:', error);
            throw new Error('Failed to store attendance on blockchain');
        }
    }

    // Verify attendance record from blockchain
    async verifyAttendance(attendanceId) {
        if (!this.enabled) {
            console.warn('Blockchain service is disabled');
            return null;
        }

        try {
            const record = await this.contract.getAttendance(
                ethers.encodeBytes32String(attendanceId)
            );
            return {
                studentId: ethers.decodeBytes32String(record[0]),
                classId: ethers.decodeBytes32String(record[1]),
                timestamp: new Date(record[2] * 1000),
                status: record[3]
            };
        } catch (error) {
            console.error('Blockchain verification failed:', error);
            throw new Error('Failed to verify attendance from blockchain');
        }
    }

    // Batch store attendance records
    async batchStoreAttendance(records) {
        if (!this.enabled) {
            console.warn('Blockchain service is disabled');
            return [];
        }

        const hashes = [];
        for (const record of records) {
            const hash = await this.storeAttendanceOnChain(
                record.attendanceId,
                record.studentId,
                record.classId,
                Math.floor(record.timestamp.getTime() / 1000),
                record.status
            );
            hashes.push(hash);
        }
        return hashes;
    }

    // Generate attendance proof
    async generateAttendanceProof(attendanceId) {
        if (!this.enabled) {
            console.warn('Blockchain service is disabled');
            return null;
        }

        try {
            const record = await this.verifyAttendance(attendanceId);
            const attendance = await Attendance.findById(attendanceId);
            const student = await User.findById(attendance.studentId);
            const classInfo = await Class.findById(attendance.classId);

            return {
                attendanceId,
                student: {
                    id: student._id,
                    name: student.fullName,
                    regNumber: student.regNumber
                },
                class: {
                    id: classInfo._id,
                    name: classInfo.name,
                    subject: classInfo.subject
                },
                timestamp: record.timestamp,
                status: record.status,
                blockchainHash: await this.getTransactionHash(attendanceId)
            };
        } catch (error) {
            console.error('Failed to generate attendance proof:', error);
            throw error;
        }
    }

    // Get transaction hash for attendance record
    async getTransactionHash(attendanceId) {
        if (!this.enabled) {
            console.warn('Blockchain service is disabled');
            return null;
        }

        try {
            const filter = this.contract.filters.AttendanceStored(
                ethers.encodeBytes32String(attendanceId)
            );
            const events = await this.contract.queryFilter(filter);
            return events[0]?.transactionHash;
        } catch (error) {
            console.error('Failed to get transaction hash:', error);
            throw error;
        }
    }
}

module.exports = new BlockchainService();
