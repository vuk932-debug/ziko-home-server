import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import * as adminRepo from '../repositories/admin.repository';
import * as subscriptionRepo from '../repositories/subscription.repository';
import * as propertyRepo from '../repositories/property.repository';
import * as locationRepo from '../repositories/location.repository';
import * as userRepo from '../repositories/user.repository';
import { calculatePriorityScore } from '../../../shared/utils/priority';
import * as cpRepo from '../repositories/cp.repository';
import prisma from '../../../config/prisma';

export const toggleSellerApproval = async (sellerId: string, isApproved: boolean) => {
  return await adminRepo.updateUserFields(sellerId, { isApproved });
};

export const toggleSellerVerification = async (sellerId: string, isVerified: boolean) => {
  return await adminRepo.updateUserFields(sellerId, { isVerified });
};

export const toggleSellerBan = async (sellerId: string, isBanned: boolean) => {
  return await adminRepo.updateUserFields(sellerId, { isBanned });
};

export const removeListing = async (propertyId: string) => {
  const property = await propertyRepo.getPropertyById(propertyId);
  if (!property) throw new Error('Property not found');
  
  const result = await adminRepo.deletePropertyListing(propertyId);
  await subscriptionRepo.decrementActiveListingCount(property.sellerId);
  return result;
};

export const restoreListing = async (propertyId: string) => {
  const result = await adminRepo.restorePropertyListing(propertyId);
  if (!result) throw new Error('Restoration failed');
  
  await subscriptionRepo.incrementActiveListingCount(result.sellerId);
  return result;
};

export const fetchAllProperties = async (showDeleted = false, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  const { properties, total } = await adminRepo.getAllProperties(showDeleted, skip, limit);
  return {
    properties,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    }
  };
};

export const addProperty = async (data: any) => {
  const isValidLocation = await locationRepo.validateHierarchy(
    data.country,
    data.state,
    data.city
  );

  if (!isValidLocation) {
    throw new Error(`Invalid location combination: ${data.city}, ${data.state}, ${data.country}. Please select valid values.`);
  }

  return await propertyRepo.createProperty(data);
};

export const editProperty = async (id: string, data: any) => {
  if (data.country || data.state || data.city) {
    // If any location field is provided, we must check the hierarchy.
    // However, during an update, only partial data might be sent.
    // We should fetch the current property to fill in missing pieces for validation.
    const current = await propertyRepo.getPropertyById(id);
    if (!current) throw new Error('Property not found');

    const isValidLocation = await locationRepo.validateHierarchy(
      data.country || current.country,
      data.state || current.state,
      data.city || current.city
    );

    if (!isValidLocation) {
      throw new Error(`Invalid location combination. Hierarchy check failed for: ${data.city || current.city}, ${data.state || current.state}, ${data.country || current.country}`);
    }
  }

  return await adminRepo.updateProperty(id, data);
};

export const changePropertyPlan = async (id: string, planType: string) => {
  const current = await propertyRepo.getPropertyById(id);
  if (!current) throw new Error('Property not found');
  const priorityScore = calculatePriorityScore(planType, current.isFeatured || false);
  return await adminRepo.updateProperty(id, { planType, priorityScore });
};

export const togglePropertyFeature = async (id: string, featured: boolean) => {
  const current = await propertyRepo.getPropertyById(id);
  if (!current) throw new Error('Property not found');
  const priorityScore = calculatePriorityScore(current.tier || 'STANDARD', featured);
  return await adminRepo.updateProperty(id, { featured, priorityScore });
};

export const fetchAllUsers = async () => {
  return await adminRepo.getAllUsers();
};

export const fetchUserById = async (id: string) => {
  return await userRepo.findUserById(id);
};

export const changeUserRole = async (userId: string, role: string) => {
  if (role === 'CP') {
    const user = await adminRepo.updateUserFields(userId, { role });
    
    // If user doesn't have an agentId yet, generate and initialize
    if (!user.agentId) {
      const agentId = await adminRepo.getNextAgentId();
      return await adminRepo.updateUserFields(userId, {
        agentId,
        isApproved: true,
        isVerified: true,
        isActive: true
      });
    }
    
    // If they already have an agentId, just ensure they are approved/verified
    return await adminRepo.updateUserFields(userId, {
      isApproved: true,
      isVerified: true,
      isActive: true
    });
  }
  
  return await adminRepo.updateUserFields(userId, { role });
};

export const removeUser = async (userId: string) => {
  return await adminRepo.deleteUser(userId);
};

