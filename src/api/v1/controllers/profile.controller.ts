import { Request, Response } from 'express';
import * as profileService from '../services/profile.service';

export const getProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const profile = await profileService.getUserProfile(userId);
    res.status(200).json(profile);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const data = req.body;
    
    // If a file was uploaded, add its URL to the data payload
    if (req.file) {
      data.profileImage = req.file.path;
    }

    const updatedProfile = await profileService.updateUserProfile(userId, data);
    res.status(200).json(updatedProfile);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const changePassword = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    await profileService.changeUserPassword(userId, currentPassword, newPassword);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};