import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import axios from 'axios';
import { 
  findUserByEmail, 
  findUserByPhone, 
  createUser, 
  updateUser, 
  findUserById,
  findUserByResetToken
} from '../repositories/user.repository';
import * as otpService from './otp.service';
import * as deliveryService from './delivery.service';
import { config } from '../../../config/env';

export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ id: userId }, config.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId }, config.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const register = async (data: any) => {
  const { phone, email, name, password, accessToken } = data;

  if (!phone) {
    throw new Error('Phone number is required');
  }

  if (!accessToken) {
    throw new Error('OTP verification token is required for registration');
  }

  // Validate the MSG91 token and get the verified phone
  const verifiedPhone = await validateMsg91Token(accessToken);
  
  // Ensure the verified phone matches the one provided in the form (or just use the verified one)
  // Normalizing both for comparison
  const normalizedInputPhone = phone.startsWith('+') ? phone : `+${phone}`;
  if (verifiedPhone !== normalizedInputPhone) {
    console.warn(`Registration phone mismatch: Input=${normalizedInputPhone}, Verified=${verifiedPhone}`);
    // We'll proceed with the verified phone to be safe, or throw error
    // Throwing error is safer to prevent session hijacking if someone tries to register with a different number than verified
    throw new Error('Verified phone number does not match registration phone number');
  }

  const [existingEmail, existingPhone] = await Promise.all([
    email ? findUserByEmail(email) : Promise.resolve(null),
    findUserByPhone(verifiedPhone)
  ]);

  if (existingEmail) {
    throw new Error('User with this email already exists');
  }
  if (existingPhone) {
    throw new Error('User with this phone number already exists');
  }

  const user = await createUser({
    name,
    phone: verifiedPhone,
    email: email || undefined,
    password,
    role: 'Customer',
    isApproved: true,
    isVerified: true // Set to true since OTP was validated
  });

  return { 
    message: 'User registered successfully', 
    user: { id: user.id, email: user.email, name: user.name, role: user.role, profileCompleted: user.profileCompleted } 
  };
};

