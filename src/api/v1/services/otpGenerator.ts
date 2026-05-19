import crypto from 'crypto';
import bcryptjs from 'bcryptjs';

/**
 * Generates a 6-digit numeric OTP.
 */
export const generateOTPCode = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hashes the OTP code for secure storage.
 */
export const hashOTP = async (code: string): Promise<string> => {
  return await bcryptjs.hash(code, 10);
};

/**
 * Compares a plain OTP code with a hashed one.
 */
export const verifyHash = async (code: string, hash: string): Promise<boolean> => {
  return await bcryptjs.compare(code, hash);
};
