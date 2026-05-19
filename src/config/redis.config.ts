import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

let isRedisConnecting = false;
let hasReportedError = false;

redisClient.on('error', (err) => {
  // Only report the error once to avoid console spam if Redis isn't running
  if (!hasReportedError) {
    console.warn('⚠️ Redis Client Error. Caching will be disabled.');
    console.debug('Technical details:', err.message);
    hasReportedError = true;
  }
});

redisClient.on('connect', () => {
  console.log('✅ Redis Cache connection activated.');
  hasReportedError = false; // Reset if it ever connects
});

export const connectRedis = async () => {
    if (isRedisConnecting) return;
    isRedisConnecting = true;
    
    try {
        // Create a timeout promise to prevent hanging indefinitely
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        );
        
        await Promise.race([redisClient.connect(), timeoutPromise]);
    } catch (error: any) {
        // Error is handled by the 'error' listener and this catch
        if (!hasReportedError) {
          console.warn('⚠️ Redis connection failed or timed out. API will run without cache.');
          hasReportedError = true;
        }
    }
};

export default redisClient;