export const listClients = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const { clients, total } = await adminRepo.getCPClients(skip, limit);
  const now = new Date();

  const formattedClients = clients.map((client: any) => {
    const sub = client.subscription;
    const isExpired = sub ? now > new Date(sub.endDate) : true;
    
    return {
      ...client,
      subscriptionStatus: sub ? (isExpired ? 'EXPIRED' : 'ACTIVE') : 'NONE'
    };
  });

  return {
    clients: formattedClients,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  };
};

export const toggleClientStatus = async (id: string, isActive: boolean) => {
  return await adminRepo.updateCPStatus(id, isActive);
};

export const getClientActivity = async (id: string) => {
  return await adminRepo.getCPActivity(id);
};

export const uploadListingImages = async (propertyId: string, files: any[]) => {
  return await cpRepo.addPropertyImages(propertyId, files);
};

export const deleteListingImage = async (imageId: string) => {
  return await cpRepo.deletePropertyImage(imageId);
};

export const replaceListingImage = async (imageId: string, newFile: any) => {
  return await cpRepo.replaceImage(imageId, newFile);
};

export const onboardUser = async (userData: any, role: 'CP' | 'WRITER') => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.email)) {
    throw new Error('Invalid email format');
  }

  const tempPassword = crypto.randomBytes(6).toString('hex');
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(tempPassword, salt);
  
  const prefix = role === 'CP' ? 'ZH-CP-' : 'ZH-WR-';

  return await prisma.$transaction(async (tx) => {
    // 1. Get next ID within transaction
    const lastUser = await tx.user.findFirst({
      where: { agentId: { startsWith: prefix } },
      orderBy: { agentId: 'desc' }
    });

    let agentId = `${prefix}0001`;
    if (lastUser && lastUser.agentId) {
      const parts = lastUser.agentId.split('-');
      const lastNum = parseInt(parts[2]);
      agentId = `${prefix}${(lastNum + 1).toString().padStart(4, '0')}`;
    }

    const user = await tx.user.create({
      data: {
        ...userData,
        agentId,
        password: hashedPassword,
        role: role,
        isApproved: true,
        isVerified: true,
        isActive: true
      }
    });

    console.log(`\n[ADMIN] NEW ${role} CREATED (TRANSACTIONAL)`);
    console.log(`Email: ${user.email}`);
    console.log(`Agent ID: ${agentId}`);
    console.log(`Temp Password: ${tempPassword}`);
    console.log(`========================\n`);

    return { ...user, tempPassword };
  });
};

export const createCp = async (cpData: any) => {
  return await onboardUser(cpData, 'CP');
};

export const createWriter = async (writerData: any) => {
  return await onboardUser(writerData, 'WRITER');
};

export const changeLeadStatus = async (leadId: string, status: string) => {
  return await adminRepo.updateLead(leadId, { status });
};

export const adminResetPasswordTemp = async (userId: string) => {
  const tempPassword = crypto.randomBytes(6).toString('hex');
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(tempPassword, salt);

  await userRepo.updateUser(userId, {
    password: hashedPassword,
    tempPassword: hashedPassword // Store it in tempPassword as well if required by existing login logic
  });

  return { tempPassword };
};

export const adminResetPasswordToken = async (userId: string) => {
  const user = await userRepo.findUserById(userId);
  if (!user) throw new Error('User not found');

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hour expiry for admin-initiated reset

  await userRepo.updateUser(userId, {
    resetTokenHash: hashedToken,
    resetTokenExpiry: expires,
    passwordResetToken: hashedToken, // legacy
    passwordResetExpires: expires    // legacy
  });

  const clientBaseUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
  const resetUrl = `${clientBaseUrl}/reset-password/${resetToken}`;

  return { resetToken, resetUrl };
};

export const overrideSubscription = async (sellerId: string, planId: string) => {
  const newEndDate = new Date();
  newEndDate.setDate(newEndDate.getDate() + 30);
  return await adminRepo.forceAssignSubscription(sellerId, planId, newEndDate);
};

export const fetchPlatformAnalytics = async () => {
  return await adminRepo.generatePlatformAnalytics();
};

export const fetchAllLeads = async (page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  const { leads, total } = await adminRepo.getLeads(skip, limit);
  const formattedLeads = leads.map(l => ({
    ...l,
    crmStatus: 'SUCCESS' // Simulation for UI indicator
  }));

  return {
    leads: formattedLeads,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    }
  };
};
