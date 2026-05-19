import rateLimit from 'express-rate-limit';

// Global API rate-limiter
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins block mapping natively
  max: 100, // 100 bounds per IP address
  message: { message: 'Network traffic anomaly detected mapping to your API. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Extreme lockdown array mapped safely over Authentication requests specifically
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour boundaries
  max: 10, // 10 limits for brutal password stuffing attacks
  message: { message: 'Critical Authentication limits exceeded safely. Account locked for 1 hour.' },
});

// Targeted rate-limiter for OTP requests to prevent SMS API abuse/costs
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 requests per 10 minutes
  message: { message: 'OTP request limit reached. Please try again in 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
