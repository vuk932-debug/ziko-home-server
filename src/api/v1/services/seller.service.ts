import * as sellerRepo from '../repositories/seller.repository';
import * as subscriptionRepo from '../repositories/subscription.repository';

export const editProperty = async (propertyId: string, sellerId: string, updateData: any) => {
  const property = await sellerRepo.updateSellerProperty(propertyId, sellerId, updateData);
  if (!property) throw new Error('Unauthorized or missing property access.');
  return property;
};

export const removeProperty = async (propertyId: string, sellerId: string) => {
  const property = await sellerRepo.deleteSellerProperty(propertyId, sellerId);
  if (!property) throw new Error('Unauthorized or missing property access.');
  return property;
};

export const generateDashboardAnalytics = async (sellerId: string) => {
  return await sellerRepo.getSellerAnalyticsRaw(sellerId);
};

export const markPropertySold = async (propertyId: string, sellerId: string) => {
  const property = await sellerRepo.updateSellerProperty(propertyId, sellerId, { status: 'sold' });
  if (!property) throw new Error('Unauthorized or missing property access.');
  return property;
};

export const processPremiumBoostStatus = async (propertyId: string, sellerId: string) => {
  // Enforce Subscription checks
  const subscription: any = await subscriptionRepo.findActiveByUserId(sellerId);
  
  if (!subscription || !subscription.isActive) {
    throw new Error('An active subscription is required to boost assets.');
  }

  // Premium tier logic dictates Max Listings artificially equals -1. 
  // Let's abstract the logic check specifically measuring against limits.
  // In Prisma, we use PlanType enum.
  if (subscription.planType !== 'PREMIUM') {
    throw new Error('Boosting properties is an exclusive feature provided only to Premium subscribers. Please upgrade your package.');
  }

  const property = await sellerRepo.updateSellerProperty(propertyId, sellerId, { featured: true });
  if (!property) throw new Error('Target property unreachable.');
  return property;
};
