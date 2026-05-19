import { sendOtpAuth } from '../api/v1/services/auth.service';
import dotenv from 'dotenv';

dotenv.config();

async function testOtp() {
  const phone = '+919353950078';
  console.log(`\n[TEST] Initiating OTP request for: ${phone}`);
  console.log(`[TEST] Provider: ${process.env.OTP_PROVIDER || 'mock'}`);
  
  try {
    const result = await sendOtpAuth(phone);
    console.log(`\n✅ SUCCESS: ${result.message}`);
    if (result.code) {
      console.log(`\n>>> YOUR CODE IS: ${result.code} <<<`);
      console.log(`\n(In production with MSG91, this code would be sent to your phone and NOT returned in the API response)\n`);
    }
  } catch (error: any) {
    console.error(`\n❌ FAILED: ${error.message}`);
  }
}

testOtp();
