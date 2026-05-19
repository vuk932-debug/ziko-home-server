import prisma from '../config/prisma';

async function main() {
  console.log('Listing all properties in DB:');
  const properties = await prisma.property.findMany({
    select: { id: true, title: true, slug: true },
    take: 10
  });
  console.log(JSON.stringify(properties, null, 2));
  process.exit(0);
}

main();
