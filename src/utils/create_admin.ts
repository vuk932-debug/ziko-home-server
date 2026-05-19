import dotenv from 'dotenv';
import prisma from '../config/prisma';
import * as userRepo from '../api/v1/repositories/user.repository';

dotenv.config();

const createAdmin = async () => {
  try {
    const email = "puneeth.kumar@zikohome.com";
    const phone = "9353950078";

    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    });

    if (existing) {
      console.log('User with this email or phone already exists. Updating to Admin and resetting password...');
      await userRepo.updateUser(existing.id, {
        name: "puneeth kumar",
        email,
        phone,
        password: "Puneeth@1234",
        role: 'Admin',
        isApproved: true,
        isVerified: true
      });
      console.log('Admin user updated successfully.');
    } else {
      console.log('Creating new Admin user...');
      await userRepo.createUser({
        name: "puneeth kumar",
        email,
        phone,
        password: "Puneeth@1234",
        role: 'Admin',
        isApproved: true,
        isVerified: true
      });
      console.log('Admin user created successfully.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin:', error);
    process.exit(1);
  }
};

createAdmin();
