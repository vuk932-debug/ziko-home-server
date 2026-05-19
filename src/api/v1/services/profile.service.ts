import bcryptjs from 'bcryptjs';
import prisma from '../../../config/prisma';

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      profileCompleted: true,
      profileImage: true,
      companyName: true,
      officeAddress: true,
      city: true,
      state: true,
      country: true,
      bio: true,
      reraNumber: true,
      website: true,
      socialLinks: true,
      specialization: true,
      isApproved: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export const updateUserProfile = async (userId: string, data: any) => {
  // Disallow changing critical fields via this endpoint
  const { id, role, password, tempPassword, isApproved, isVerified, isBanned, isActive, ...updateData } = data;

  // Mark profile as completed if it wasn't
  updateData.profileCompleted = true;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      profileCompleted: true,
      profileImage: true,
      companyName: true,
      officeAddress: true,
      city: true,
      state: true,
      country: true,
      bio: true,
      reraNumber: true,
      website: true,
      socialLinks: true,
      specialization: true,
      isApproved: true
    }
  });

  return user;
};

export const changeUserPassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error('User not found');
  }

  // If user doesn't have a password yet (maybe logged in via OTP only initially and hasn't set one)
  // or verify existing password
  if (user.password) {
    const isMatch = await bcryptjs.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error('Invalid current password');
    }
  }

  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  return true;
};