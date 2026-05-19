import prisma from '../../../config/prisma';
import * as otpGenerator from './otpGenerator';

const MAX_ATTEMPTS = 5;

/**
 * Verifies an OTP code for a given identifier.
 */
export const verifyOTP = async (identifier: string, code: string): Promise<boolean> => {
  const otpRecord = await prisma.oneTimePassword.findUnique({
    where: { identifier },
  });

  if (!otpRecord) return false;

  // Check expiry
  if (new Date() > otpRecord.expiresAt) {
    await cleanup(identifier);
    return false;
  }

  // Check attempts
  if (otpRecord.attempts >= MAX_ATTEMPTS) {
    await cleanup(identifier);
    return false;
  }

  // Verify hash
  const isValid = await otpGenerator.verifyHash(code, otpRecord.codeHash);

  if (!isValid) {
    await incrementAttempts(identifier);
    return false;
  }

  // Success: Clean up both tables
  await cleanup(identifier);
  return true;
};

const incrementAttempts = async (identifier: string) => {
  await prisma.oneTimePassword.update({
    where: { identifier },
    data: { attempts: { increment: 1 } },
  });

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: identifier }] }
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { otpAttempts: { increment: 1 } }
    });
  }
};

const cleanup = async (identifier: string) => {
  await prisma.oneTimePassword.delete({ where: { identifier } }).catch(() => {});

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: identifier }] }
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCodeHash: null,
        otpExpiresAt: null,
        otpAttempts: 0
      }
    });
  }
};
