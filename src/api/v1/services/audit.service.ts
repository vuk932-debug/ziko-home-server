import prisma from '../../../config/prisma';

export const logAdminAction = async (
  adminId: string,
  actionType: string,
  entityType: string,
  entityId?: string,
  targetUserId?: string,
  metadata?: any
) => {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        actionType,
        entityType,
        entityId,
        targetUserId,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
