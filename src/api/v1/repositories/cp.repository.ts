import prisma from '../../../config/prisma';
import { PropertyStatus } from '@prisma/client';
import { mapProperty } from './property.repository';

export const getCPDashboardData = async (cpId: string) => {
  const [user, propertiesCount, leadsGrouped] = await Promise.all([
    prisma.user.findUnique({
      where: { id: cpId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        agentId: true,
        subscription: {
          where: { isActive: true },
          select: {
            planType: true,
            endDate: true,
            listingsCount: true
          }
        }
      }
    }),
    prisma.property.count({ 
      where: { 
        sellerId: cpId,
        isDeleted: false 
      } 
    }),
    prisma.lead.groupBy({
      by: ['status'],
      where: { sellerId: cpId },
      _count: { _all: true }
    })
  ]);

  return {
    user,
    propertiesCount,
    leadsGrouped
  };
};

export const updateCPProperty = async (propertyId: string, cpId: string, updates: any) => {
  const { images, amenities, ...rest } = updates;

  // Verify ownership first
  const existing = await prisma.property.findFirst({
    where: { id: propertyId, sellerId: cpId }
  });

  if (!existing) return null;

  // Execute update on confirmed ID
  const property = await prisma.property.update({
    where: { id: propertyId },
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
      amenities: true
    }
  });

  return mapProperty(property);
};

export const getCPProperties = async (cpId: string) => {
  const properties = await prisma.property.findMany({
    where: { 
      sellerId: cpId,
      isDeleted: false
    },
    include: {
      images: true,
      amenities: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return properties.map(mapProperty);
};

export const findPropertyOwnership = async (propertyId: string, cpId: string) => {
  return await prisma.property.findFirst({
    where: { id: propertyId, sellerId: cpId }
  });
};

export const deleteCPProperty = async (propertyId: string, cpId: string) => {
  // Check if it belongs to the CP first
  const property = await prisma.property.findFirst({
    where: { id: propertyId, sellerId: cpId }
  });

  if (!property) return null;

  return await prisma.property.update({
    where: { id: propertyId },
    data: { isDeleted: true }
  });
};

export const addPropertyImages = async (propertyId: string, files: any[]) => {
  console.log(`[REPO] addPropertyImages start: ${files.length} files for property ${propertyId}`);
  const results = [];
  
  try {
    for (const [index, img] of files.entries()) {
      const data: any = { 
        property: { connect: { id: propertyId } }
      };
      
      if (typeof img === 'string') {
        data.url = img;
      } else {
        console.log(`[REPO] Processing file ${index}: ${img.originalname || 'unknown'}, size: ${img.size || img.buffer?.length} bytes`);
        if (img.buffer) {
          data.imageData = img.buffer;
        }
        if (img.mimetype) {
          data.mimeType = img.mimetype;
        }
      }
      
      const created = await prisma.propertyImage.create({ data });
      console.log(`[REPO] Successfully created image record: ${created.id}`);
      results.push(created);
    }
    return results;
  } catch (error: any) {
    console.error('[REPO] Error in addPropertyImages loop:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      propertyId
    });
    throw error;
  }
};

export const findImageById = async (imageId: string) => {
  return await prisma.propertyImage.findUnique({
    where: { id: imageId },
    include: { property: { select: { sellerId: true } } }
  });
};

export const deletePropertyImage = async (imageId: string) => {
  return await prisma.propertyImage.delete({
    where: { id: imageId }
  });
};

export const replaceImage = async (imageId: string, file: any) => {
  const data: any = {};
  if (typeof file === 'string') {
    data.url = file;
    data.imageData = null;
    data.mimeType = null;
  } else {
    data.url = null;
    data.imageData = file.buffer;
    data.mimeType = file.mimetype;
  }

  return await prisma.propertyImage.update({
    where: { id: imageId },
    data
  });
};

export const getCPAnalyticsRaw = async (cpId: string) => {
  const [totalListings, activeListings, leadsReceived] = await Promise.all([
    prisma.property.count({ 
      where: { 
        sellerId: cpId,
        isDeleted: false 
      } 
    }),
    prisma.property.count({ 
      where: { 
        sellerId: cpId, 
        status: 'approved' as PropertyStatus,
        isDeleted: false 
      } 
    }),
    prisma.lead.count({ where: { sellerId: cpId } })
  ]);

  const conversion = totalListings > 0 ? ((leadsReceived / totalListings) * 100).toFixed(2) + '%' : '0%';

  return {
    totalListings,
    activeListings,
    leadsReceived,
    conversionRate: conversion
  };
};
