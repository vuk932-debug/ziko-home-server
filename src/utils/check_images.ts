import prisma from '../config/prisma';

async function checkImages() {
  const images = await prisma.propertyImage.findMany();
  console.log(`Total images in DB: ${images.length}`);
  images.forEach(img => {
    console.log(`Image ID: ${img.id}, Property ID: ${img.propertyId}, URL: ${img.url}, Has Data: ${!!img.imageData}`);
  });
  process.exit(0);
}

checkImages();
