import dotenv from 'dotenv';
import prisma from '../config/prisma';
import * as userRepo from '../api/v1/repositories/user.repository';
import * as propertyRepo from '../api/v1/repositories/property.repository';

dotenv.config();

const seed = async () => {
  try {
    console.log('Starting ZikoHome Prisma seeding...');

    // Clear existing data (Order matters for foreign keys)
    await prisma.leadNote.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.propertyImage.deleteMany({});
    await prisma.propertyAmenity.deleteMany({});
    await prisma.userSavedProperty.deleteMany({});
    await prisma.userRecentlyViewed.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log('Cleared existing data');

    // Create Admin
    const admin = await userRepo.createUser({
      name: 'System Admin',
      email: 'admin@realistate.com',
      phone: '0000000000',
      password: 'admin123',
      role: 'Admin',
      isApproved: true,
      isVerified: true,
      isActive: true
    });
    console.log('Admin created');

    // Create CP (Channel Partner)
    const cp = await userRepo.createUser({
      name: 'John Partner',
      email: 'cp@example.com',
      phone: '9876543210',
      agentId: 'ZH-CP-0001',
      role: 'CP',
      isApproved: true,
      isVerified: true,
      isActive: true
    });
    console.log('CP (Channel Partner) created');

    // Assign Subscription to CP
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await prisma.subscription.create({
      data: {
        userId: cp.id,
        planType: 'PRO',
        startDate,
        endDate,
        isActive: true,
        listingsCount: 1
      }
    });
    console.log('Subscription assigned to CP');

    // Create Customer
    const customer = await userRepo.createUser({
      name: 'Jane Customer',
      email: 'customer@example.com',
      phone: '1234567890',
      role: 'Customer',
      isApproved: true,
      isVerified: true,
      isActive: true
    });
    console.log('Customer created');

    // Create Property
    const property = await propertyRepo.createProperty({
      title: 'Ziko Luxury Suite',
      description: 'A beautiful luxury apartment with all modern amenities.',
      price: 7500000,
      propertyType: 'Apartment',
      bedrooms: 3,
      bathrooms: 2,
      area: 1500,
      location: 'HSR Layout',
      city: 'Bangalore',
      state: 'Karnataka',
      category: 'READY_TO_MOVE',
      pincode: '560102',
      amenities: ['Gym', 'Pool', 'Parking'],
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'],
      status: 'approved',
      sellerId: cp.id,
      verified: true,
      featured: true,
      slug: 'ziko-luxury-suite-' + Math.floor(Math.random() * 1000)
    });
    console.log('Property created:', property.id);

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
