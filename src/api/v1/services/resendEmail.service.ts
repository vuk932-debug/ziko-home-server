import { Resend } from 'resend';

/**
 * Lazily initialize Resend client to avoid crash if API key is missing
 * during development/testing when email is not being used.
 */
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY. Please provide it in your .env file to enable email features.');
  }
  return new Resend(apiKey);
};

/**
 * Sends an OTP email using Resend.
 */
export const sendOTPEmail = async (email: string, otp: string) => {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: 'ZikoHome <noreply@ziko-home.com>',
      to: [email],
      subject: 'Your ZikoHome Verification Code',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Verification Code</h2>
          <p>Hello,</p>
          <p>Your verification code for ZikoHome is:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">&copy; 2026 ZikoHome. All rights reserved.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      throw new Error('Failed to send email');
    }

    return data;
  } catch (err: any) {
    console.error('Email delivery error:', err.message);
    throw err;
  }
};

/**
 * Sends a password reset email using Resend.
 */
export const sendResetEmail = async (email: string, resetUrl: string) => {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: 'ZikoHome <noreply@ziko-home.com>',
      to: [email],
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
          <p>Hello,</p>
          <p>You requested a password reset for your ZikoHome account. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #007bff; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>This link will expire in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
          <p>Alternatively, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">&copy; 2026 ZikoHome. All rights reserved.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      throw new Error('Failed to send email');
    }

    return data;
  } catch (err: any) {
    console.error('Email delivery error:', err.message);
    throw err;
  }
};

/**
 * Sends a lead notification email to the seller.
 */
export const sendLeadNotificationEmail = async (sellerEmail: string, leadData: any, propertyTitle: string) => {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: 'ZikoHome <noreply@ziko-home.com>',
      to: [sellerEmail],
      subject: `New interaction on your property: ${propertyTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">New Lead Received!</h2>
          <p>Hello,</p>
          <p>You have a new lead regarding your property: <strong>${propertyTitle}</strong></p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Buyer Details:</strong></p>
            <ul>
              <li><strong>Name:</strong> ${leadData.buyerName || leadData.name}</li>
              <li><strong>Phone:</strong> ${leadData.buyerPhone || leadData.phone || 'Not provided'}</li>
              <li><strong>Email:</strong> ${leadData.buyerEmail || leadData.email || 'Not provided'}</li>
              <li><strong>Type:</strong> ${leadData.status ? leadData.status.replace('_', ' ').toUpperCase() : 'INTEREST'}</li>
            </ul>
            <p><strong>Message:</strong></p>
            <p style="font-style: italic;">"${leadData.message || 'No message provided.'}"</p>
          </div>
          <p>Please log in to your dashboard to respond to this lead.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">&copy; 2026 ZikoHome. All rights reserved.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      throw new Error('Failed to send email');
    }

    return data;
  } catch (err: any) {
    console.error('Email delivery error:', err.message);
    throw err;
  }
};
