import * as resendEmailService from './resendEmail.service';
import * as devOtpService from './devOtp.service';

/**
 * Delivery Service (Channel-Agnostic)
 * 
 * Handles the actual transmission of OTPs and reset links
 * based on the configured OTP_MODE.
 */

export const deliverOTP = async (identifier: string, code: string, emailForDelivery?: string) => {
  const mode = process.env.OTP_MODE || 'console';

  if (mode === 'console') {
    console.log(`\n==============================================`);
    console.log(`[LOCAL OTP DELIVERY] Identifier: ${identifier}`);
    console.log(`[LOCAL OTP DELIVERY] CODE: ${code}`);
    console.log(`==============================================\n`);
    return;
  }

  if (mode === 'dev-ui') {
    await devOtpService.storeDevOtp(identifier, code);
    console.log(`[DEV-UI] OTP stored for ${identifier}`);
    return;
  }

  if (mode === 'email') {
    const deliveryAddress = emailForDelivery || (identifier.includes('@') ? identifier : null);
    if (!deliveryAddress) {
      throw new Error('Email address required for OTP delivery');
    }
    await resendEmailService.sendOTPEmail(deliveryAddress, code);
    return;
  }

  if (mode === 'sms') {
    // Placeholder for future SMS provider (e.g., Twilio)
    throw new Error('SMS delivery not implemented yet');
  }
};

export const deliverResetLink = async (email: string, resetUrl: string, token: string) => {
  const mode = process.env.OTP_MODE || 'console';

  if (mode === 'console') {
    console.log(`\n==============================================`);
    console.log(`[LOCAL RESET LINK DELIVERY] To: ${email}`);
    console.log(`[LOCAL RESET LINK DELIVERY] URL: ${resetUrl}`);
    console.log(`[LOCAL RESET LINK DELIVERY] TOKEN: ${token}`);
    console.log(`==============================================\n`);
    return;
  }

  if (mode === 'dev-ui') {
    await devOtpService.storeDevOtp(email, 'RESET_LINK', resetUrl);
    console.log(`[DEV-UI] Reset link stored for ${email}`);
    return;
  }

  if (mode === 'email') {
    await resendEmailService.sendResetEmail(email, resetUrl);
    return;
  }

  if (mode === 'sms') {
    throw new Error('SMS reset link delivery not implemented yet');
  }
};
