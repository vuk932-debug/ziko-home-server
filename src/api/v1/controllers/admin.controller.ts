import { Request, Response } from 'express';
import * as adminService from '../services/admin.service';
import * as auditService from '../services/audit.service';
import slugify from 'slugify';
import { propertySchema } from '../../../shared/schemas/property.schema';
import { userSchema } from '../../../shared/schemas/user.schema';

export const handleSellerUpdate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, value } = req.body; 
    const adminId = req.user?.id || 'SYSTEM';
    let result;
    if (action === 'approve') result = await adminService.toggleSellerApproval(id, value);
    if (action === 'verify') result = await adminService.toggleSellerVerification(id, value);
    if (action === 'ban') result = await adminService.toggleSellerBan(id, value);
    
    await auditService.logAdminAction(adminId, `USER_${action.toUpperCase()}`, 'USER', id, id, { value });
    res.status(200).json({ message: `Seller ${action} updated globally.`, data: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const handlePropertyFeature = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id || 'SYSTEM';
    const property = await adminService.togglePropertyFeature(req.params.id, req.body.featured);
    await auditService.logAdminAction(adminId, 'PROPERTY_FEATURE_TOGGLE', 'PROPERTY', req.params.id, property.sellerId, { featured: req.body.featured });
    res.status(200).json({ message: 'Property featured status toggled', property });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePropertyController = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id || 'SYSTEM';
    await adminService.removeListing(req.params.id);
    await auditService.logAdminAction(adminId, 'PROPERTY_DELETE', 'PROPERTY', req.params.id);
    res.status(200).json({ message: 'Property purged from servers entirely.' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const restorePropertyController = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id || 'SYSTEM';
    const property = await adminService.restoreListing(req.params.id);
    await auditService.logAdminAction(adminId, 'PROPERTY_RESTORE', 'PROPERTY', req.params.id, property.sellerId);
    res.status(200).json({ message: 'Property restored successfully.', property });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const assignSubscriptionOverride = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id || 'SYSTEM';
    const { sellerId, planId } = req.body;
    const sub = await adminService.overrideSubscription(sellerId, planId);
    await auditService.logAdminAction(adminId, 'SUBSCRIPTION_OVERRIDE', 'SUBSCRIPTION', sub.id, sellerId, { planId });
    res.status(200).json({ message: 'Manual subscription bypass executed', sub });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getLeadsController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await adminService.fetchAllLeads(page, limit);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Error mapping platform leads.' });
  }
};

export const updateLeadStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const lead = await adminService.changeLeadStatus(id, status);
    res.status(200).json({ message: 'Lead status updated', lead });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getAnalyticsController = async (req: Request, res: Response) => {
  try {
    const metrics = await adminService.fetchPlatformAnalytics();
    res.status(200).json(metrics);
  } catch (error: any) {
    console.error('[ANALYTICS_ERROR]', error);
    res.status(500).json({ message: 'Error retrieving aggregate data.', error: error.message });
  }
};

export const getAllProperties = async (req: Request, res: Response) => {
  try {
    const showDeleted = req.query.showDeleted === 'true';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const propertiesData = await adminService.fetchAllProperties(showDeleted, page, limit);
    res.status(200).json(propertiesData);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching properties' });
  }
};

export const createAdminProperty = async (req: Request, res: Response) => {
  try {
    const validatedData = propertySchema.parse({
      ...req.body,
      amenities: req.body.amenities ? req.body.amenities.split(',').map((a: string) => a.trim()).filter(Boolean) : []
    });

    // Seller ID (mandatory for DB)
    if (!req.body.sellerId) {
      return res.status(400).json({ message: 'You must select a Channel Partner (Partner Node) for this listing.' });
    }

    // Verify Seller is actually a CP
    const seller = await adminService.fetchUserById(req.body.sellerId);
    if (!seller || seller.role !== 'CP') {
      return res.status(400).json({ message: 'Target identity must be an authorized Channel Partner.' });
    }

    // Slug generation
    const slug = slugify(validatedData.title, { lower: true }) + '-' + Date.now();

    const property = await adminService.addProperty({
      ...validatedData,
      slug,
      sellerId: req.body.sellerId,
      images: req.files ? (req.files as any[]) : []
    });
    res.status(201).json(property);
  } catch (error: any) {
    res.status(400).json({ message: error.errors || error.message });
  }
};

export const updateAdminProperty = async (req: Request, res: Response) => {
  try {
    const validatedData = propertySchema.parse({
      ...req.body,
      amenities: req.body.amenities ? req.body.amenities.split(',').map((a: string) => a.trim()).filter(Boolean) : []
    });

    const property = await adminService.editProperty(req.params.id, {
      ...validatedData,
      images: req.files ? (req.files as any[]) : undefined
    });
    res.status(200).json(property);
  } catch (error: any) {
    res.status(400).json({ message: error.errors || error.message });
  }
};

export const updatePropertyPlan = async (req: Request, res: Response) => {
  try {
    const { planType } = req.body;
    const property = await adminService.changePropertyPlan(req.params.id, planType);
    res.status(200).json(property);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await adminService.fetchAllUsers();
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const user = await adminService.changeUserRole(req.params.id, role);
    res.status(200).json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUserController = async (req: Request, res: Response) => {
  try {
    await adminService.removeUser(req.params.id);
    res.status(200).json({ message: 'User deleted' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const resetUserPasswordTemp = async (req: Request, res: Response) => {
  try {
    const result = await adminService.adminResetPasswordTemp(req.params.id);
    res.status(200).json({ message: 'Temporary password generated successfully.', data: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const resetUserPasswordToken = async (req: Request, res: Response) => {
  try {
    const result = await adminService.adminResetPasswordToken(req.params.id);
    res.status(200).json({ message: 'Password reset link generated successfully.', data: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createCpController = async (req: Request, res: Response) => {
  try {
    const validatedData = userSchema.parse({
      ...req.body,
      role: 'CP'
    });
    const cp = await adminService.createCp(validatedData);
    res.status(201).json({
      message: 'Channel Partner created successfully',
      data: cp
    });
  } catch (error: any) {
    res.status(400).json({ message: error.errors || error.message });
  }
};

export const createWriterController = async (req: Request, res: Response) => {
  try {
    const validatedData = userSchema.parse({
      ...req.body,
      role: 'WRITER'
    });
    const writer = await adminService.createWriter(validatedData);
    res.status(201).json({
      message: 'Content Writer created successfully',
      data: writer
    });
  } catch (error: any) {
    res.status(400).json({ message: error.errors || error.message });
  }
};

export const getClientsController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await adminService.listClients(page, limit);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch clients' });
  }
};

export const updateClientStatusController = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id || 'SYSTEM';
    const { id } = req.params;
    const { isActive } = req.body;

    // UUID Validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    await adminService.toggleClientStatus(id, isActive);
    await auditService.logAdminAction(adminId, 'CLIENT_STATUS_UPDATE', 'USER', id, id, { isActive });
    res.status(200).json({ message: `Client ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getClientActivityController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }

    const activity = await adminService.getClientActivity(id);
    res.status(200).json(activity);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch client activity' });
  }
};

// IMAGE MANAGEMENT:
export const uploadImagesController = async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.id;
    const files = req.files ? (req.files as any[]) : [];
    if (files.length === 0) return res.status(400).json({ message: 'No images uploaded.' });

    await adminService.uploadListingImages(propertyId, files);
    res.status(201).json({ message: 'Images uploaded successfully.' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteImageController = async (req: Request, res: Response) => {
  try {
    const { imageId } = req.params;
    await adminService.deleteListingImage(imageId);
    res.status(200).json({ message: 'Image deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const replaceImageController = async (req: Request, res: Response) => {
  try {
    const { imageId } = req.params;
    const newFile = req.file ? (req.file as any) : null;
    if (!newFile) return res.status(400).json({ message: 'No replacement image provided.' });

    await adminService.replaceListingImage(imageId, newFile);
    res.status(200).json({ message: 'Image replaced successfully.' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
