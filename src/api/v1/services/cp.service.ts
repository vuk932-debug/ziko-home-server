import * as cpRepo from '../repositories/cp.repository';
import * as subscriptionRepo from '../repositories/subscription.repository';
import { SUBSCRIPTION_LIMITS } from '../../../config/constants';

export const editProperty = async (propertyId: string, cpId: string, updateData: any) => {
  const property = await cpRepo.updateCPProperty(propertyId, cpId, updateData);
  if (!property) throw new Error('Unauthorized or missing property access.');
  return property;
};

export const getDashboardStats = async (cpId: string) => {
  const data = await cpRepo.getCPDashboardData(cpId);
  if (!data.user) throw new Error('User identity not located in registry.');

  const sub = (data.user as any).subscription?.[0]; // Subscription is an array in schema
  const now = new Date();
  const isExpired = sub ? now > new Date(sub.endDate) : true;
  
  const diffTime = sub ? new Date(sub.endDate).getTime() - now.getTime() : 0;
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const maxListings = sub ? (SUBSCRIPTION_LIMITS[sub.planType as keyof typeof SUBSCRIPTION_LIMITS] || 0) : 0;

  // Transform grouped leads into a flat object with robust fallbacks
  const leadStats = {
    total: 0,
    new: 0,
    contacted: 0,
    closed: 0
  };

  if (Array.isArray(data.leadsGrouped)) {
    data.leadsGrouped.forEach((group: any) => {
      const count = group._count?._all || 0;
      leadStats.total += count;
      if (group.status === 'NEW') leadStats.new = count;
      if (group.status === 'CONTACTED') leadStats.contacted = count;
      if (group.status === 'CLOSED') leadStats.closed = count;
    });
  }

  return {
    profile: {
      name: data.user.name,
      email: data.user.email,
      agentId: data.user.agentId
    },
    subscription: {
      plan: sub?.planType || 'NONE',
      endDate: sub?.endDate || null,
      daysRemaining,
      status: sub ? (isExpired ? 'EXPIRED' : 'ACTIVE') : 'NONE'
    },
    usage: {
      totalListings: data.propertiesCount || 0,
      maxListings,
      remaining: Math.max(0, maxListings - (data.propertiesCount || 0))
    },
    leads: leadStats
  };
};

export const removeProperty = async (propertyId: string, cpId: string) => {
  const property = await cpRepo.deleteCPProperty(propertyId, cpId);
  if (!property) throw new Error('Unauthorized or missing property access.');
  
  // Keep cached counters in sync
  await subscriptionRepo.decrementActiveListingCount(cpId);
  
  return property;
};

export const generateDashboardAnalytics = async (cpId: string) => {
  return await cpRepo.getCPAnalyticsRaw(cpId);
};

export const listCPProperties = async (cpId: string) => {
  return await cpRepo.getCPProperties(cpId);
};

export const uploadPropertyImages = async (propertyId: string, cpId: string, files: any[]) => {
  console.log(`[SERVICE] uploadPropertyImages start for property: ${propertyId}, cp: ${cpId}`);
  // Check ownership
  const property = await cpRepo.findPropertyOwnership(propertyId, cpId);
  if (!property) {
    console.warn(`[SERVICE] Ownership check failed for property ${propertyId} and cp ${cpId}`);
    throw new Error('Unauthorized or property not found.');
  }

  console.log(`[SERVICE] Ownership verified. Calling repo to add ${files.length} images.`);
  return await cpRepo.addPropertyImages(propertyId, files);
};

export const removePropertyImage = async (imageId: string, cpId: string) => {
  const image = await cpRepo.findImageById(imageId);
  if (!image || image.property.sellerId !== cpId) {
    throw new Error('Unauthorized or image not found.');
  }

  return await cpRepo.deletePropertyImage(imageId);
};

export const replacePropertyImage = async (imageId: string, cpId: string, newFile: any) => {
  const image = await cpRepo.findImageById(imageId);
  if (!image || image.property.sellerId !== cpId) {
    throw new Error('Unauthorized or image not found.');
  }

  return await cpRepo.replaceImage(imageId, newFile);
};

export const markPropertySold = async (propertyId: string, cpId: string) => {
  const property = await cpRepo.updateCPProperty(propertyId, cpId, { status: 'sold' });
  if (!property) throw new Error('Unauthorized or missing property access.');
  return property;
};

export const processPremiumBoostStatus = async (propertyId: string, cpId: string) => {
  // Enforce Subscription checks
  const subscription = await subscriptionRepo.findActiveByUserId(cpId);
  
  if (!subscription) {
    throw new Error('An active subscription is required to boost assets.');
  }

  if (subscription.planType !== 'PREMIUM') {
    throw new Error('Boosting properties is an exclusive feature provided only to PREMIUM subscribers. Please upgrade your package.');
  }

  const property = await cpRepo.updateCPProperty(propertyId, cpId, { featured: true });
  if (!property) throw new Error('Target property unreachable.');
  return property;
};