export const login = async (data: any) => {
  const user = await findUserByEmail(data.email);
  if (!user || !user.password) {
    throw new Error('Invalid email or password');
  }

  if (user.isBanned || !user.isActive) {
    throw new Error('Your account is inactive or has been suspended. Please contact administration.');
  }

  const isMatch = await bcryptjs.compare(data.password, user.password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const tokens = generateTokens(user.id);
  await updateUser(user.id, { refreshToken: tokens.refreshToken });

  return { user: { id: user.id, name: user.name, email: user.email, role: user.role, isApproved: user.isApproved, profileCompleted: user.profileCompleted }, tokens };
};

export const refreshAccess = async (refreshToken: string) => {
  try {
    const decoded: any = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    const user = await findUserById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    const tokens = generateTokens(user.id);
    await updateUser(user.id, { refreshToken: tokens.refreshToken });

    return tokens;
  } catch (err) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * @deprecated Use verifyWidgetOtp instead. This manual OTP flow is being phased out
 * in favor of the MSG91 Authentication Widget which handles the full lifecycle.
 */
export const sendOtpAuth = async (phone: string, email?: string) => {
  if (!phone) throw new Error('Phone number is required');
  const result = await otpService.sendOTP(phone, email);
  if (!result.success) throw new Error(result.message || 'Failed to send OTP');
  return { message: result.message || 'OTP sent successfully', code: result.code };
};

/**
 * @deprecated Manual OTP resend is deprecated.
 */
export const resendOtpAuth = async (phone: string) => {
  if (!phone) throw new Error('Phone number is required');
  const result = await otpService.resendOTP(phone);
  if (!result.success) throw new Error(result.message || 'Failed to resend OTP');
  return { message: result.message || 'OTP resent successfully' };
};

/**
 * @deprecated Use verifyWidgetOtp instead. This performs manual server-side verification
 * which conflicts with the MSG91 Widget's internal verification.
 */
export const verifyOtpAuth = async (data: { phone: string, code: string, name?: string, email?: string }) => {
  const { phone, code, name, email } = data;
  
  if (!phone || !code) {
    throw new Error('Phone and OTP code are required');
  }

  const isValid = await otpService.verifyOTP(phone, code);
  if (!isValid) {
    throw new Error('Invalid or expired OTP');
  }

  return await handleUserSession(phone, name, email);
};

/**
 * Internal helper to validate MSG91 Widget Access Token.
 */
export const validateMsg91Token = async (accessToken: string): Promise<string> => {
  if (!accessToken) throw new Error('Access token is required');

  const authKey = (config.MSG91_AUTH_KEY || "514644AgsSOf1wcDT6a03794eP1").trim();

  try {
    console.log(`--- MSG91 Widget Validation ---`);
    console.log(`Endpoint: https://control.msg91.com/api/v5/widget/verifyAccessToken`);
    
    // Exactly as per user provided documentation:
    // Body: authkey AND access-token
    const response = await axios.post('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
      authkey: authKey,
      'access-token': accessToken
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`MSG91 Response:`, JSON.stringify(response.data));

    if (response.data.type === 'success') {
      // MSG91 returns verified phone directly in 'message' for this endpoint
      const phone = `+${response.data.message || response.data.data?.mobile}`;
      console.log('✅ Token Verified Successfully. Phone:', phone);
      return phone;
    }

    if (response.data.code === "418") {
      try {
        const ipRes = await axios.get('https://api.ipify.org?format=json');
        console.error(`❌ MSG91 Error 418: Server IP (${ipRes.data.ip}) is not whitelisted in MSG91 dashboard.`);
        throw new Error(`IP Whitelist Error: Please add ${ipRes.data.ip} to MSG91`);
      } catch (e) {
        console.error('❌ MSG91 Error 418: IP is not whitelisted. Please whitelist your server IP in MSG91 dashboard.');
      }
    }

    throw new Error(response.data.message || 'AuthenticationFailure');
  } catch (error: any) {
    const errorData = error.response?.data;
    console.error('❌ MSG91 Token Validation Error:', errorData || error.message);
    throw new Error(errorData?.message || error.message || 'AuthenticationFailure');
  }
};

/**
 * Validates the MSG91 Widget Access Token and establishes a user session.
 */
export const verifyWidgetOtp = async (data: { accessToken: string, name?: string, email?: string }) => {
  const { accessToken, name: inputName, email: inputEmail } = data;
  
  console.log(`\n--- verifyWidgetOtp ---`);
  console.log(`Token Received (len=${accessToken?.length}): ${accessToken?.substring(0, 20)}...`);
  
  const phone = await validateMsg91Token(accessToken);
  return await handleUserSession(phone, inputName, inputEmail);
};

// Helper to consolidate login/signup logic
const handleUserSession = async (phone: string, name?: string, email?: string) => {
  let user = await findUserByPhone(phone);

  if (!user) {
    if (!name) throw new Error('Name is required for new users');
    if (email) {
      const existingEmail = await findUserByEmail(email);
      if (existingEmail) throw new Error('Email already associated with another account.');
    }

    user = await createUser({
      name,
      phone,
      email: email || undefined,
      role: 'Customer',
      isApproved: true,
      isVerified: true
    });
  }

  if (user.isBanned) throw new Error('Account suspended.');

  const tokens = generateTokens(user.id);
  await updateUser(user.id, { refreshToken: tokens.refreshToken });

  return {
    user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role, profileCompleted: user.profileCompleted },
    tokens
  };
};

export const forgotPassword = async (email: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('User with this email does not exist');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  await updateUser(user.id, {
    resetTokenHash: hashedToken,
    resetTokenExpiry: expires,
    passwordResetToken: hashedToken, // legacy
    passwordResetExpires: expires    // legacy
  });

  const clientBaseUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
  const resetUrl = `${clientBaseUrl}/reset-password/${resetToken}`;
  await deliveryService.deliverResetLink(user.email!, resetUrl, resetToken);

  return { message: 'Reset link sent successfully' };
};

export const resetPassword = async (token: string, newPassword: any) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  // Try finding by new field first
  let user = await findUserByResetToken(hashedToken);

  if (!user) {
    throw new Error('Invalid or expired password reset token');
  }

  // Double check expiry
  if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
    throw new Error('Password reset token has expired');
  }

  await updateUser(user.id, {
    password: newPassword,
    resetTokenHash: null,
    resetTokenExpiry: null,
    passwordResetToken: null,
    passwordResetExpires: null
  });

  return { message: 'Password reset successful' };
};

export const findUserByIdentifier = async (identifier: string) => {
  if (identifier.includes('@')) {
    return await findUserByEmail(identifier);
  }
  return await findUserByPhone(identifier);
};
