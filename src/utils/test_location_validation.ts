import { propertySchema } from '../shared/schemas/property.schema';

function testLocationHierarchy() {
  console.log('Testing Location Hierarchy Validation...');

  const valid = propertySchema.safeParse({
    title: 'Valid Location',
    description: 'Testing valid hierarchy.',
    price: 1000000,
    propertyType: 'Apartment',
    bedrooms: 2,
    bathrooms: 2,
    area: 1200,
    location: 'Bandra West',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    pincode: '400050'
  });
  console.log('Valid (India -> Maharashtra -> Mumbai):', valid.success ? 'PASSED' : 'FAILED');

  const invalidCity = propertySchema.safeParse({
    title: 'Invalid City',
    description: 'Testing invalid city in state.',
    price: 1000000,
    propertyType: 'Apartment',
    bedrooms: 2,
    bathrooms: 2,
    area: 1200,
    location: 'Something',
    country: 'India',
    state: 'Maharashtra',
    city: 'Bengaluru', // Bengaluru is in Karnataka
    pincode: '400050'
  });
  console.log('Invalid City (Bengaluru in Maharashtra):', !invalidCity.success ? 'PASSED (Rejected)' : 'FAILED (Accepted)');
  if (!invalidCity.success) {
      console.log('  Error:', invalidCity.error.issues[0].message);
  }

  const invalidState = propertySchema.safeParse({
    title: 'Invalid State',
    description: 'Testing invalid state in country.',
    price: 1000000,
    propertyType: 'Apartment',
    bedrooms: 2,
    bathrooms: 2,
    area: 1200,
    location: 'Something',
    country: 'India',
    state: 'Dubai', // Dubai is in UAE
    city: 'Mumbai',
    pincode: '400050'
  });
  console.log('Invalid State (Dubai in India):', !invalidState.success ? 'PASSED (Rejected)' : 'FAILED (Accepted)');
}

try {
    testLocationHierarchy();
} catch (e) {
    console.error(e);
}
