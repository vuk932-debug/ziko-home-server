import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis.config';

export const cacheListings = async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET operations
    if (req.method !== 'GET') {
        return next();
    }

    // Bypass entirely if Redis hasn't initialized correctly on production layouts
    if (!redisClient.isReady) {
        return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;
    
    try {
        const cachedResponse = await redisClient.get(key);
        
        if (cachedResponse) {
            return res.status(200).json(JSON.parse(cachedResponse));
        } else {
            // Overwrite `res.json` cleanly binding caching logic onto outgoing matrices natively
            const originalJson = res.json.bind(res);
            res.json = ((body: any) => {
                // Store output strings safely within a 300 second (5 min) TTL boundary
                redisClient.setEx(key, 300, JSON.stringify(body));
                return originalJson(body);
            }) as any;
            
            next();
        }
    } catch (err) {
        console.error('Cache middleware bypassed safely preventing bottlenecks:', err);
        next();
    }
};
