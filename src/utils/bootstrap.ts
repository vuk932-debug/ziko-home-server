import * as userRepo from '../api/v1/repositories/user.repository';
import prisma from '../config/prisma';

export const bootstrapAdmin = async () => {
  try {
    const adminExists = await prisma.user.findFirst({
      where: { role: 'Admin' }
    });

    if (!adminExists) {
      console.log('No Admin found. Bootstrapping default admin user...');
      await userRepo.createUser({
        name: 'System Admin',
        email: process.env.ADMIN_EMAIL || 'admin@realistate.com',
        phone: '0000000000',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'Admin',
        isApproved: true
      });
      console.log('Default Admin Bootstrapped Successfully.');
    }
  } catch (error) {
    console.error('Failed to bootstrap Admin:', error);
  }
};
