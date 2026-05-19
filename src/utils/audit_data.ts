import prisma from '../config/prisma';
import { propertySchema } from '../shared/schemas/property.schema';
import { userSchema } from '../shared/schemas/user.schema';
import { leadSchema } from '../shared/schemas/lead.schema';

async function audit() {
  console.log('--- Starting Data Audit ---');

  // 1. Audit Properties
  const properties = await prisma.property.findMany();
  console.log(`Auditing ${properties.length} properties...`);
  let invalidProperties = 0;
  for (const p of properties) {
    const result = propertySchema.safeParse({
        ...p,
        amenities: [] // Simplified for audit
    });
    if (!result.success) {
      invalidProperties++;
      console.log(`[Property Error] ID: ${p.id}, Title: ${p.title}`);
      console.log(result.error.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n'));
    }
  }

  // 2. Audit Users
  const users = await prisma.user.findMany();
  console.log(`Auditing ${users.length} users...`);
  let invalidUsers = 0;
  for (const u of users) {
    const result = userSchema.safeParse(u);
    if (!result.success) {
      invalidUsers++;
      console.log(`[User Error] ID: ${u.id}, Email: ${u.email}, Phone: ${u.phone}`);
      console.log(result.error.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n'));
    }
  }

  // 3. Audit Leads
  const leads = await prisma.lead.findMany();
  console.log(`Auditing ${leads.length} leads...`);
  let invalidLeads = 0;
  for (const l of leads) {
    const result = leadSchema.safeParse(l);
    if (!result.success) {
      invalidLeads++;
      console.log(`[Lead Error] ID: ${l.id}, Phone: ${l.phone}`);
      console.log(result.error.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n'));
    }
  }

  console.log('\n--- Audit Summary ---');
  console.log(`Invalid Properties: ${invalidProperties}`);
  console.log(`Invalid Users: ${invalidUsers}`);
  console.log(`Invalid Leads: ${invalidLeads}`);
}

audit()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
