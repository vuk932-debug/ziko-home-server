import bcryptjs from 'bcryptjs';
import prisma from '../../../config/prisma';

export const createUser = async (userData: any) => {
  if (userData.password) {
    const salt = await bcryptjs.genSalt(10);
    userData.password = await bcryptjs.hash(userData.password, salt);
  }
  return await prisma.user.create({
    data: userData
  });
};

export const findUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email }
  });
};

export const findUserByPhone = async (phone: string) => {
  return await prisma.user.findUnique({
    where: { phone }
  });
};

export const findUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id }
  });
};

export const findUserByResetToken = async (hashedToken: string) => {
  return await prisma.user.findFirst({
    where: {
      OR: [
        {
          resetTokenHash: hashedToken,
          resetTokenExpiry: { gt: new Date() }
        },
        {
          passwordResetToken: hashedToken,
          passwordResetExpires: { gt: new Date() }
        }
      ]
    }
  });
};

export const updateUser = async (id: string, updateData: any) => {
  if (updateData.password) {
    const salt = await bcryptjs.genSalt(10);
    updateData.password = await bcryptjs.hash(updateData.password, salt);
  }
  return await prisma.user.update({
    where: { id },
    data: updateData
  });
};
