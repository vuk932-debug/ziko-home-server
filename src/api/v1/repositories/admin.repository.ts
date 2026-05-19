import prisma from '../../../config/prisma';
import { PropertyStatus } from '@prisma/client';
import { mapProperty } from './property.repository';

export const updateUserFields = async (userId: string, updates: any) => {
  return await prisma.user.update({
    where: { id: userId },
    data: updates
  });
};

export const deleteUser = async (userId: string) => {
  return await prisma.user.delete({
    where: { id: userId }
  });
};

export const getAllUsers = async () => {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

export const getLeads = async (skip: number, take: number) => {
  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      skip,
      take,
      include: {
        property: { select: { title: true, location: true, price: true, slug: true, category: true } },
        cp: { select: { name: true, email: true } },
        customer: { select: { name: true, email: true } },
        notes: { take: 1, orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.lead.count()
  ]);
  return { leads, total };
};

export const updateLead = async (id: string, updates: any) => {
  return await prisma.lead.update({
    where: { id },
    data: updates
  });
};

export const getAllProperties = async (showDeleted = false, skip: number = 0, take: number = 50) => {
  const where: any = {};
  if (!showDeleted) where.isDeleted = false;

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take,
      include: {
        cp: { select: { id: true, name: true, email: true } },
        images: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.property.count({ where })
  ]);

  return { properties: properties.map(mapProperty), total };
};

export const createProperty = async (data: any) => {
  const { images, amenities, sellerId, ...rest } = data;
  const property = await prisma.property.create({
    data: {
      ...rest,
      sellerId,
      images: images ? {
        create: images.map((img: any) => {
           if (typeof img === 'string') return { url: img };
           return {
             imageData: img.buffer,
             mimeType: img.mimetype
           };
        })
      } : undefined,
      amenities: amenities ? {
        create: amenities.map((name: string) => ({ name }))
      } : undefined
    },
    include: {
      images: true,
      amenities: true,
      cp: { select: { id: true, name: true, email: true } }
    }
  });
  return mapProperty(property);
};

export const updateProperty = async (id: string, data: any) => {
  const { images, amenities, ...rest } = data;
  const property = await prisma.property.update({
    where: { id },
    data: {
      ...rest,
      images: images ? {
        deleteMany: {},
        create: images.map((img: any) => {
           if (typeof img === 'string') return { url: img };
           return {
             imageData: img.buffer,
             mimeType: img.mimetype
           };
        })
      } : undefined,
      amenities: amenities ? {
        deleteMany: {},
        create: amenities.map((name: string) => ({ name }))
      } : undefined
    },
    include: {
      images: true,
      amenities: true,
      cp: { select: { id: true, name: true, email: true } }
    }
  });
  return mapProperty(property);
};

export const deletePropertyListing = async (id: string) => {
  return await prisma.property.update({
    where: { id },
    data: { isDeleted: true }
  });
};

export const restorePropertyListing = async (id: string) => {
  return await prisma.property.update({
    where: { id },
    data: { isDeleted: false }
  });
};

export const generatePlatformAnalytics = async () => {
  const now = new Date();
  const [totalCPs, totalCustomers, totalListings, totalLeads, activeCPs] = await Promise.all([
    prisma.user.count({ where: { role: 'CP' } }),
    prisma.user.count({ where: { role: 'Customer' } }),
    prisma.property.count({ where: { isDeleted: false } }),
    prisma.lead.count(),
    prisma.user.count({
      where: {
        role: 'CP',
        subscription: {
          some: {
            isActive: true,
            endDate: { gte: now }
          }
        }
      }
    })
  ]);

  const conversionRate = totalListings > 0 ? ((totalLeads / totalListings) * 100).toFixed(2) + '%' : '0%';

  return {
    totalSellers: totalCPs,
    activeSellers: activeCPs,
    expiredSellers: totalCPs - activeCPs,
    totalBuyers: totalCustomers,
    totalListings,
    totalLeads,
    conversionRate
  };
};

export const getNextAgentId = async () => {
  const lastUser = await prisma.user.findFirst({
    where: { agentId: { startsWith: 'ZH-CP-' } },
    orderBy: { agentId: 'desc' }
  });

  if (!lastUser || !lastUser.agentId) {
    return 'ZH-CP-0001';
  }

  const lastNum = parseInt(lastUser.agentId.split('-')[2]);
  const nextNum = (lastNum + 1).toString().padStart(4, '0');
  return `ZH-CP-${nextNum}`;
};

export const createCpUser = async (data: any) => {
  return await prisma.user.create({
    data: {
      ...data,
      role: 'CP',
      isApproved: true,
      isVerified: true
    }
  });
};

export const forceAssignSubscription = async (cpId: string, planId: string, endDate: Date) => {
  const existing = await prisma.subscription.findFirst({
     where: { userId: cpId, isActive: true }
  });

  if (existing) {
     return await prisma.subscription.update({
        where: { id: existing.id },
        data: {
            planType: planId as any,
            endDate,
            isActive: true
        }
     });
  }

  // Count existing active properties for the new subscription record
  const currentCount = await prisma.property.count({
    where: { sellerId: cpId, isDeleted: false }
  });

  return await prisma.subscription.create({
    data: {
      userId: cpId,
      planType: planId as any,
      endDate,
      isActive: true,
      startDate: new Date(),
      listingsCount: currentCount
    }
  });
};

export const getCPClients = async (skip: number, take: number) => {
  const [clients, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'CP' },
      skip,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        agentId: true,
        isActive: true,
        isApproved: true,
        createdAt: true,
        subscription: {
          where: { isActive: true },
          select: {
            planType: true,
            endDate: true,
            isActive: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where: { role: 'CP' } })
  ]);

  return { clients, total };
};

export const updateCPStatus = async (id: string, isActive: boolean) => {
  return await prisma.user.update({
    where: { id },
    data: { isActive }
  });
};

export const getCPActivity = async (id: string) => {
  const [propertiesCount, leadsCount] = await Promise.all([
    prisma.property.count({ where: { sellerId: id, isDeleted: false } }),
    prisma.lead.count({ where: { sellerId: id } })
  ]);

  return {
    propertiesCount,
    leadsCount
  };
};
