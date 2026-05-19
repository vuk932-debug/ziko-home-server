import prisma from '../config/prisma';

async function check() {
  console.log('--- Database Population Status ---');

  const countryCount = await prisma.country.count();
  const stateCount = await prisma.state.count();
  const cityCount = await prisma.city.count();
  const propertyCount = await prisma.property.count();
  const userCount = await prisma.user.count();

  console.log(`Countries: ${countryCount}`);
  console.log(`States: ${stateCount}`);
  console.log(`Cities: ${cityCount}`);
  console.log(`Properties: ${propertyCount}`);
  console.log(`Users: ${userCount}`);

  if (countryCount > 0) {
    console.log('\nSample Countries:');
    const countries = await prisma.country.findMany({ take: 5 });
    console.table(countries);
  }

  if (propertyCount > 0) {
    console.log('\nRecent Properties (Location Snippet):');
    const properties = await prisma.property.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        country: true,
        state: true,
        city: true,
        location: true
      },
      orderBy: { createdAt: 'desc' }
    });
    console.table(properties);
  }
}

check()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
