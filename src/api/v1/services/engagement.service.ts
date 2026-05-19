import * as engagementRepo from '../repositories/engagement.repository';
import { EntityType } from '@prisma/client';

export const toggleLike = async (userId: string, entityId: string, entityType: string) => {
  if (!Object.values(EntityType).includes(entityType as EntityType)) {
    throw new Error('Invalid entity type');
  }
  return await engagementRepo.toggleLike(userId, entityId, entityType as EntityType);
};

export const getEngagementStats = async (entityId: string, entityType: string, userId?: string) => {
  if (!Object.values(EntityType).includes(entityType as EntityType)) {
    throw new Error('Invalid entity type');
  }
  
  const [count, isLiked] = await Promise.all([
    engagementRepo.getLikeCount(entityId, entityType as EntityType),
    userId ? engagementRepo.getLikeStatus(userId, entityId, entityType as EntityType) : Promise.resolve(false)
  ]);

  return { count, isLiked };
};

export const trackShare = async (entityId: string, entityType: string, platform: string, userId?: string) => {
  if (!Object.values(EntityType).includes(entityType as EntityType)) {
    throw new Error('Invalid entity type');
  }
  return await engagementRepo.recordShare(entityId, entityType as EntityType, platform, userId);
};
