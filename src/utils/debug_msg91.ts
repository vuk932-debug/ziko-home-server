import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load env from the server directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const AUTH_KEY = (process.env.MSG91_WIDGET_AUTH_TOKEN || process.env.MSG91_AUTH_KEY || '').trim();
// We'll use the token from your last failed request for testing
const TEST_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyZXF1ZXN0SWQiOiIzNjY1NmM3MzY0NjYzMDMzMzkzMDM2MzkiLCJjb21wYW55SWQiOjUxNDY0NH0.oP-t03-qyW2cz3yOgjH5Vsuz7rzruiggN-ISc7hZOB8";

async function runDiagnostics() {
  console.log('--- MSG91 BACKEND DIAGNOSTICS ---');
  console.log(`AuthKey Length: ${AUTH_KEY.length}`);
  console.log(`AuthKey Start: ${AUTH_KEY.substring(0, 4)}...`);
  
  if (!AUTH_KEY) {
    console.error('❌ ERROR: No AuthKey found in .env');
    return;
  }

  const tests = [
    {
      name: 'Standard Widget Verify (control.msg91.com)',
      url: 'https://control.msg91.com/api/v5/widget/accessToken',
      body: { accessToken: TEST_TOKEN },
      headers: { Authkey: AUTH_KEY }
    },
    {
      name: 'Alternate Endpoint (api.msg91.com)',
      url: 'https://api.msg91.com/api/v5/widget/verifyAccessToken',
      body: { 'access-token': TEST_TOKEN },
      headers: { authkey: AUTH_KEY }
    },
    {
      name: 'Account Details Check (Verify if Key is valid at all)',
      url: 'https://api.msg91.com/api/v5/balance.php',
      method: 'GET',
      params: { authkey: AUTH_KEY, type: 4 }
    }
  ];

  for (const test of tests) {
    console.log(`\nTesting: ${test.name}...`);
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...test.headers
        },
        params: test.params
      };

      const response = test.method === 'GET' 
        ? await axios.get(test.url, config)
        : await axios.post(test.url, test.body, config);

      console.log(`✅ Success! Status: ${response.status}`);
      console.log(`Response: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      console.error(`❌ FAILED: ${error.message}`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.log(`Error Data: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}

runDiagnostics();
