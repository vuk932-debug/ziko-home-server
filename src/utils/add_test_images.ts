import prisma from '../config/prisma';

async function addTestImages() {
  const properties = await prisma.property.findMany({ select: { id: true } });
  
  if (properties.length === 0) {
    console.log('No properties found to add images to.');
    process.exit(0);
  }

  console.log(`Found ${properties.length} properties. Adding test images...`);

  const testImageUrl = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

  for (const prop of properties) {
    await prisma.propertyImage.create({
      data: {
        propertyId: prop.id,
        url: testImageUrl
      }
    });
    console.log(`Added test image to property ${prop.id}`);
  }

  console.log('Done!');
  process.exit(0);
}

addTestImages();
