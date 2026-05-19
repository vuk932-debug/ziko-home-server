import prisma from '../../../config/prisma';
import { getOTPProvider } from '../providers/otp';

/**
 * Core OTP Service (Manager)
 * Delegates to the configured provider (Mock or MSG91).
 */

export const sendOTP = async (identifier: string, emailForDelivery?: string): Promise<{ success: boolean; code?: string; message?: string }> => {
  try {
    const provider = getOTPProvider();
    const result = await provider.sendOTP(identifier, emailForDelivery);
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to send OTP');
    }

    return {
      success: true,
      code: result.code,
      message: result.message
    };
  } catch (error: any) {
    console.error('OTP Service Error (sendOTP):', error.message);
    throw error;
  }
};

/**
 * Verifies the OTP.
 */
export const verifyOTP = async (identifier: string, code: string): Promise<boolean> => {
  try {
    const provider = getOTPProvider();
    return await provider.verifyOTP(identifier, code);
  } catch (error: any) {
    console.error('OTP Service Error (verifyOTP):', error.message);
    return false;
  }
};

/**
 * Resends the OTP.
 */
export const resendOTP = async (identifier: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const provider = getOTPProvider();
    return await provider.resendOTP(identifier);
  } catch (error: any) {
    console.error('OTP Service Error (resendOTP):', error.message);
    throw error;
  }
};

/**
 * Periodic Cleanup of expired OTPs (Local DB only).
 */
export const cleanupExpiredOTPs = async () => {
  await prisma.oneTimePassword.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
};
