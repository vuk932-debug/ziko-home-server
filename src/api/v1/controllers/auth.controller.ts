import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { userSchema, loginSchema, otpSchema, phoneOnlySchema } from '../../../shared/schemas/user.schema';

export const registerController = async (req: Request, res: Response) => {
  try {
    const validatedData = userSchema.parse(req.body);
    
    // Public registration is strictly for Customers only
    const result = await authService.register({ ...validatedData, role: 'Customer' });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.errors || error.message });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { user, tokens } = await authService.login(validatedData);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({ user, accessToken: tokens.accessToken });
  } catch (error: any) {
    res.status(401).json({ message: error.errors || error.message });
  }
};

export const forgotPasswordController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'New password is required' });
    }

    const result = await authService.resetPassword(token, password);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const refreshTokenController = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token missing' });
    }

    const tokens = await authService.refreshAccess(refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ accessToken: tokens.accessToken });
  } catch (error: any) {
    res.status(403).json({ message: error.message });
  }
};

export const logoutController = async (req: Request, res: Response) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

export const sendOtpController = async (req: Request, res: Response) => {
  try {
    console.warn('[DEPRECATED] Manual send-otp endpoint called. Transition to MSG91 Widget.');
    const validatedData = phoneOnlySchema.parse(req.body);
    const result = await authService.sendOtpAuth(validatedData.phone, req.body.email);
    
    // In dev mode, result might contain 'code'
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.errors || error.message });
  }
};

export const resendOtpController = async (req: Request, res: Response) => {
  try {
    console.warn('[DEPRECATED] Manual resend-otp endpoint called.');
    const validatedData = phoneOnlySchema.parse(req.body);
    const result = await authService.resendOtpAuth(validatedData.phone);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.errors || error.message });
  }
};

export const verifyOtpController = async (req: Request, res: Response) => {
  try {
    console.warn('[DEPRECATED] Manual verify-otp endpoint called. This may cause HTTP 418 or AuthenticationFailure if used with the Widget.');
    const validatedData = otpSchema.parse(req.body);
    const { user, tokens } = await authService.verifyOtpAuth({ 
      ...validatedData, 
      name: req.body.name, 
      email: req.body.email 
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({ user, accessToken: tokens.accessToken });
  } catch (error: any) {
    res.status(401).json({ message: error.errors || error.message });
  }
};

export const verifyWidgetController = async (req: Request, res: Response) => {
  try {
    console.log('\n--- NEW VERIFICATION REQUEST ---');
    console.log('Payload Received:', JSON.stringify(req.body, null, 2));
    
    const { accessToken, name, email } = req.body;
    const { user, tokens } = await authService.verifyWidgetOtp({ accessToken, name, email });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    console.log('✅ Verification Successful for:', user.phone);
    res.status(200).json({ user, accessToken: tokens.accessToken });
  } catch (error: any) {
    console.error('❌ Verification Failed:', error.message);
    res.status(401).json({ message: error.message });
  }
};

export const validateUserExistenceController = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.query;
    
    if (!identifier || typeof identifier !== 'string') {
      return res.status(200).json({ 
        user_found: false, 
        identifier: identifier || '' 
      });
    }

    const user = await authService.findUserByIdentifier(identifier);
    
    res.status(200).json({
      user_found: !!user,
      identifier: identifier
    });
  } catch (error: any) {
    res.status(200).json({ 
      user_found: false, 
      identifier: (req.query.identifier as string) || '' 
    });
  }
};
