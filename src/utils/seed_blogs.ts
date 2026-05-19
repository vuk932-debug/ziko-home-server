import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import slugify from 'slugify';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Blog CMS Seeding Protocol...');

  // 1. Create Writers
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash('password123', salt);

  const writersData = [
    {
      name: 'Elena Vance',
      email: 'elena.vance@zikohome.com',
      phone: '9876543210',
      role: 'WRITER' as any,
      agentId: 'ZH-WR-0001',
      isApproved: true,
      isVerified: true,
      isActive: true,
    },
    {
      name: 'Marcus Thorne',
      email: 'marcus.thorne@zikohome.com',
      phone: '9876543211',
      role: 'WRITER' as any,
      agentId: 'ZH-WR-0002',
      isApproved: true,
      isVerified: true,
      isActive: true,
    },
    {
      name: 'Sarah Chen',
      email: 'sarah.chen@zikohome.com',
      phone: '9876543212',
      role: 'WRITER' as any,
      agentId: 'ZH-WR-0003',
      isApproved: true,
      isVerified: true,
      isActive: true,
    },
  ];

  const writers = [];
  for (const data of writersData) {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { agentId: data.agentId }] }
    });

    let user;
    if (existingUser) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: 'WRITER' as any }
      });
      console.log(`🔄 Writer Updated: ${user.name} (${user.agentId})`);
    } else {
      user = await prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
      });
      console.log(`✅ Writer Created: ${user.name} (${user.agentId})`);
    }
    writers.push(user);
  }

  // 2. Sample Posts Data
  const posts = [
    // Elena Vance (Architectural Specialist)
    {
      authorIdx: 0,
      title: 'The Rise of Generative Urbanism',
      excerpt: 'How AI algorithms are optimizing living spaces for maximum well-being and energy efficiency.',
      content: 'The convergence of artificial intelligence and physical architecture is no longer speculative. At ZikoHome, we are tracking "Generative Urbanism," a design philosophy where algorithms adjust lighting, temperature, and spatial layouts in real-time based on human flow.',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070',
      status: 'PUBLISHED',
    },
    {
      authorIdx: 0,
      title: 'Biophilic Skyscrapers: Breathing Cities',
      excerpt: 'Integrating vertical forests into high-density urban environments to restore ecological balance.',
      content: 'Biophilic design is moving from aesthetic choice to structural necessity. Our latest reports show that integrating vertical forests reduces urban heat island effects by up to 40% while improving resident mental health scores significantly.',
      image: 'https://images.unsplash.com/photo-1449156003053-93d3a62bf270?q=80&w=2070',
      status: 'PUBLISHED',
    },
    {
      authorIdx: 0,
      title: 'Modular Living: The Lego-Brick Revolution',
      excerpt: 'The future of residential construction lies in high-precision, factory-built modular units.',
      content: 'Pre-fabricated modular housing is solving the scale problem of modern urban growth. ZikoHome explores how these high-precision units reduce waste by 60% and cutting construction timelines in half without sacrificing luxury.',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070',
      status: 'REVIEW',
    },
    {
      authorIdx: 0,
      title: 'Kinetic Facades: Buildings that Move',
      excerpt: 'Adaptive building skins that respond to solar radiation to minimize energy consumption.',
      content: 'Imagine a building that "blinks" to shade itself from the harsh afternoon sun. Kinetic facades use smart sensors to adjust external louvers, maintaining optimal internal temperature without relying on HVAC systems.',
      image: 'https://images.unsplash.com/photo-1503387762-592df58ef3fb?q=80&w=2070',
      status: 'DRAFT',
    },

    // Marcus Thorne (Market Analyst)
    {
      authorIdx: 1,
      title: '2026 Global Luxury Market Outlook',
      excerpt: 'An exhaustive analysis of cross-border investment trends in premium real estate nodes.',
      content: 'The 2026 landscape is defined by "Intelligence Capital." Investors are shifting focus from square footage to digital infrastructure depth. We analyze why Ziko nodes are seeing a 15% premium over traditional luxury assets.',
      image: 'https://images.unsplash.com/photo-1460472178825-e5240623abe5?q=80&w=2070',
      status: 'PUBLISHED',
    },
    {
      authorIdx: 1,
      title: 'Tokenized Assets: Democratizing Ownership',
      excerpt: 'How blockchain-based fractional ownership is opening high-value assets to a new class of investors.',
      content: 'Fractionalization is here. By breaking down high-value properties into secure digital tokens, ZikoHome is enabling portfolio diversification previously reserved for institutional hedge funds.',
      image: 'https://images.unsplash.com/photo-1551288049-bbbda536adfb?q=80&w=2070',
      status: 'PUBLISHED',
    },
    {
      authorIdx: 1,
      title: 'The "Green Premium" in Valuation',
      excerpt: 'Calculating the exact ROI of sustainable certifications in modern property appraisal.',
      content: 'Sustainability is no longer a "nice to have"—it is a value multiplier. Properties with Net-Zero certifications are trading at a 22% premium compared to conventional assets in major metropolitan sectors.',
      image: 'https://images.unsplash.com/photo-1473300304419-30748d559868?q=80&w=2070',
      status: 'PUBLISHED',
    },
    {
      authorIdx: 1,
      title: 'Predictive Pricing: The End of Guesswork',
      excerpt: 'Using machine learning to forecast market fluctuations with 95% accuracy.',
      content: 'Traditional appraisals are reactive. ZikoHome uses predictive neural nets to analyze thousands of data points—from transit expansions to retail shifts—to forecast value growth years before it happens.',
      image: 'https://images.unsplash.com/photo-1551288049-bbbda536adfb?q=80&w=2070',
      status: 'REVIEW',
    },

    // Sarah Chen (Tech Specialist)
    {
      authorIdx: 2,
      title: 'The Nexus Protocol: ZikoHome Infrastructure',
      excerpt: 'Deep dive into the proprietary operating system powering our intelligent assets.',
      content: 'Every ZikoHome property runs on the "Nexus Protocol," an autonomous OS that manages everything from security to predictive maintenance. It is the central nervous system of the modern home.',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070',
      status: 'PUBLISHED',
    },
    {
      authorIdx: 2,
      title: 'Quantum Security for Smart Properties',
      excerpt: 'Protecting residential data nodes against next-generation cryptographic threats.',
      content: 'As homes become data-rich, security must be absolute. We are implementing post-quantum encryption across all property networks to ensure resident privacy remains uncompromisable.',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?q=80&w=2070',
      status: 'PUBLISHED',
    },
    {
      authorIdx: 2,
      title: 'Holographic Staging: The Virtual View',
      excerpt: 'Revolutionizing the property viewing experience with full-scale mixed reality overlays.',
      content: 'Why view a floor plan when you can walk through it? Our holographic staging tech allows buyers to customize finishes and layouts in real-time during a physical walkthrough.',
      image: 'https://images.unsplash.com/photo-1633113087654-c49c686c2cdf?q=80&w=2070',
      status: 'PUBLISHED',
    },
    {
      authorIdx: 2,
      title: 'Autonomous Maintenance Drones',
      excerpt: 'The invisible workforce keeping our building facades and HVAC systems in peak condition.',
      content: 'Maintenance is moving from reactive to proactive. Ziko nodes now deploy autonomous micro-drones for exterior inspections and repairs, reducing long-term maintenance costs by 30%.',
      image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=2070',
      status: 'REVIEW',
    },
  ];

  for (const post of posts) {
    const slug = slugify(post.title, { lower: true, strict: true });
    await prisma.blog.upsert({
      where: { slug },
      update: {},
      create: {
        title: post.title,
        slug,
        excerpt: post.excerpt,
        content: post.content,
        featuredImage: post.image,
        status: post.status as any,
        authorId: writers[post.authorIdx].id,
        publishedAt: post.status === 'PUBLISHED' ? new Date() : null,
        seoTitle: `${post.title} | Ziko Insights`,
        seoDescription: post.excerpt,
      },
    });
    console.log(`📝 Blog Created: ${post.title} (${post.status})`);
  }

  console.log('✨ Seeding Protocol Complete. Grid Synchronized.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
