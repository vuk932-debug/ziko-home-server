import { IOTPProvider } from '../../interfaces/otpProvider.interface';
import { MockOTPProvider } from './mock.provider';
import { MSG91OTPProvider } from './msg91.provider';

export const getOTPProvider = (): IOTPProvider => {
  const provider = process.env.OTP_PROVIDER || 'mock';

  switch (provider) {
    case 'msg91':
      return new MSG91OTPProvider();
    case 'mock':
    default:
      return new MockOTPProvider();
  }
};
