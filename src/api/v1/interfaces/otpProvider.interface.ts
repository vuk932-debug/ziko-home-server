export interface OTPResponse {
  success: boolean;
  message?: string;
  code?: string; // only for dev/testing
}

export interface IOTPProvider {
  /**
   * Sends an OTP to the given identifier (phone or email).
   */
  sendOTP(identifier: string, emailForDelivery?: string): Promise<OTPResponse>;

  /**
   * Verifies the OTP code for the given identifier.
   */
  verifyOTP(identifier: string, code: string): Promise<boolean>;

  /**
   * Resends the OTP to the given identifier.
   */
  resendOTP(identifier: string): Promise<OTPResponse>;
}
