import prisma from '../config/prisma';

async function main() {
  const targetId = '000000000000000000000001';
  console.log('Searching for property:', targetId);
  
  const p = await prisma.property.findFirst({
    where: {
      OR: [
        { id: targetId },
        { slug: targetId }
      ]
    },
    include: {
      cp: {
        include: {
          subscription: true
        }
      }
    }
  });

  if (p) {
    console.log('Property found:', JSON.stringify(p, null, 2));
    console.log('Status:', p.status);
    console.log('CP Active:', p.cp.isActive);
    console.log('Subscriptions:', p.cp.subscription.length);
  } else {
    console.log('Property NOT found.');
  }
  
  process.exit(0);
}

main();
