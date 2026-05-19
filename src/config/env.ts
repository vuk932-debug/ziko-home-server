import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envVarsSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),

  // Required — server cannot start without these
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters'),
  JWT_REFRESH_SECRET: z.string().min(10, 'JWT_REFRESH_SECRET must be at least 10 characters'),

  // Optional — server starts without these (features degrade gracefully)
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  RESEND_API_KEY: z.string().default(''),
  OTP_PROVIDER: z.enum(['mock', 'msg91']).default('mock'),
  MSG91_AUTH_KEY: z.string().default(''),
  MSG91_WIDGET_AUTH_TOKEN: z.string().default(''),
  MSG91_FLOW_ID: z.string().default(''),
  MSG91_SENDER_ID: z.string().default(''),
  OTP_MODE: z.enum(['console', 'dev-ui', 'email', 'sms']).default('console'),
  ENABLE_DEV_OTP_ROUTES: z.string().transform((v) => v === 'true').default('false'),
  DEV_OTP_SECRET: z.string().default('supersecret'),
  ADMIN_EMAIL: z.string().email().default('admin@realistate.com'),
  ADMIN_PASSWORD: z.string().min(6).default('Admin@12345'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  BACKEND_URL: z.string().default('http://localhost:5000'),
});

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVarsSchema> {}
  }
}

export const config = envVarsSchema.parse(process.env);

export const validateEnv = () => {
  try {
    const parsedEnv = envVarsSchema.parse(process.env);
    
    // Production Safety Hardening
    if (parsedEnv.NODE_ENV === 'production') {
      if (parsedEnv.ENABLE_DEV_OTP_ROUTES === true) {
        console.error('\n❌ CRITICAL SECURITY ERROR: DEV OTP routes cannot be enabled in production.');
        process.exit(1);
      }
      if (parsedEnv.JWT_SECRET.length < 16 || parsedEnv.JWT_REFRESH_SECRET.length < 16) {
        console.error('\n❌ CRITICAL SECURITY ERROR: JWT secrets must be at least 16 characters in production.');
        process.exit(1);
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('\n❌ Environment validation failed:');
      error.errors.forEach(e => console.error(`  → [${e.path.join('.')}] ${e.message}`));
      console.error('\nCreate a .env file in /server with DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET\n');
      process.exit(1);
    }
  }
};

