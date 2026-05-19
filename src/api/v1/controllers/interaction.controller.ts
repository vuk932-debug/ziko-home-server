import { Request, Response } from 'express';
import * as interactionService from '../services/interaction.service';

export const generateLead = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.body;
    const buyerId = req.user.id;

    if (!propertyId) {
      return res.status(200).json({ message: 'Lead capture skipped: Invalid property ID' });
    }

    // Fetch user details from auth state (req.user)
    const buyerName = req.user.name;
    const buyerEmail = req.user.email;
    const buyerPhone = req.user.phone || '';

    // Check for duplicate lead (same buyer and property)
    const existingLead = await interactionService.checkExistingLead(buyerId.toString(), propertyId);
    if (existingLead) {
      return res.status(200).json({ message: 'Lead already captured', lead: existingLead });
    }

    let lead;
    try {
      lead = await interactionService.generatePropertyLead({
        propertyId,
        buyerId: buyerId.toString(),
        buyerName,
        buyerEmail,
        buyerPhone,
        message: 'Interested in property details',
        status: 'NEW'
      });
    } catch (err: any) {
      if (err.message === 'Target property unavailable.') {
        return res.status(200).json({ message: 'Lead capture skipped: Property not found in database' });
      }
      throw err;
    }

    res.status(201).json({ message: 'Lead captured successfully', lead });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const handleSaveProperty = async (req: Request, res: Response) => {
  try {
    const list = await interactionService.savePropertyToggle(req.user.id, req.params.id);
    res.status(200).json({ message: 'Saved properties updated.', savedProperties: list });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getSavedProperties = async (req: Request, res: Response) => {
  try {
    const properties = await interactionService.fetchBookmarks(req.user.id);
    res.status(200).json(properties);
  } catch (error: any) {
    res.status(500).json({ message: 'Could not fetch saved properties' });
  }
};

export const handleContactSeller = async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.id;
    // Bind buyerId if request incorporates JWT headers, else leave anonymous
    const buyerId = req.user ? req.user.id : undefined;
    
    const lead = await interactionService.generatePropertyLead({
      propertyId,
      buyerId,
      status: 'NEW',
      ...req.body
    });
    
    res.status(201).json({ message: 'Your message has been sent to the Seller.', lead });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMyLeadsController = async (req: Request, res: Response) => {
  try {
    const leads = await interactionService.getSellerDashboardLeads(req.user.id);
    res.status(200).json(leads);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving leads' });
  }
};
