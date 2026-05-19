import prisma from '../../../config/prisma';
import { PropertyStatus, PlanType } from '@prisma/client';
import { config } from '../../../config/env';

const formatPrice = (price: number) => {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(0)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
};

export const mapProperty = (property: any) => {
  if (!property) return null;
  const originalLocation = property.location;
  const mapped = {
    ...property,
    priceLabel: formatPrice(property.price),
    location: originalLocation,
    structuredLocation: {
      area: originalLocation,
      city: property.city,
      state: property.state,
      country: property.country
    },
    bhk: property.bedrooms,
    areaSqft: property.area,
    category: property.category,
    tier: property.planType,
    isFeatured: property.featured,
    postedAt: property.createdAt,
    // Alias cp as seller for frontend/service compatibility
    seller: property.cp,
    // Generate serving URLs for frontend consumption
    images: property.images ? property.images.map((img: any) => ({
      id: img.id,
      url: img.url || `${config.BACKEND_URL}/api/v1/properties/images/${img.id}`
    })) : [],
    amenities: property.amenities ? property.amenities.map((amn: any) => amn.name) : []
  };
  console.log(`[DEBUG] Mapped property ${property.id}:`, {
    title: mapped.title,
    imageCount: mapped.images.length,
    firstImage: mapped.images[0]
  });
  return mapped;
};

export const countActivePropertiesBySeller = async (sellerId: string) => {
  return await prisma.property.count({
    where: { 
      sellerId,
      isDeleted: false 
    }
  });
};

export const createProperty = async (data: any) => {
  const { images, amenities, sellerId, ...rest } = data;
  
  const property = await prisma.property.create({
    data: {
      ...rest,
      sellerId,
      images: images && images.length > 0 ? {
        create: images.map((file: any) => ({
          imageData: file.buffer,
          mimeType: file.mimetype
        }))
      } : undefined,
      amenities: amenities && amenities.length > 0 ? {
        create: amenities.map((name: string) => ({ name }))
      } : undefined
    },
    include: {
        images: true,
        amenities: true
    }
  });
  return mapProperty(property);
};

export const getPropertyImageById = async (imageId: string) => {
  return await prisma.propertyImage.findUnique({
    where: { id: imageId }
  });
};

export const getProperties = async (query: any) => {
  const { 
    country,
    state,
    city,
    location, 
    category,
    minPrice, 
    maxPrice, 
    propertyType, 
    bedrooms,
    sortBy = 'relevance', 
    page = 1, 
    limit = 10,
    seed
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  // Prisma filter building
  const where: any = { 
    status: 'approved' as PropertyStatus,
    isDeleted: false,
    cp: {
      isActive: true,
      subscription: {
        some: {
          isActive: true,
          endDate: { gte: new Date() }
        }
      }
    }
  };

  if (country) where.country = country;
  if (state) where.state = state;
  if (city) where.city = city;
  if (category) where.category = category;
  if (propertyType) where.propertyType = propertyType;

  if (location) {
    where.OR = [
      { title: { contains: location } },
      { location: { contains: location } },
      { city: { contains: location } },
      { state: { contains: location } },
      { description: { contains: location } }
    ];
  }
  
  if (bedrooms) {
    const b = Number(bedrooms);
    if (b >= 4) where.bedrooms = { gte: 4 };
    else where.bedrooms = b;
  }
  
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  // Optimized Hybrid Sorting Strategy
  // If we need relevance/randomization, we fetch IDs first to avoid heavy RAND() on full rows
  if (sortBy === 'relevance' || !sortBy) {
    const allMatching = await prisma.property.findMany({
      where,
      select: { id: true, priorityScore: true, impressionCount: true },
      orderBy: [
        { priorityScore: 'desc' },
        { impressionCount: 'asc' }
      ]
    });

    // Apply stable randomization within priority tiers if seed is provided
    let sortedIds = allMatching.map(p => p.id);
    
    if (seed) {
      // Deterministic shuffle within tiers using seed
      const groups: Record<number, any[]> = {};
      allMatching.forEach(p => {
        if (!groups[p.priorityScore]) groups[p.priorityScore] = [];
        groups[p.priorityScore].push(p);
      });

      const randomizedIds: string[] = [];
      const sortedTiers = Object.keys(groups).map(Number).sort((a, b) => b - a);
      
      sortedTiers.forEach(tier => {
        const tierItems = groups[tier];
        // Stable pseudo-random sort using seed + ID
        tierItems.sort((a, b) => {
          const valA = (parseInt(a.id.substring(0, 8), 16) || 0) ^ seed;
          const valB = (parseInt(b.id.substring(0, 8), 16) || 0) ^ seed;
          if (valA !== valB) return valA - valB;
          return a.impressionCount - b.impressionCount;
        });
        randomizedIds.push(...tierItems.map(p => p.id));
      });
      sortedIds = randomizedIds;
    }

    const total = sortedIds.length;
    const paginatedIds = sortedIds.slice(skip, skip + take);

    const properties = await prisma.property.findMany({
      where: { id: { in: paginatedIds } },
      include: {
        cp: { select: { id: true, name: true, email: true } },
        images: true,
        amenities: true
      }
    });

    // Re-sort to maintain ID order from paginatedIds
    const idMap = new Map(properties.map(p => [p.id, p]));
    const result = paginatedIds.map(id => idMap.get(id)).filter(Boolean);

    return {
      properties: result.map(mapProperty),
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / take)
      }
    };
  }

  // Standard sorting for price/newest (Direct Prisma query)
  let orderBy: any = [];
  if (sortBy === 'price_asc') orderBy = { price: 'asc' };
  else if (sortBy === 'price_desc') orderBy = { price: 'desc' };
  else if (sortBy === 'newest') orderBy = { createdAt: 'desc' };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        cp: { select: { id: true, name: true, email: true } },
        images: true,
        amenities: true
      }
    }),
    prisma.property.count({ where })
  ]);

  return {
    properties: properties.map(mapProperty),
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / take)
    }
  };
};

