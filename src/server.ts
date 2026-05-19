import app from './app';
import connectDB from './config/db';
import { connectRedis } from './config/redis.config';
import { bootstrapAdmin } from './utils/bootstrap';

const PORT = process.env.PORT || 5000;

console.log('Attempting to connect to MySQL...');
connectDB().then(async () => {
  console.log('MySQL connection logic completed. Moving to Redis...');
  await connectRedis();
  console.log('Redis connection logic completed. Bootstrapping Admin...');
  await bootstrapAdmin();
  console.log('Admin bootstrap completed. Starting Express server...');
  app.listen(PORT, () => {
    console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}).catch((error) => {
  console.error('❌ Failed to connect to database', error);
  process.exit(1);
});
