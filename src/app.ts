import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { validateEnv, config } from './config/env';
import authRoutes from './api/v1/routes/auth.routes';
import subscriptionRoutes from './api/v1/routes/subscription.routes';
import propertyRoutes from './api/v1/routes/property.routes';
import adminRoutes from './api/v1/routes/admin.routes';
import customerRoutes from './api/v1/routes/customer.routes';
import cpRoutes from './api/v1/routes/cp.routes';
import leadRoutes from './api/v1/routes/lead.routes';
import locationRoutes from './api/v1/routes/location.routes';
import blogRoutes from './api/v1/routes/blog.routes';
import engagementRoutes from './api/v1/routes/engagement.routes';
import devOtpRoutes from './api/v1/routes/devOtp.routes';
import profileRoutes from './api/v1/routes/profile.routes';
import { globalLimiter, authLimiter, otpLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

validateEnv();

const app: Application = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(globalLimiter);

// CORS configuration for production (Robust for Vercel)
const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : [];

app.use(cors({
  origin: (origin, callback) => {
    // 1. Allow local development
    if (!origin || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    // 2. Allow explicit domains from CLIENT_URL
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Instead of throwing an error (which kills headers), we just return false
    console.log('CORS Blocked Origin:', origin);
    return callback(null, false);
  },  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'x-dev-secret']
}));

// HTTP Request Logger (skip in test environments)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Body parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Healthcheck Routes
const healthHandler = (_req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'API is running' });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// API Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/cp', cpRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/engagement', engagementRoutes);

// Dev Only Routes
if (config.ENABLE_DEV_OTP_ROUTES === true) {
  app.use('/api/v1/dev/otp', devOtpRoutes);
}

// 404 Handler — must be after all routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Centralized Error Handler — must be last middleware (4 args)
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  errorHandler(err, req, res, _next);
});

export default app;
