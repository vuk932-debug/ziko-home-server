
const BASE_URL = 'http://localhost:5001/api/v1';

async function testAudit() {
  console.log('--- STARTING COMPREHENSIVE AUDIT ---');

  try {
    // 1. Test Public Listings
    console.log('\n[1] Testing Public Listings...');
    const publicRes = await fetch(`${BASE_URL}/properties`);
    const publicData = await publicRes.json();
    if (publicRes.ok) {
      console.log(`✅ Public Listings fetched. Count: ${publicData.properties.length}`);
    } else {
      console.error('❌ Failed to fetch public listings');
    }

    // 2. Register a new Seller
    console.log('\n[2] Registering a new Seller...');
    const sellerPayload = {
      name: 'Audit Seller',
      email: `seller_${Date.now()}@test.com`,
      phone: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      password: 'password123',
      role: 'Seller'
    };
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sellerPayload)
    });
    const regData = await regRes.json();
    if (regRes.status === 201) {
      console.log('✅ Seller registered successfully');
    } else {
      console.error('❌ Seller registration failed:', regData.message);
    }

    // 3. Login as Seller
    console.log('\n[3] Logging in as Seller...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: sellerPayload.email, password: sellerPayload.password })
    });
    const loginData = await loginRes.json();
    const sellerToken = loginData.accessToken;
    if (loginRes.ok) {
      console.log('✅ Seller logged in');
    } else {
      console.error('❌ Seller login failed');
    }

    // 4. Try to create property (Should fail if unapproved)
    console.log('\n[4] Attempting to create property (Expected failure if unapproved)...');
    const propPayload = {
      title: 'Audit Property',
      description: 'Audit test property',
      price: 1000000,
      propertyType: 'APARTMENT',
      bedrooms: 2,
      bathrooms: 2,
      area: 1200,
      location: 'Audit Zone',
      city: 'Audit City',
      state: 'Audit State',
      pincode: '123456',
      slug: `audit-prop-${Date.now()}`
    };
    const propRes = await fetch(`${BASE_URL}/properties`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sellerToken}`
      },
      body: JSON.stringify(propPayload)
    });
    const propData = await propRes.json();
    if (propRes.status === 403) {
      console.log('✅ Properly blocked unapproved seller:', propData.message);
    } else if (propRes.status === 201) {
      console.warn('⚠️ Unapproved seller was allowed to create property (Check approval logic)');
    } else {
      console.error('❌ Property creation failed with unexpected error:', propData.message);
    }

    // 5. Admin Login (Bootstrapped Admin)
    console.log('\n[5] Logging in as Admin...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@realistate.com', password: 'admin123' }) // Password from seed.ts
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.accessToken;
    if (adminLoginRes.ok) {
      console.log('✅ Admin logged in');
    } else {
      console.error('❌ Admin login failed. Check bootstrapped credentials.');
    }

    // 6. Approve Seller
    console.log('\n[6] Approving Seller as Admin...');
    const approveRes = await fetch(`${BASE_URL}/admin/sellers/${loginData.user.id}/manage`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ action: 'approve', value: true })
    });
    if (approveRes.ok) {
      console.log('✅ Seller approved');
    } else {
      const approveData = await approveRes.json();
      console.error('❌ Failed to approve seller:', approveData.message);
    }

    // 7. Seller Login again to get new token (if permissions are in token) or just retry
    // In our middleware, it fetches user from DB, so same token should work if it reflects status
    console.log('\n[7] Retrying property creation as approved seller...');
    // Need to assign a subscription plan first or bypass limit
    console.log('   (Manually assigning subscription plan to bypass limit...)');
    
    // First we need a plan ID. Let's create one.
    const planRes = await fetch(`${BASE_URL}/subscription/plans`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Audit Pro',
        description: 'Audit plan',
        price: 99,
        maxListings: 10,
        stripePriceId: 'price_audit'
      })
    });
    const planData = await planRes.json();
    
    await fetch(`${BASE_URL}/admin/subscriptions/assign`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ sellerId: loginData.user.id, planId: planData.id })
    });

    const propRes2 = await fetch(`${BASE_URL}/properties`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sellerToken}`
      },
      body: JSON.stringify(propPayload)
    });
    const propData2 = await propRes2.json();
    if (propRes2.status === 201) {
      console.log('✅ Property created successfully after approval and plan assignment');
    } else {
      console.error('❌ Property creation failed after approval:', propData2.message);
    }

    // 8. Lead Generation (Buyer)
    console.log('\n[8] Testing Lead Generation...');
    const leadPayload = {
        propertyId: propData2.property.id,
        buyerName: 'Audit Buyer',
        buyerEmail: 'buyer@audit.com',
        buyerPhone: '9999999999',
        message: 'I am interested in this property'
    };
    const leadRes = await fetch(`${BASE_URL}/buyer/properties/${propData2.property.id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadPayload)
    });
    if (leadRes.ok) {
        console.log('✅ Lead generated successfully');
    } else {
        const leadData = await leadRes.json();
        console.error('❌ Lead generation failed:', leadData.message);
    }

    console.log('\n--- AUDIT COMPLETED ---');

  } catch (error) {
    console.error('\n❌ Audit crashed with error:', error);
  }
}

testAudit();
