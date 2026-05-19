import axios from 'axios';
import { IOTPProvider, OTPResponse } from '../../interfaces/otpProvider.interface';
import prisma from '../../../../config/prisma';

const RESEND_COOLDOWN_SECONDS = 60;

export class MSG91OTPProvider implements IOTPProvider {
  private readonly authKey: string;
  private readonly flowId: string;
  private readonly senderId: string;

  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY || '';
    this.flowId = process.env.MSG91_FLOW_ID || '';
    this.senderId = process.env.MSG91_SENDER_ID || '';
  }

  async sendOTP(identifier: string): Promise<OTPResponse> {
    try {
      // 1. Local Cooldown Check
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

      // 2. MSG91 expects phone number with country code but without '+'
      const phone = identifier.replace('+', '');
      
      const response = await axios.post('https://control.msg91.com/api/v5/otp', null, {
        headers: {
          authkey: this.authKey,
          'Content-Type': 'application/json'
        },
        params: {
          template_id: this.flowId,
          mobile: phone,
          sender: this.senderId
        }
      });

      console.log('MSG91 API Response:', JSON.stringify(response.data));

      if (response.data.type === 'success') {
        // 3. Update local tracking for cooldown and analytics
        await prisma.oneTimePassword.upsert({
          where: { identifier },
          update: { updatedAt: new Date(), codeHash: 'MSG91_EXTERNAL', expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
          create: { identifier, codeHash: 'MSG91_EXTERNAL', expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
        });

        const user = await prisma.user.findFirst({
          where: { OR: [{ email: identifier }, { phone: identifier }] }
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              otpAttempts: 0,
              otpLastSentAt: new Date()
            }
          });
        }

        return { success: true, message: 'OTP sent via MSG91' };
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Failed to send OTP via MSG91' 
        };
      }
    } catch (error: any) {
      console.error('MSG91OTPProvider Error (sendOTP):', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error communicating with MSG91' 
      };
    }
  }

  async verifyOTP(identifier: string, code: string): Promise<boolean> {
    try {
      console.warn(`[MSG91-PROVIDER] Manual verifyOTP called for ${identifier}. This is deprecated.`);
      const phone = identifier.replace('+', '');
      
      const response = await axios.get('https://control.msg91.com/api/v5/otp/verify', {
        headers: {
          authkey: this.authKey
        },
        params: {
          otp: code,
          mobile: phone
        }
      });

      const isValid = response.data.type === 'success';

      if (isValid) {
        // Cleanup local tracking on success
        await prisma.oneTimePassword.delete({ where: { identifier } }).catch(() => {});
      }

      return isValid;
    } catch (error: any) {
      console.error('MSG91OTPProvider Error (verifyOTP):', error.response?.data || error.message);
      return false;
    }
  }

  async resendOTP(identifier: string): Promise<OTPResponse> {
    try {
      const phone = identifier.replace('+', '');
      
      const response = await axios.get('https://control.msg91.com/api/v5/otp/retry', {
        headers: {
          authkey: this.authKey
        },
        params: {
          mobile: phone,
          retrytype: 'text'
        }
      });

      if (response.data.type === 'success') {
        // Update updatedAt for local cooldown
        await prisma.oneTimePassword.update({
          where: { identifier },
          data: { updatedAt: new Date() }
        }).catch(() => {});

        return { success: true, message: 'OTP resent via MSG91' };
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Failed to resend OTP via MSG91' 
        };
      }
    } catch (error: any) {
      console.error('MSG91OTPProvider Error (resendOTP):', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error communicating with MSG91' 
      };
    }
  }
}
