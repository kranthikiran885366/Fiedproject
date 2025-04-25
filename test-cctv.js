const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  backendUrl: 'http://localhost:5000',
  testClassId: 'test-class-id',
  testStudentId: 'test-student-id',
  capturePath: path.join(__dirname, 'captures')
};

// Ensure capture directory exists
if (!fs.existsSync(config.capturePath)) {
  fs.mkdirSync(config.capturePath, { recursive: true });
}

// Test steps
const testSteps = [
  {
    name: 'Start Backend Server',
    command: 'cd backend && npm start',
    waitFor: 'Server is running on port 5000'
  },
  {
    name: 'Start Frontend Development Server',
    command: 'cd frontend && npm start',
    waitFor: 'Compiled successfully'
  },
  {
    name: 'Run Backend Tests',
    command: 'cd backend && npm test',
    waitFor: 'Tests completed'
  },
  {
    name: 'Run Frontend Tests',
    command: 'cd frontend && npm test',
    waitFor: 'Tests completed'
  }
];

// Run tests
async function runTests() {
  console.log('Starting CCTV Monitoring System Tests...\n');

  for (const step of testSteps) {
    console.log(`\n=== ${step.name} ===`);
    
    try {
      const result = await new Promise((resolve, reject) => {
        const process = exec(step.command);
        let output = '';

        process.stdout.on('data', (data) => {
          output += data;
          console.log(data);
          
          if (output.includes(step.waitFor)) {
            process.kill();
            resolve(true);
          }
        });

        process.stderr.on('data', (data) => {
          console.error(data);
        });

        process.on('error', (error) => {
          reject(error);
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          process.kill();
          reject(new Error('Timeout'));
        }, 30000);
      });

      console.log(`✓ ${step.name} completed successfully`);
    } catch (error) {
      console.error(`✗ ${step.name} failed:`, error.message);
      process.exit(1);
    }
  }

  console.log('\nAll tests completed successfully!');
  process.exit(0);
}

// Run the tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
}); 