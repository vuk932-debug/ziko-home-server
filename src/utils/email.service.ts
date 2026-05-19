import * as resendEmailService from '../api/v1/services/resendEmail.service';

/**
 * 📌 1. Seller Lead Notification
 */
export const sendSellerLeadNotification = async (
  sellerEmail: string,
  leadData: any,
  propertyTitle: string
) => {
  await resendEmailService.sendLeadNotificationEmail(sellerEmail, leadData, propertyTitle);
};

/**
 * 📌 2. Password Reset Email
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string
) => {
  await resendEmailService.sendResetEmail(email, resetUrl);
};