import prisma from '../config/prisma';

const LOCATION_DATA = [
  {
    name: 'India',
    code: 'IN',
    states: [
      {
        name: 'Maharashtra',
        code: 'MH',
        cities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Navi Mumbai', 'Kolhapur', 'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur']
      },
      {
        name: 'Karnataka',
        code: 'KA',
        cities: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Davanagere', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumakuru', 'Raichur', 'Bidar', 'Hassan', 'Gadag']
      },
      {
        name: 'Tamil Nadu',
        code: 'TN',
        cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur']
      },
      {
        name: 'Telangana',
        code: 'TG',
        cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet']
      },
      {
        name: 'Delhi',
        code: 'DL',
        cities: ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Dwarka', 'Rohini', 'Saket', 'Janakpuri', 'Vasant Kunj']
      },
      {
        name: 'Gujarat',
        code: 'GJ',
        cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Gandhidham', 'Anand', 'Navsari', 'Morbi', 'Nadiad', 'Bharuch', 'Mehsana']
      },
      {
        name: 'Uttar Pradesh',
        code: 'UP',
        cities: ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Meerut', 'Varanasi', 'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Firozabad', 'Jhansi', 'Greater Noida']
      },
      {
        name: 'West Bengal',
        code: 'WB',
        cities: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Maheshtala', 'Rajpur Sonarpur', 'South Dumdum', 'Gopalpur', 'Bhatpara', 'Panihati', 'Kamarhati', 'Bardhaman', 'Kulyati', 'Baharampur']
      },
      {
        name: 'Rajasthan',
        code: 'RJ',
        cities: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sriganganagar', 'Sikar', 'Pali', 'Chittorgarh']
      },
      {
        name: 'Kerala',
        code: 'KL',
        cities: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Kollam', 'Thrissur', 'Alappuzha', 'Palakkad', 'Malappuram', 'Manjeri', 'Thalassery']
      },
      {
        name: 'Punjab',
        code: 'PB',
        cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur', 'Pathankot', 'Moga', 'Abohar']
      },
      {
        name: 'Haryana',
        code: 'HR',
        cities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak', 'Sonipat', 'Yamunanagar', 'Panchkula']
      },
      {
        name: 'Madhya Pradesh',
        code: 'MP',
        cities: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa']
      },
      {
        name: 'Andhra Pradesh',
        code: 'AP',
        cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kakinada', 'Kadapa', 'Anantapur']
      },
      {
        name: 'Bihar',
        code: 'BR',
        cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Arrah', 'Begusarai', 'Katihar', 'Munger']
      },
      {
        name: 'Odisha',
        code: 'OR',
        cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada']
      },
      {
        name: 'Assam',
        code: 'AS',
        cities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur']
      },
      {
        name: 'Jharkhand',
        code: 'JH',
        cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Deoghar', 'Phusro', 'Hazaribagh']
      },
      {
        name: 'Chhattisgarh',
        code: 'CT',
        cities: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Raigarh', 'Jagdalpur']
      },
      {
        name: 'Uttarakhand',
        code: 'UT',
        cities: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh']
      },
      {
        name: 'Goa',
        code: 'GA',
        cities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda']
      }
    ]
  },
  {
    name: 'United Arab Emirates',
    code: 'AE',
    states: [
      { name: 'Dubai', cities: ['Dubai City', 'Jumeirah', 'Deira', 'Bur Dubai', 'Dubai Marina', 'Business Bay', 'Downtown Dubai', 'Palm Jumeirah', 'Al Barsha', 'Mirdif'] },
      { name: 'Abu Dhabi', cities: ['Abu Dhabi City', 'Al Ain', 'Al Ruwais', 'Musaffah', 'Khalifa City', 'Yas Island', 'Saadiyat Island'] },
      { name: 'Sharjah', cities: ['Sharjah City', 'Khor Fakkan', 'Kalba', 'Al Dhaid'] },
      { name: 'Ajman', cities: ['Ajman City'] },
      { name: 'Ras Al Khaimah', cities: ['Ras Al Khaimah City'] },
      { name: 'Fujairah', cities: ['Fujairah City'] },
      { name: 'Umm Al Quwain', cities: ['Umm Al Quwain City'] }
    ]
  },
  {
    name: 'USA',
    code: 'US',
    states: [
      { name: 'California', code: 'CA', cities: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento', 'Oakland', 'Fresno', 'Long Beach', 'Irvine'] },
      { name: 'New York', code: 'NY', cities: ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse', 'Yonkers'] },
      { name: 'Texas', code: 'TX', cities: ['Houston', 'Austin', 'Dallas', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi'] },
      { name: 'Florida', code: 'FL', cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Tallahassee', 'Fort Lauderdale', 'St. Petersburg'] },
      { name: 'Illinois', code: 'IL', cities: ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville'] }
    ]
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    states: [
      { name: 'England', cities: ['London', 'Birmingham', 'Manchester', 'Liverpool', 'Leeds', 'Bristol', 'Sheffield', 'Newcastle', 'Nottingham', 'Leicester', 'Southampton', 'Reading'] },
      { name: 'Scotland', cities: ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Inverness', 'Perth'] },
      { name: 'Wales', cities: ['Cardiff', 'Swansea', 'Newport', 'Wrexham'] },
      { name: 'Northern Ireland', cities: ['Belfast', 'Londonderry', 'Lisburn', 'Newry'] }
    ]
  }
];

async function seedLocations() {
  console.log('--- Seeding Locations ---');

  for (const country of LOCATION_DATA) {
    const upsertedCountry = await prisma.country.upsert({
      where: { code: country.code },
      update: { name: country.name },
      create: { name: country.name, code: country.code }
    });

    for (const state of country.states as any[]) {
      const upsertedState = await prisma.state.upsert({
        where: {
          name_countryId: {
            name: state.name,
            countryId: upsertedCountry.id
          }
        },
        update: { code: state.code || null },
        create: {
          name: state.name,
          code: state.code || null,
          countryId: upsertedCountry.id
        }
      });

      for (const cityName of state.cities) {
        await prisma.city.upsert({
          where: {
            name_stateId: {
              name: cityName,
              stateId: upsertedState.id
            }
          },
          update: {
            countryId: upsertedCountry.id
          },
          create: {
            name: cityName,
            stateId: upsertedState.id,
            countryId: upsertedCountry.id
          }
        });
      }
    }
  }

  console.log('Locations seeded successfully!');
}

seedLocations()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
