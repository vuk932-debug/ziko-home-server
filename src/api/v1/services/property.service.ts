import * as propertyRepo from '../repositories/property.repository';
import * as subscriptionRepo from '../repositories/subscription.repository';
import * as locationRepo from '../repositories/location.repository';
import { getCPUsage } from './subscription.service';
import { calculatePriorityScore } from '../../../shared/utils/priority';

export const addProperty = async (propertyData: any, sellerId: string) => {
  // 0. Validate Location Hierarchy
  const isValidLocation = await locationRepo.validateHierarchy(
    propertyData.country,
    propertyData.state,
    propertyData.city
  );

  if (!isValidLocation) {
    throw new Error(`Invalid location combination: ${propertyData.city}, ${propertyData.state}, ${propertyData.country}. Please select valid values.`);
  }

  // 1. Fetch current subscription and limits
  const usage = await getCPUsage(sellerId);
  
  if (!usage.active) {
    throw new Error('Your subscription is not active or has expired. Please upgrade to list properties.');
  }

  // 2. Perform real-time count of active (non-deleted) listings
  const activeListingsCount = await propertyRepo.countActivePropertiesBySeller(sellerId);

  if (activeListingsCount >= usage.maxListings) {
    throw new Error(`Listing limit reached for your ${usage.planName} plan (${usage.maxListings}). Please upgrade your plan to add more properties.`);
  }

  // 3. Create property with inherited planType and priorityScore
  const property = await propertyRepo.createProperty({
    ...propertyData,
    sellerId,
    planType: usage.planName,
    priorityScore: calculatePriorityScore(usage.planName, propertyData.featured || false),
    contactNumber: propertyData.contactNumber || undefined
  });

  // 4. Update cached counter if needed (optional optimization)
  await subscriptionRepo.incrementActiveListingCount(sellerId);

  return property;
};

export const fetchPublicProperties = async (query: any) => {
  return await propertyRepo.getProperties(query);
};

export const adminReviewProperty = async (propertyId: string, status: string) => {
  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('Status must be approved or rejected.');
  }
  return await propertyRepo.updatePropertyStatus(propertyId, status);
};

export const fetchSuggestions = async (searchTerm: string) => {
  if (!searchTerm || searchTerm.length < 2) return { properties: [], locations: [] };
  return await propertyRepo.getSuggests(searchTerm);
};

export const fetchComparisons = async (idsString: string) => {
  const ids = idsString.split(',').map(id => id.trim());
  return await propertyRepo.getComparison(ids);
};

export const fetchBySlug = async (slug: string) => {
  return await propertyRepo.getBySlug(slug);
};

export const fetchImageById = async (imageId: string) => {
  return await propertyRepo.getPropertyImageById(imageId);
};

export const refreshListing = async (propertyId: string, sellerId: string) => {
  const property: any = await propertyRepo.getPropertyById(propertyId);
  if (!property) {
    throw new Error('Property not found');
  }
  
  // Verify ownership
  if (property.sellerId.toString() !== sellerId) {
    throw new Error('Unauthorized: You can only refresh your own properties');
  }

  // Check cooldown (24 hours)
  const COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const lastRefreshed = property.lastRefreshedAt ? new Date(property.lastRefreshedAt).getTime() : 0;
  
  if (now - lastRefreshed < COOLDOWN_MS) {
    const hoursLeft = Math.ceil((COOLDOWN_MS - (now - lastRefreshed)) / (1000 * 60 * 60));
    throw new Error(`Cooldown active. Please wait ${hoursLeft} hours before refreshing again.`);
  }

  return await propertyRepo.refreshProperty(propertyId);
};

export const incrementImpressions = async (propertyIds: string[]) => {
  return await propertyRepo.incrementImpressions(propertyIds);
};
