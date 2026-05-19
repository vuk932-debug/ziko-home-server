import prisma from '../../../config/prisma';
import { LeadStatus } from '@prisma/client';

export const findDuplicateLead = async (phone: string, propertyId: string, windowDate: Date) => {
  return await prisma.lead.findFirst({
    where: {
      phone,
      propertyId,
      createdAt: { gte: windowDate }
    }
  });
};

export const updateLeadTimestamp = async (id: string) => {
  return await prisma.lead.update({
    where: { id },
    data: { updatedAt: new Date() }
  });
};

export const saveLead = async (data: any) => {
  return await prisma.lead.create({
    data
  });
};

export const findLeadById = async (id: string) => {
  return await prisma.lead.findUnique({
    where: { id }
  });
};

export const updateLead = async (id: string, data: any) => {
  return await prisma.lead.update({
    where: { id },
    data
  });
};

export const addNote = async (leadId: string, note: string) => {
  return await prisma.leadNote.create({
    data: {
      leadId,
      note
    }
  });
};

export const getNotes = async (leadId: string) => {
  return await prisma.leadNote.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' }
  });
};

export const getCpLeads = async (cpId: string, skip: number, take: number, status?: string) => {
  const where: any = { sellerId: cpId };
  if (status) where.status = status;

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip,
      take,
      include: {
        property: {
          select: {
            title: true,
            location: true,
            price: true,
            slug: true,
            category: true
          }
        },
        notes: { take: 1, orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.lead.count({ where })
  ]);

  return { leads, total };
};
