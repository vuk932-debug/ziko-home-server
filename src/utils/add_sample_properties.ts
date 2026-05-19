import dotenv from 'dotenv';
import prisma from '../config/prisma';
import * as propertyRepo from '../api/v1/repositories/property.repository';

dotenv.config();

const addSampleProperties = async () => {
  try {
    console.log('Adding sample properties...');

    const cp = await prisma.user.findFirst({
      where: { role: 'CP' }
    });

    if (!cp) {
      console.error('No CP found. Please run npm run seed first.');
      process.exit(1);
    }

    const samples = [
      {
        title: 'Modern Penthouse with City View',
        description: 'Exquisite penthouse featuring floor-to-ceiling windows and a private terrace.',
        price: 12500000,
        propertyType: 'Apartment',
        bedrooms: 4,
        bathrooms: 3,
        area: 2800,
        category: 'NEW_PROJECT',
        location: 'Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560038',
        amenities: ['Gym', 'Pool', 'Terrace', 'Private Elevator'],
        images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750'],
        status: 'approved',
        sellerId: cp.id,
        verified: true,
        featured: true,
        slug: 'modern-penthouse-' + Date.now()
      },
      {
        title: 'Serene Villa in Gated Community',
        description: 'Spacious villa surrounded by lush greenery, perfect for a peaceful lifestyle.',
        price: 35000000,
        propertyType: 'Villa',
        bedrooms: 5,
        bathrooms: 5,
        area: 4500,
        location: 'Whitefield',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560066',
        amenities: ['Garden', 'Security', 'Clubhouse', 'Tennis Court'],
        images: ['https://images.unsplash.com/photo-1613977257363-707ba9348227'],
        status: 'approved',
        sellerId: cp.id,
        verified: true,
        featured: false,
        slug: 'serene-villa-' + (Date.now() + 1)
      },
      {
        title: 'Cozy 2BHK Near Tech Park',
        description: 'Conveniently located apartment, ideal for working professionals.',
        price: 5500000,
        propertyType: 'Apartment',
        bedrooms: 2,
        bathrooms: 2,
        area: 1100,
        category: 'READY_TO_MOVE',
        location: 'Electronic City',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560100',
        amenities: ['Parking', 'Power Backup', 'CCTV'],
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'],
        status: 'pending',
        sellerId: cp.id,
        verified: false,
        featured: false,
        slug: 'cozy-2bhk-' + (Date.now() + 2)
      }
    ];

    for (const sample of samples) {
      const created = await propertyRepo.createProperty(sample);
      console.log(`Added: ${created.title} (ID: ${created.id})`);
    }

    console.log('Sample properties added successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to add sample properties:', error);
    process.exit(1);
  }
};

addSampleProperties();
