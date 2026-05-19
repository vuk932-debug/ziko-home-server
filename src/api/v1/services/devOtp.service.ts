import prisma from '../../../config/prisma';

/**
 * Dev OTP Store Service
 * ONLY used in dev/staging modes for inspection via API
 */

export const storeDevOtp = async (identifier: string, otp: string, resetToken?: string) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.devOtp.create({
    data: {
      identifier,
      otp,
      resetToken,
      expiresAt,
    },
  });
};

export const getLatestOtps = async (limit: number = 10) => {
  return await prisma.devOtp.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

export const getOtpsByIdentifier = async (identifier: string) => {
  return await prisma.devOtp.findMany({
    where: { identifier },
    orderBy: { createdAt: 'desc' },
  });
};

export const cleanupExpiredDevOtps = async () => {
  await prisma.devOtp.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
};
