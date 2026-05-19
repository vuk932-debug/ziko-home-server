import prisma from '../../../config/prisma';
import { PlanType } from '@prisma/client';

export const createSubscription = async (data: {
  userId: string;
  planType: PlanType;
  startDate: Date;
  endDate: Date;
  listingsCount?: number;
}) => {
  return await prisma.subscription.create({
    data: {
      ...data,
      isActive: true
    }
  });
};

export const updateSubscriptionRecord = async (id: string, data: any) => {
  return await prisma.subscription.update({
    where: { id },
    data
  });
};

export const incrementActiveListingCount = async (userId: string) => {
  const activeSub = await findActiveByUserId(userId);
  if (!activeSub) return null;

  return await prisma.subscription.update({
    where: { id: activeSub.id },
    data: { listingsCount: { increment: 1 } }
  });
};

export const decrementActiveListingCount = async (userId: string) => {
  const activeSub = await findActiveByUserId(userId);
  if (!activeSub) return null;

  const currentCount = activeSub.listingsCount || 0;
  return await prisma.subscription.update({
    where: { id: activeSub.id },
    data: { listingsCount: Math.max(0, currentCount - 1) }
  });
};

export const syncListingCount = async (userId: string) => {
  const activeSub = await findActiveByUserId(userId);
  if (!activeSub) return null;

  const actualCount = await prisma.property.count({
    where: { sellerId: userId, isDeleted: false }
  });

  return await prisma.subscription.update({
    where: { id: activeSub.id },
    data: { listingsCount: actualCount }
  });
};

export const findActiveByUserId = async (userId: string) => {
  return await prisma.subscription.findFirst({
    where: {
      userId,
      isActive: true,
      endDate: { gte: new Date() }
    }
  });
};

export const findCurrentActiveRecord = async (userId: string) => {
  return await prisma.subscription.findFirst({
    where: {
      userId,
      isActive: true
    }
  });
};

export const deactivateAllUserSubscriptions = async (userId: string) => {
  return await prisma.subscription.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false }
  });
};

export const findByUserId = async (userId: string) => {
  return await prisma.subscription.findFirst({
    where: { userId }
  });
};
