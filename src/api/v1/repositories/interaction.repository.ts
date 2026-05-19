import prisma from '../../../config/prisma';

export const toggleSavedProperty = async (userId: string, propertyId: string) => {
  const existing = await prisma.userSavedProperty.findUnique({
    where: {
      userId_propertyId: { userId, propertyId }
    }
  });

  if (existing) {
    await prisma.userSavedProperty.delete({
      where: {
        userId_propertyId: { userId, propertyId }
      }
    });
  } else {
    await prisma.userSavedProperty.create({
      data: { userId, propertyId }
    });
  }

  const saved = await prisma.userSavedProperty.findMany({
    where: { userId },
    select: { propertyId: true }
  });
  
  return saved.map(s => s.propertyId);
};

export const getSavedProperties = async (userId: string) => {
  const saved = await prisma.userSavedProperty.findMany({
    where: { userId },
    include: {
      property: {
        include: {
          images: true,
          amenities: true
        }
      }
    }
  });
  return saved.map(s => s.property);
};

export const getLeadByBuyerAndProperty = async (buyerId: string, propertyId: string) => {
  return await prisma.lead.findFirst({
    where: { buyerId, propertyId }
  });
};

export const createLead = async (leadData: any) => {
  return await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: leadData
    });
    
    await tx.property.update({
      where: { id: leadData.propertyId },
      data: { leadCount: { increment: 1 } }
    });
    
    return lead;
  });
};

export const fetchSellerLeads = async (sellerId: string) => {
  return await prisma.lead.findMany({
    where: { sellerId },
    include: {
      property: {
        select: {
          title: true,
          images: true,
          location: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const pushRecentlyViewed = async (userId: string, propertyId: string) => {
  // Use upsert to update viewedAt or create new entry
  await prisma.userRecentlyViewed.upsert({
    where: {
      userId_propertyId: { userId, propertyId }
    },
    update: {
      viewedAt: new Date()
    },
    create: {
      userId,
      propertyId
    }
  });

  // Clamp at 10 items
  const recent = await prisma.userRecentlyViewed.findMany({
    where: { userId },
    orderBy: { viewedAt: 'desc' },
    select: { propertyId: true }
  });

  if (recent.length > 10) {
    const idsToDelete = recent.slice(10).map(r => r.propertyId);
    await prisma.userRecentlyViewed.deleteMany({
      where: {
        userId,
        propertyId: { in: idsToDelete }
      }
    });
  }
};

export const getRecentProperties = async (userId: string) => {
  const recent = await prisma.userRecentlyViewed.findMany({
    where: { userId },
    orderBy: { viewedAt: 'desc' },
    include: {
      property: {
        include: {
          images: true,
          amenities: true
        }
      }
    },
    take: 10
  });
  return recent.map(r => r.property);
};
