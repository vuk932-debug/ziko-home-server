import { propertySchema } from './shared/schemas/property.schema';
import { userSchema, otpSchema } from './shared/schemas/user.schema';
import { leadSchema } from './shared/schemas/lead.schema';

function testProperty() {
  console.log('Testing Property Schema...');
  
  const valid = propertySchema.safeParse({
    title: 'Skyline Penthouse',
    description: 'A beautiful penthouse with a view.',
    price: 7500000,
    propertyType: 'Apartment',
    bedrooms: 3,
    bathrooms: 3,
    area: 2500,
    location: 'Cyber Sector 7',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    contactNumber: '+919876543210'
  });
  console.log('Valid Property:', valid.success ? 'PASSED' : 'FAILED', valid.success ? '' : valid.error);

  const invalidPrice = propertySchema.safeParse({
    title: 'Cheap House',
    description: 'Too good to be true.',
    price: -100,
    propertyType: 'House',
    bedrooms: 1,
    bathrooms: 1,
    area: 500,
    location: 'Somewhere',
    city: 'Nowhere',
    state: 'None',
    pincode: '000000'
  });
  console.log('Invalid Price (-100):', !invalidPrice.success ? 'PASSED (Rejected)' : 'FAILED (Accepted)');

  const extremeBedrooms = propertySchema.safeParse({
    title: 'Mansion',
    description: 'Too many rooms.',
    price: 10000000,
    propertyType: 'House',
    bedrooms: 100,
    bathrooms: 1,
    area: 500,
    location: 'Somewhere',
    city: 'Nowhere',
    state: 'None',
    pincode: '000000'
  });
  console.log('Extreme Bedrooms (100):', !extremeBedrooms.success ? 'PASSED (Rejected)' : 'FAILED (Accepted)');
}

function testUser() {
  console.log('\nTesting User Schema...');
  
  const validUser = userSchema.safeParse({
    name: 'John Doe',
    email: 'JOHN.DOE@EXAMPLE.COM',
    phone: '+91 98765-43210',
  });
  console.log('Valid User (with normalization):', validUser.success ? 'PASSED' : 'FAILED');
  if (validUser.success) {
    console.log('  Normalized Email:', validUser.data.email);
    console.log('  Normalized Phone:', validUser.data.phone);
  }

  const invalidEmail = userSchema.safeParse({
    name: 'Bad Email',
    email: 'not-an-email',
    phone: '9876543210'
  });
  console.log('Invalid Email:', !invalidEmail.success ? 'PASSED (Rejected)' : 'FAILED (Accepted)');
}

function testLead() {
    console.log('\nTesting Lead Schema...');
    const validLead = leadSchema.safeParse({
        propertyId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '98765 43210'
    });
    console.log('Valid Lead (with normalization):', validLead.success ? 'PASSED' : 'FAILED');
    if (validLead.success) {
        console.log('  Normalized Phone:', validLead.data.phone);
    }
}

try {
  testProperty();
  testUser();
  testLead();
} catch (e) {
  console.error(e);
}
