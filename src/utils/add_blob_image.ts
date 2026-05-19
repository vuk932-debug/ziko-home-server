import prisma from '../config/prisma';
import axios from 'axios';

async function addBlobImage() {
  const properties = await prisma.property.findMany({ select: { id: true } });
  
  if (properties.length === 0) {
    console.log('No properties found.');
    process.exit(0);
  }

  const propertyId = properties[0].id;
  console.log(`Adding Blob image to property: ${propertyId}`);

  try {
    // Fetch a real image to get a buffer
    const response = await axios.get('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', {
      responseType: 'arraybuffer'
    });
    
    const buffer = Buffer.from(response.data, 'binary');

    // Create a PropertyImage with binary data and NO URL
    const newImage = await prisma.propertyImage.create({
      data: {
        propertyId,
        imageData: buffer,
        mimeType: 'image/jpeg',
        url: null // Explicitly null to force using the serving endpoint
      }
    });

    console.log('Successfully added Blob image to MySQL!');
    console.log('Image ID:', newImage.id);
    console.log('Serving URL should be:', `http://localhost:5000/api/v1/properties/images/${newImage.id}`);
  } catch (error) {
    console.error('Failed to add blob image:', error);
  }

  process.exit(0);
}

addBlobImage();
