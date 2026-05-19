import prisma from '../config/prisma';
import { propertySchema } from '../shared/schemas/property.schema';

async function auditAndMigrate() {
  console.log('--- Starting Location Migration & Audit ---');

  const properties = await prisma.property.findMany({
    where: { isDeleted: false }
  });

  console.log(`Auditing ${properties.length} properties...`);
  let invalid = 0;
  let updated = 0;

  for (const p of properties) {
    const result = propertySchema.safeParse({
        ...p,
        amenities: []
    });

    if (!result.success) {
      invalid++;
      console.log(`[INVALID] ID: ${p.id}, Title: ${p.title}`);
      console.log(`  Current: ${p.country} -> ${p.state} -> ${p.city}`);
      console.log(result.error.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n'));
      
      // Attempt soft fix: Mark as needs review if hierarchy is broken
      // We don't automatically fix city names to avoid data loss
    } else {
        // Data is already structured correctly
    }
  }

  console.log('\n--- Migration Summary ---');
  console.log(`Total Scanned: ${properties.length}`);
  console.log(`Invalid Hierarchies: ${invalid}`);
  console.log(`Successfully Migrated: ${updated}`);
  console.log('Note: Manual correction required for "Invalid" records via Admin Dashboard.');
}

auditAndMigrate()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
