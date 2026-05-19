import prisma from '../../../config/prisma';

export const updateSellerProperty = async (propertyId: string, sellerId: string, updates: any) => {
  return await prisma.property.update({
    where: { id: propertyId, sellerId },
    data: updates
  });
};

export const deleteSellerProperty = async (propertyId: string, sellerId: string) => {
  return await prisma.property.update({
    where: { id: propertyId, sellerId },
    data: { isDeleted: true }
  });
};

export const getSellerAnalyticsRaw = async (sellerId: string) => {
  const [totalListings, activeListings, leadsReceived] = await Promise.all([
    prisma.property.count({ where: { sellerId, isDeleted: false } }),
    prisma.property.count({ where: { sellerId, status: 'approved', isDeleted: false } }),
    prisma.lead.count({ where: { sellerId } })
  ]);

  const conversion = totalListings > 0 ? ((leadsReceived / totalListings) * 100).toFixed(2) + '%' : '0%';

  return {
    totalListings,
    activeListings,
    leadsReceived,
    conversionRate: conversion
  };
};