export const updatePropertyStatus = async (id: string, status: string) => {
  const property = await prisma.property.update({
    where: { id },
    data: { status: status as PropertyStatus },
    include: {
        images: true,
        amenities: true
    }
  });
  return mapProperty(property);
};

export const getSuggests = async (searchTerm: string) => {
  const [properties, cities, states] = await Promise.all([
    prisma.property.findMany({
      where: {
        status: 'approved',
        isDeleted: false,
        OR: [
          { title: { contains: searchTerm } },
          { city: { contains: searchTerm } },
          { location: { contains: searchTerm } }
        ]
      },
      select: {
        title: true,
        slug: true,
        city: true,
        price: true,
        images: { take: 1 },
        lat: true,
        lng: true
      },
      take: 4
    }),
    prisma.city.findMany({
      where: { name: { contains: searchTerm } },
      select: { name: true, state: { select: { name: true } }, country: { select: { name: true } } },
      take: 3
    }),
    prisma.state.findMany({
      where: { name: { contains: searchTerm } },
      select: { name: true, country: { select: { name: true } } },
      take: 2
    })
  ]);

  return {
    properties: properties.map(mapProperty),
    locations: [
      ...cities.map(c => ({ type: 'city', name: c.name, sub: `${c.state.name}, ${c.country.name}` })),
      ...states.map(s => ({ type: 'state', name: s.name, sub: s.country.name }))
    ]
  };
};

export const getComparison = async (ids: string[]) => {
  const properties = await prisma.property.findMany({
    where: {
      id: { in: ids },
      status: 'approved'
    },
    include: {
      images: true,
      amenities: true
    }
  });
  return properties.map(mapProperty);
};

export const getBySlug = async (slugOrId: string) => {
  return await prisma.$transaction(async (tx) => {
    // Try finding by slug first, then by ID
    const property = await tx.property.findFirst({
      where: {
        OR: [
          { slug: slugOrId },
          { id: slugOrId }
        ]
      },
      include: {
        cp: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isVerified: true,
            trustScore: true,
            isActive: true,
            subscription: {
              where: { isActive: true },
              select: { isActive: true, endDate: true }
            }
          }
        },
        images: true,
        amenities: true
      }
    });

    if (property && property.status === 'approved') {
      const activeSubs = property.cp.subscription;
      const isSubActive = activeSubs.length > 0 && new Date(activeSubs[0].endDate) >= new Date();
      
      if (!property.cp.isActive || !isSubActive) {
        return null;
      }

      await tx.property.update({
        where: { id: property.id },
        data: {
          views: { increment: 1 },
          detailViewCount: { increment: 1 },
          popularityScore: { increment: 1 }
        }
      });
    }

    return mapProperty(property);
  });
};

export const getPropertyById = async (id: string) => {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      images: true,
      amenities: true,
      cp: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isVerified: true,
          trustScore: true,
          isActive: true,
          subscription: {
            where: { isActive: true },
            select: { isActive: true, endDate: true }
          }
        }
      }
    }
  });

  return mapProperty(property);
};

export const refreshProperty = async (id: string) => {
  const property = await prisma.property.update({
    where: { id },
    data: { lastRefreshedAt: new Date() },
    include: {
        images: true,
        amenities: true
    }
  });
  return mapProperty(property);
};

export const incrementImpressions = async (propertyIds: string[]) => {
  return await prisma.property.updateMany({
    where: { id: { in: propertyIds } },
    data: { impressionCount: { increment: 1 } }
  });
};
