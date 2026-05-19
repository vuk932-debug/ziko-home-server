import prisma from '../../../config/prisma';
import { EntityType } from '@prisma/client';

export const toggleLike = async (userId: string, entityId: string, entityType: EntityType) => {
  const existingLike = await prisma.like.findUnique({
    where: {
      userId_entityId_entityType: {
        userId,
        entityId,
        entityType,
      },
    },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: { id: existingLike.id },
    });
    return { liked: false };
  } else {
    await prisma.like.create({
      data: {
        userId,
        entityId,
        entityType,
      },
    });
    return { liked: true };
  }
};

export const getLikeCount = async (entityId: string, entityType: EntityType) => {
  return await prisma.like.count({
    where: {
      entityId,
      entityType,
    },
  });
};

export const getLikeStatus = async (userId: string, entityId: string, entityType: EntityType) => {
  const like = await prisma.like.findUnique({
    where: {
      userId_entityId_entityType: {
        userId,
        entityId,
        entityType,
      },
    },
  });
  return !!like;
};

export const recordShare = async (entityId: string, entityType: EntityType, platform: string, userId?: string) => {
  return await prisma.share.create({
    data: {
      entityId,
      entityType,
      platform,
      userId,
    },
  });
};
