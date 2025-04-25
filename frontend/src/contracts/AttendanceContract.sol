// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AttendanceContract {
    struct AttendanceRecord {
        uint256 id;
        string studentId;
        string classId;
        uint256 timestamp;
        bytes32 attendanceHash;
        uint256 blockNumber;
        bool verified;
    }

    // Mappings
    mapping(uint256 => AttendanceRecord) public attendanceRecords;
    mapping(string => uint256[]) public studentAttendance;
    mapping(string => uint256[]) public classAttendance;

    // State variables
    uint256 public recordCount;
    address public owner;
    
    // Events
    event AttendanceRecorded(
        uint256 indexed id,
        string studentId,
        string classId,
        uint256 timestamp,
        bytes32 attendanceHash
    );
    
    event AttendanceVerified(
        uint256 indexed id,
        string studentId,
        string classId,
        bool verified
    );

    // Constructor
    constructor() {
        owner = msg.sender;
        recordCount = 0;
    }

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // Functions
    function recordAttendance(
        string memory studentId,
        string memory classId,
        uint256 timestamp,
        bytes32 attendanceHash
    ) public returns (uint256) {
        recordCount++;
        
        AttendanceRecord memory newRecord = AttendanceRecord({
            id: recordCount,
            studentId: studentId,
            classId: classId,
            timestamp: timestamp,
            attendanceHash: attendanceHash,
            blockNumber: block.number,
            verified: false
        });
        
        attendanceRecords[recordCount] = newRecord;
        studentAttendance[studentId].push(recordCount);
        classAttendance[classId].push(recordCount);
        
        emit AttendanceRecorded(
            recordCount,
            studentId,
            classId,
            timestamp,
            attendanceHash
        );
        
        return recordCount;
    }

    function verifyAttendance(uint256 recordId) public onlyOwner {
        require(recordId <= recordCount, "Record does not exist");
        
        AttendanceRecord storage record = attendanceRecords[recordId];
        record.verified = true;
        
        emit AttendanceVerified(
            recordId,
            record.studentId,
            record.classId,
            true
        );
    }

    function getAttendanceRecord(uint256 recordId) public view returns (
        string memory studentId,
        string memory classId,
        uint256 timestamp,
        bytes32 attendanceHash,
        bool verified
    ) {
        require(recordId <= recordCount, "Record does not exist");
        
        AttendanceRecord memory record = attendanceRecords[recordId];
        return (
            record.studentId,
            record.classId,
            record.timestamp,
            record.attendanceHash,
            record.verified
        );
    }

    function getStudentAttendanceHistory(string memory studentId) public view returns (uint256[] memory) {
        return studentAttendance[studentId];
    }

    function getClassAttendance(string memory classId) public view returns (uint256[] memory) {
        return classAttendance[classId];
    }

    function getAttendanceCount() public view returns (uint256) {
        return recordCount;
    }

    // Admin functions
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid new owner address");
        owner = newOwner;
    }
}
