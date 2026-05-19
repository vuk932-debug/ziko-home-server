import prisma from '../config/prisma';
import { propertySchema } from '../shared/schemas/property.schema';

async function cleanup() {
  console.log('--- Starting Data Cleanup ---');

  // 1. Normalize Users
  const users = await prisma.user.findMany();
  for (const u of users) {
    await prisma.user.update({
      where: { id: u.id },
      data: {
        email: u.email ? u.email.trim().toLowerCase() : null,
        phone: u.phone.trim()
      }
    });
  }
  console.log(`Normalized ${users.length} users.`);

  // 2. Flag Invalid Properties
  const properties = await prisma.property.findMany();
  let flagged = 0;
  for (const p of properties) {
    const result = propertySchema.safeParse({
        ...p,
        amenities: []
    });
    if (!result.success) {
      await prisma.property.update({
        where: { id: p.id },
        data: {
          status: 'pending',
          verified: false
        }
      });
      flagged++;
    }
  }
  console.log(`Flagged ${flagged} invalid properties as pending.`);
}

cleanup()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
