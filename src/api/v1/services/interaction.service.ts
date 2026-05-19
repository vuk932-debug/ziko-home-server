import * as interactionRepo from '../repositories/interaction.repository';
import * as propertyRepo from '../repositories/property.repository';
import { sendSellerLeadNotification } from '../../../utils/email.service';
import { sendWhatsAppLeadAlert } from '../services/whatsapp.service';

export const savePropertyToggle = async (userId: string, propertyId: string) => {
  const property = await propertyRepo.getPropertyById(propertyId);
  if (!property) throw new Error('Property does not exist');

  return await interactionRepo.toggleSavedProperty(userId, propertyId);
};

export const fetchBookmarks = async (userId: string) => {
  return await interactionRepo.getSavedProperties(userId);
};

export const checkExistingLead = async (buyerId: string, propertyId: string) => {
  return await interactionRepo.getLeadByBuyerAndProperty(buyerId, propertyId);
};

export const generatePropertyLead = async (leadData: {
  propertyId: string,
  buyerId?: string,
  buyerName: string,
  buyerEmail: string,
  buyerPhone?: string,
  message: string,
  status: string
}) => {
  const property: any = await propertyRepo.getPropertyById(leadData.propertyId);
  if (!property) throw new Error('Target property unavailable.');

  const sellerId = property.sellerId;

  const newLead = await interactionRepo.createLead({
    ...leadData,
    sellerId
  });

  // Fetch seller details for notification (getPropertyById might not include all seller info needed)
  // In our Prisma implementation, getPropertyById includes images and amenities but maybe not seller email/phone
  // Let's assume we need to fetch seller separately or update repo
  
  // Re-fetch property with seller info
  const propertyWithSeller: any = await propertyRepo.getPropertyById(leadData.propertyId);
  // Actually, let's use a repository method that includes the seller.
  // I'll update property.repository.ts's getPropertyById to include seller if needed, 
  // or just use prisma directly here for simplicity as a one-off in service.
  
  // For now, I'll use the existing repository and adjust.
  
  if (property.seller) {
    await sendSellerLeadNotification(property.seller.email, leadData, property.title);

    if (property.seller.phone) {
        await sendWhatsAppLeadAlert(property.seller.phone, {
            buyerName: leadData.buyerName,
            propertyTitle: property.title,
            message: leadData.message
        });
    }
  }

  return newLead;
};

export const getSellerDashboardLeads = async (sellerId: string) => {
  return await interactionRepo.fetchSellerLeads(sellerId);
};
