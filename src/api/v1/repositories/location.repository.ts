import prisma from '../../../config/prisma';

export const getAllCountries = async () => {
  return await prisma.country.findMany({
    orderBy: { name: 'asc' }
  });
};

export const getStatesByCountry = async (countryId: string) => {
  return await prisma.state.findMany({
    where: { countryId },
    orderBy: { name: 'asc' }
  });
};

export const getCitiesByState = async (stateId: string) => {
  return await prisma.city.findMany({
    where: { stateId },
    orderBy: { name: 'asc' }
  });
};

export const validateHierarchy = async (countryName: string, stateName: string, cityName: string) => {
  const city = await prisma.city.findFirst({
    where: {
      name: cityName,
      state: {
        name: stateName,
        country: {
          name: countryName
        }
      }
    }
  });
  return !!city;
};
