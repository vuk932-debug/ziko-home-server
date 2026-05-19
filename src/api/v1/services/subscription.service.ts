import * as subscriptionRepo from '../repositories/subscription.repository';
import * as userRepo from '../repositories/user.repository';
import prisma from '../../../config/prisma';
import { PlanType } from '@prisma/client';
import { SUBSCRIPTION_LIMITS } from '../../../config/constants';

const getEndOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const assignSubscription = async (data: {
  userId: string;
  planType: PlanType;
  startDate: Date;
  endDate: Date;
}) => {
  const { userId, startDate, endDate, planType } = data;

  // 1. Validate user
  const user = await userRepo.findUserById(userId);
  if (!user) throw new Error('User not found');
  if (user.role !== 'CP') throw new Error('Subscriptions can only be assigned to Channel Partners');

  // 2. Validate dates
  const start = new Date(startDate);
  const end = getEndOfDay(new Date(endDate));

  if (start >= end) {
    throw new Error('Start date must be before end date');
  }

  // 3. Deactivate previous active subscriptions
  await subscriptionRepo.deactivateAllUserSubscriptions(userId);

  // 4. Count existing active properties to initialize listing count
  const currentActiveCount = await prisma.property.count({
    where: { sellerId: userId, isDeleted: false }
  });

  // 5. Create new subscription
  return await subscriptionRepo.createSubscription({
    userId,
    planType,
    startDate: start,
    endDate: end,
    listingsCount: currentActiveCount
  });
};

export const updateOrRenewSubscription = async (userId: string, data: any) => {
  const existing = await subscriptionRepo.findActiveByUserId(userId);
  if (!existing) throw new Error('No active subscription found for this user to update');

  const updates = { ...data };
  if (updates.endDate) {
    updates.endDate = getEndOfDay(new Date(updates.endDate));
  }

  if (updates.startDate && updates.endDate && new Date(updates.startDate) >= new Date(updates.endDate)) {
    throw new Error('Start date must be before end date');
  }

  return await subscriptionRepo.updateSubscriptionRecord(existing.id, updates);
};

export const getCPUsage = async (userId: string) => {
  const sub = await subscriptionRepo.findActiveByUserId(userId);
  if (!sub) {
    return { active: false, listingsCount: 0, maxListings: 0, planName: 'None' };
  }

  const maxListings = SUBSCRIPTION_LIMITS[sub.planType as keyof typeof SUBSCRIPTION_LIMITS] || 0;
  
  return {
    active: true,
    listingsCount: sub.listingsCount,
    maxListings,
    planName: sub.planType,
    endDate: sub.endDate
  };
};

export const getMySubscription = async (userId: string) => {
  const sub = await subscriptionRepo.findActiveByUserId(userId);
  if (!sub) return { active: false, message: 'No active subscription found' };
  
  const now = new Date();
  const end = new Date(sub.endDate);
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    ...sub,
    active: true,
    daysRemaining,
    listingLimit: SUBSCRIPTION_LIMITS[sub.planType as keyof typeof SUBSCRIPTION_LIMITS] || 0
  };
};

// Remove the hardcoded getListingLimit helper function as it's now replaced by constants
