import { IOTPProvider, OTPResponse } from '../../interfaces/otpProvider.interface';
import prisma from '../../../../config/prisma';
import * as otpGenerator from '../../services/otpGenerator';
import * as otpVerifier from '../../services/otpVerifier';
import * as deliveryService from '../../services/delivery.service';

const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

export class MockOTPProvider implements IOTPProvider {
  async sendOTP(identifier: string, emailForDelivery?: string): Promise<OTPResponse> {
    try {
      // 1. Check for cooldown
      const existingOTP = await prisma.oneTimePassword.findUnique({
        where: { identifier },
      });

      if (existingOTP) {
        const secondsSinceLastSent = (Date.now() - existingOTP.updatedAt.getTime()) / 1000;
        if (secondsSinceLastSent < RESEND_COOLDOWN_SECONDS) {
          return {
            success: false,
            message: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastSent)} seconds before requesting a new code.`
          };
        }
      }

      // 2. Generate and Hash OTP
      const code = otpGenerator.generateOTPCode();
      const codeHash = await otpGenerator.hashOTP(code);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      // 3. Store in Universal OTP Table
      await prisma.oneTimePassword.upsert({
        where: { identifier },
        update: { codeHash, expiresAt, attempts: 0 },
        create: { identifier, codeHash, expiresAt },
      });

      // 4. ALSO store in User table if user exists
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { phone: identifier }]
        }
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            otpCodeHash: codeHash,
            otpExpiresAt: expiresAt,
            otpAttempts: 0,
            otpLastSentAt: new Date()
          }
        });
      }

      // 5. Hand off to delivery service
      await deliveryService.deliverOTP(identifier, code, emailForDelivery);

      return { 
        success: true, 
        code: process.env.NODE_ENV === 'development' ? code : undefined 
      };
    } catch (error: any) {
      console.error('MockOTPProvider Error (sendOTP):', error.message);
      return { success: false, message: error.message };
    }
  }

  async verifyOTP(identifier: string, code: string): Promise<boolean> {
    return await otpVerifier.verifyOTP(identifier, code);
  }

  async resendOTP(identifier: string): Promise<OTPResponse> {
    return await this.sendOTP(identifier);
  }
}
