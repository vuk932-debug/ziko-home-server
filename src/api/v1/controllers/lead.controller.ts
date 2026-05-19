import { Request, Response } from 'express';
import * as leadService from '../services/lead.service';
import * as authService from '../services/auth.service';
import * as otpService from '../services/otp.service';
import { leadSchema } from '../../../shared/schemas/lead.schema';
import { phoneOnlySchema } from '../../../shared/schemas/user.schema';

import * as userRepo from '../repositories/user.repository';
import * as propertyRepo from '../repositories/property.repository';

export const sendLeadOtpController = async (req: Request, res: Response) => {
  try {
    console.warn('[DEPRECATED] Manual lead send-otp called.');
    const validatedData = phoneOnlySchema.parse(req.body);
    
    const existingUser = await userRepo.findUserByPhone(validatedData.phone);
    if (existingUser) {
      return res.status(200).json({ userExists: true, message: 'User exists. Please login to continue.' });
    }
    
    await authService.sendOtpAuth(validatedData.phone, req.body.email);
    res.status(200).json({ userExists: false, message: 'OTP sent for lead verification' });
  } catch (error: any) {
    res.status(400).json({ message: error.errors || error.message });
  }
};

export const verifyLeadOtpController = async (req: Request, res: Response) => {
  try {
    console.warn('[DEPRECATED] Manual lead verify-otp called. Transition to verify-widget.');
    const validatedData = leadSchema.parse(req.body);
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'OTP code is required' });
    }

    if (validatedData.propertyId) {
      const property = await propertyRepo.getPropertyById(validatedData.propertyId);
      if (!property) {
        return res.status(400).json({ message: 'Invalid property reference. Property not found.' });
      }
    }

    const buyerId = req.user?.id;

    // Verify OTP first
    const isValid = await otpService.verifyOTP(validatedData.phone, code);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    const result = await leadService.createLead({
      ...validatedData,
      buyerId
    });

    res.status(result.isNew ? 201 : 200).json({ 
      success: true, 
      message: result.isNew ? 'Verified lead captured successfully.' : 'Verified lead updated.',
      data: result.lead 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.errors || error.message });
  }
};

/**
 * Modern lead verification using MSG91 Widget Access Token.
 */
export const verifyLeadWidgetController = async (req: Request, res: Response) => {
  try {
    const { accessToken, ...leadData } = req.body;
    const validatedData = leadSchema.parse(leadData);
    
    if (validatedData.propertyId) {
      const property = await propertyRepo.getPropertyById(validatedData.propertyId);
      if (!property) {
        return res.status(400).json({ success: false, message: 'Invalid property reference. Property not found.' });
      }
    }

    const buyerId = req.user?.id;

    // Use consolidated verify logic (which handles token validation)
    const verifiedPhone = await authService.validateMsg91Token(accessToken);
    
    const result = await leadService.createLead({
      ...validatedData,
      phone: verifiedPhone, 
      buyerId
    });

    res.status(result.isNew ? 201 : 200).json({ 
      success: true, 
      message: result.isNew ? 'Verified lead captured successfully.' : 'Verified lead updated.',
      data: result.lead 
    });
  } catch (error: any) {
    console.error('Lead Widget Verification Failed:', error.message);
    res.status(401).json({ success: false, message: error.message });
  }
};

export const createLeadController = async (req: Request, res: Response) => {
  try {
    // Auto-capture from req.user if present
    const dataToValidate = { ...req.body };
    if (req.user) {
      if (!dataToValidate.name) dataToValidate.name = req.user.name;
      if (!dataToValidate.phone) dataToValidate.phone = req.user.phone;
      if (!dataToValidate.email && req.user.email) dataToValidate.email = req.user.email;
    }

    const validatedData = leadSchema.parse(dataToValidate);
    const buyerId = req.user?.id;

    const result = await leadService.createLead({
      ...validatedData,
      buyerId,
      source: req.body.source || 'DIRECT_ENTRY'
    });

    res.status(result.isNew ? 201 : 200).json({ 
      success: true, 
      message: result.isNew ? 'Lead created successfully.' : 'Lead updated.',
      data: result.lead 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.errors || error.message });
  }
};

export const getCpLeadsController = async (req: Request, res: Response) => {
  try {
    const cpId = req.user.id;
    const { page, limit, status } = req.query;

    const result = await leadService.getCpLeads(
      cpId, 
      page ? Number(page) : 1, 
      limit ? Number(limit) : 10,
      status as string
    );

    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch CP leads' });
  }
};

export const updateLeadStatusController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const cpId = req.user.id;

    const result = await leadService.updateLeadStatus(id, cpId, status);
    res.status(200).json({ success: true, message: 'Lead status updated', data: result });
  } catch (error: any) {
    res.status(403).json({ success: false, message: error.message });
  }
};

export const addLeadNoteController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const cpId = req.user.id;

    const result = await leadService.addLeadNote(id, cpId, note);
    res.status(201).json({ success: true, message: 'Note added successfully', data: result });
  } catch (error: any) {
    res.status(403).json({ success: false, message: error.message });
  }
};

export const getLeadNotesController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cpId = req.user.id;

    const result = await leadService.getLeadNotes(id, cpId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(403).json({ success: false, message: error.message });
  }
};
