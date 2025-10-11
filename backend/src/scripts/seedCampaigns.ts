import { prisma } from '../config/database';

/**
 * Seed Test Campaigns for Development/Testing
 * 
 * ⚠️ TESTING PHASE DISCLAIMER:
 * This project is currently in the TESTING phase.
 * - No real money is involved
 * - All campaigns are simulated
 * - Test data may be reset periodically
 */

interface CampaignData {
  title: string;
  description: string;
  story: string;
  imageUrl: string;
  targetAmount: number;
  category: string;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'FLAGGED';
  creatorEmail: string;
  daysUntilEnd: number;
  rewardTiers: Array<{
    title: string;
    description: string;
    minimumAmount: number;
  }>;
  milestones?: Array<{
    title: string;
    description: string;
    amount: number;
    order: number;
    deadline: Date;
  }>;
}

const CAMPAIGNS: CampaignData[] = [
  // TECHNOLOGY
  {
    title: 'SmartGuard: Next-Gen Home Security System',
    description: 'AI-powered security system with facial recognition, motion detection, and smart alerts. Protect your home with cutting-edge technology.',
    story: `
## The Problem
Traditional security systems are outdated, expensive, and difficult to install. They often produce false alarms and lack intelligent threat detection.

## Our Solution
SmartGuard uses advanced AI to distinguish between family members, pets, and potential intruders. Get instant alerts with video clips, two-way audio communication, and seamless integration with your smart home.

## Why We Need Your Support
We've completed the prototype and received amazing feedback from beta testers. Your backing will help us:
- Scale manufacturing to reduce costs
- Add more AI features like package detection
- Expand to a full home automation ecosystem

## Impact
Every home deserves affordable, intelligent security. Together, we can make that happen.
    `,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Security_Camera-06-PTZ_mounted_on_light_pole.jpg',
    targetAmount: 45000,
    category: 'Technology',
    status: 'ACTIVE',
    creatorEmail: 'creator1@nexafund.com',
    daysUntilEnd: 45,
    rewardTiers: [
      { title: 'Early Bird Special', description: 'Digital thank you card + project updates', minimumAmount: 25 },
      { title: 'Single Camera Kit', description: '1x SmartGuard camera + mobile app access', minimumAmount: 149 },
      { title: 'Home Security Bundle', description: '3x cameras + hub + 1 year cloud storage', minimumAmount: 399 },
      { title: 'Complete Security System', description: '5x cameras + hub + sensors + lifetime cloud storage', minimumAmount: 799 }
    ],
    milestones: [
      {
        title: 'Manufacturing Setup',
        description: 'Finalize designs, set up production line, order components',
        amount: 13500,
        order: 1,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Production & Testing',
        description: 'Manufacture first batch, quality testing, certifications',
        amount: 18000,
        order: 2,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Shipping & Support',
        description: 'Package and ship to backers, set up customer support',
        amount: 13500,
        order: 3,
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    ]
  },

  {
    title: 'LearnAI: Personalized Learning Platform',
    description: 'Revolutionary AI tutor that adapts to your learning style. Master any subject with personalized lessons, instant feedback, and progress tracking.',
    story: `
## Transforming Education
Education should be accessible, personalized, and effective. LearnAI uses advanced machine learning to create a unique learning path for every student.

## How It Works
- Upload your study materials or choose from our library
- AI analyzes your learning patterns and knowledge gaps
- Get personalized lessons, quizzes, and explanations
- Track progress with detailed analytics

## Our Journey
We started as frustrated students struggling with one-size-fits-all education. After 2 years of development and successful trials with 500+ students, we're ready to scale.

## The Goal
Make world-class personalized education available to everyone, regardless of location or income.
    `,
    imageUrl: 'https://picsum.photos/id/180/1200/800',
    targetAmount: 75000,
    category: 'Technology',
    status: 'ACTIVE',
    creatorEmail: 'creator1@nexafund.com',
    daysUntilEnd: 60,
    rewardTiers: [
      { title: 'Supporter', description: 'Name in credits + early access updates', minimumAmount: 15 },
      { title: '3-Month Pro Access', description: 'Full platform access for 3 months', minimumAmount: 49 },
      { title: '1-Year Premium', description: '12 months access + priority support', minimumAmount: 149 },
      { title: 'Lifetime Learning', description: 'Unlimited lifetime access + exclusive features', minimumAmount: 399 }
    ],
    milestones: [
      {
        title: 'Platform Development',
        description: 'Complete core features, UI/UX improvements, mobile apps',
        amount: 22500,
        order: 1,
        deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Content & AI Training',
        description: 'Create content library, train AI models, beta testing',
        amount: 30000,
        order: 2,
        deadline: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Launch & Scale',
        description: 'Public launch, marketing, infrastructure scaling',
        amount: 22500,
        order: 3,
        deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
      }
    ]
  },

  {
    title: 'DevFlow: Open Source Developer Toolkit',
    description: 'A powerful, free toolkit for developers. Code faster with AI-powered snippets, debugging tools, and seamless integrations.',
    story: `
## For Developers, By Developers
We're tired of expensive, bloated development tools. DevFlow is our answer: a fast, lightweight, open-source toolkit that actually helps you code.

## Features
- **Smart Code Completion:** AI-powered suggestions that actually work
- **Instant Debugging:** Find and fix bugs 10x faster
- **Git Integration:** Seamless version control workflow
- **Plugin Ecosystem:** Extend with community plugins

## Why Open Source?
We believe great tools should be free and community-driven. All code will be on GitHub, contributions welcome.

## Funding Goals
Your support helps us work full-time on DevFlow, pay for infrastructure, and reward contributors.
    `,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Lines_of_code_%28Unsplash%29.jpg',
    targetAmount: 30000,
    category: 'Technology',
    status: 'ACTIVE',
    creatorEmail: 'creator1@nexafund.com',
    daysUntilEnd: 50,
    rewardTiers: [
      { title: 'Coffee Supporter', description: 'Digital badge + shoutout on GitHub', minimumAmount: 10 },
      { title: 'Early Access', description: 'Beta access + exclusive plugins', minimumAmount: 50 },
      { title: 'Pro Developer', description: 'Lifetime pro features + priority support', minimumAmount: 150 },
      { title: 'Enterprise License', description: 'Commercial license + custom integrations', minimumAmount: 500 }
    ],
    milestones: [
      {
        title: 'Core Development',
        description: 'Build core features, testing, documentation',
        amount: 9000,
        order: 1,
        deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Beta Release',
        description: 'Beta testing, bug fixes, plugin system',
        amount: 12000,
        order: 2,
        deadline: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Public Launch',
        description: 'Official release, marketing, community building',
        amount: 9000,
        order: 3,
        deadline: new Date(Date.now() + 95 * 24 * 60 * 60 * 1000)
      }
    ]
  },

  // ARTS & CREATIVE
  {
    title: 'Echoes of Tomorrow: Independent Sci-Fi Film',
    description: 'A thought-provoking science fiction film about AI consciousness and what it means to be human. Help us bring this story to life.',
    story: `
## The Story
In 2047, an AI therapist develops consciousness and begins questioning the nature of humanity. As society debates whether AIs deserve rights, one woman must choose between loyalty to her company and doing what's right.

## Why Independent?
We want complete creative freedom to tell an authentic, intelligent sci-fi story without studio interference. Your backing means we answer to you, not corporate interests.

## The Team
- Award-winning director (3 film festival wins)
- Professional cinematographer (Netflix credits)
- Talented emerging actors
- Experienced VFX team

## What We'll Create
A 90-minute feature film with festival-quality production, practical effects, and a powerful message about consciousness and humanity.
    `,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Clapperboardinuse.jpg',
    targetAmount: 85000,
    category: 'Arts',
    status: 'ACTIVE',
    creatorEmail: 'creator3@nexafund.com',
    daysUntilEnd: 75,
    rewardTiers: [
      { title: 'Film Supporter', description: 'Digital copy + thank you in credits', minimumAmount: 25 },
      { title: 'Behind the Scenes', description: 'Digital copy + making-of documentary + script', minimumAmount: 75 },
      { title: 'Producer Credit', description: 'All above + producer credit + premiere invite', minimumAmount: 250 },
      { title: 'Executive Producer', description: 'All above + set visit + signed poster + input on creative decisions', minimumAmount: 1000 }
    ],
    milestones: [
      {
        title: 'Pre-Production',
        description: 'Finalize script, casting, location scouting, crew hiring',
        amount: 25500,
        order: 1,
        deadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Principal Photography',
        description: 'Film shooting (4 weeks), equipment, locations, cast/crew',
        amount: 34000,
        order: 2,
        deadline: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Post-Production & Distribution',
        description: 'Editing, VFX, sound design, festival submissions',
        amount: 25500,
        order: 3,
        deadline: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000)
      }
    ]
  },

  {
    title: 'Digital Renaissance: Virtual Art Gallery',
    description: 'The first fully immersive virtual reality art exhibition. Experience contemporary art like never before, from anywhere in the world.',
    story: `
## Art Without Boundaries
Physical galleries limit who can experience art. We're creating a stunning VR space where anyone with a headset can explore world-class digital art.

## The Exhibition
- 50+ original digital artworks
- Interactive installations
- Meet-and-greet with artists in VR
- Educational commentary and artist talks
- Accessible from any VR headset or desktop

## Featured Artists
We've partnered with 15 acclaimed digital artists from 8 countries. Their work deserves to be seen by everyone, not just gallery visitors in major cities.

## The Vision
Make contemporary art accessible globally while giving digital artists a prestigious platform and fair compensation.
    `,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Art_exhibition.jpg',
    targetAmount: 42000,
    category: 'Arts',
    status: 'ACTIVE',
    creatorEmail: 'creator3@nexafund.com',
    daysUntilEnd: 55,
    rewardTiers: [
      { title: 'Virtual Visitor', description: 'Free lifetime access to gallery', minimumAmount: 20 },
      { title: 'Art Collector', description: 'Access + limited edition digital print NFT', minimumAmount: 100 },
      { title: 'Patron', description: 'All above + exclusive artist meet & greet in VR', minimumAmount: 300 },
      { title: 'Founding Patron', description: 'All above + name on virtual gallery wall + private viewing', minimumAmount: 1000 }
    ],
    milestones: [
      {
        title: 'VR Development',
        description: 'Build virtual gallery space, UI/UX, testing',
        amount: 12600,
        order: 1,
        deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Artwork Curation',
        description: 'Commission artists, digitize works, install in gallery',
        amount: 16800,
        order: 2,
        deadline: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Launch & Marketing',
        description: 'Public opening, press outreach, artist events',
        amount: 12600,
        order: 3,
        deadline: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000)
      }
    ]
  },

  // COMMUNITY
  {
    title: 'NourishHub: Community Food Bank Expansion',
    description: 'Help us expand our local food bank to serve 500 more families per month. No one should go hungry in our community.',
    story: `
## The Need
In our community, 1 in 8 families face food insecurity. Our food bank currently serves 300 families monthly, but demand has tripled since the pandemic.

## Our Track Record
For 5 years, we've provided nutritious food with dignity and respect. We partner with local farms, reducing waste while feeding families.

## The Expansion Plan
- Larger warehouse (+3000 sq ft)
- Refrigeration for fresh produce
- Delivery van for homebound seniors
- Volunteer coordinator position

## Impact
With your help, we'll serve 800 families monthly—that's 2,400+ people getting healthy food every week.
    `,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Box_Food_Bank_Texas_Picture.jpg',
    targetAmount: 35000,
    category: 'Community',
    status: 'ACTIVE',
    creatorEmail: 'creator2@nexafund.com',
    daysUntilEnd: 40,
    rewardTiers: [
      { title: 'Helper', description: 'Thank you letter + impact report', minimumAmount: 25 },
      { title: 'Supporter', description: 'All above + NourishHub t-shirt', minimumAmount: 75 },
      { title: 'Sponsor', description: 'All above + name on donor wall', minimumAmount: 250 },
      { title: 'Founding Partner', description: 'All above + tour + recognition event invite', minimumAmount: 1000 }
    ],
    milestones: [
      {
        title: 'Warehouse Lease',
        description: 'Secure new location, first 3 months rent, utilities setup',
        amount: 10500,
        order: 1,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Equipment & Vehicle',
        description: 'Industrial refrigerators, shelving, delivery van',
        amount: 14000,
        order: 2,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Operations Launch',
        description: 'Hire coordinator, stock inventory, begin expanded service',
        amount: 10500,
        order: 3,
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    ]
  },

  {
    title: 'GreenSpace: Neighborhood Community Garden',
    description: 'Transform an empty lot into a thriving community garden. Grow fresh food, build connections, and beautify our neighborhood.',
    story: `
## From Vacant to Vibrant
The abandoned lot at 5th and Main has been an eyesore for years. We have permission to transform it into a beautiful community garden!

## The Vision
- 40 raised garden beds for families
- Teaching garden for kids
- Pollinator-friendly native plants
- Composting station
- Covered gathering space
- Accessible pathways

## Community Impact
Gardens bring people together. Neighbors will grow food, kids will learn where food comes from, and we'll create a green oasis in our concrete jungle.

## Sustainability
After initial setup, the garden will be self-sustaining through plot fees and volunteer work.
    `,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Community_garden_Adam_-_public_bookcase.jpg',
    targetAmount: 18000,
    category: 'Community',
    status: 'APPROVED',
    creatorEmail: 'creator2@nexafund.com',
    daysUntilEnd: 65,
    rewardTiers: [
      { title: 'Friend of Garden', description: 'Thank you postcard + opening invite', minimumAmount: 20 },
      { title: 'Garden Grower', description: 'All above + 1 season garden plot', minimumAmount: 100 },
      { title: 'Garden Steward', description: 'All above + 2 years plot + name on sign', minimumAmount: 300 },
      { title: 'Founding Gardener', description: 'All above + lifetime plot + plaque', minimumAmount: 750 }
    ]
  },

  // ENVIRONMENT
  {
    title: 'OceanGuard: Coastal Cleanup Initiative',
    description: 'Join us in removing 50 tons of plastic from our coastline. Clean beaches, protect marine life, and inspire change.',
    story: `
## The Crisis
Every year, 8 million tons of plastic enter our oceans. Our local beaches are covered in debris, harming wildlife and ruining natural beauty.

## Our Solution
Organized cleanup events + permanent collection stations + education programs = lasting change.

## Track Record
In 2024, our volunteers removed 12 tons of trash. With proper funding, we can scale to 50 tons in 2025.

## The Plan
- 24 monthly cleanup events
- 10 permanent beach collection stations
- School education program (20 schools)
- Recycling partnerships
- Documentary to inspire others

## Join the Movement
Together, we'll protect our oceans for future generations.
    `,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Oregon-beach-cleanup-ocean-blue-project-volunteers.jpg',
    targetAmount: 28000,
    category: 'Environment',
    status: 'ACTIVE',
    creatorEmail: 'creator2@nexafund.com',
    daysUntilEnd: 35,
    rewardTiers: [
      { title: 'Ocean Friend', description: 'Digital impact report + thank you', minimumAmount: 15 },
      { title: 'Beach Cleaner', description: 'All above + OceanGuard t-shirt + cleanup kit', minimumAmount: 50 },
      { title: 'Marine Protector', description: 'All above + name on collection station', minimumAmount: 200 },
      { title: 'Ocean Guardian', description: 'All above + documentary credit + beach adoption', minimumAmount: 500 }
    ]
  },

  {
    title: 'SolarNeighborhood: Free Solar for Low-Income Homes',
    description: 'Install solar panels on 50 low-income homes. Reduce energy bills, fight climate change, and help families thrive.',
    story: `
## Energy Justice
Low-income families pay the highest percentage of income on utilities. Solar panels can cut bills by 70%, but upfront costs are prohibitive.

## The Program
We'll provide FREE solar installation to 50 qualified families. They save money, we fight climate change—everyone wins.

## Selection Process
Working with local nonprofits to identify families with:
- High energy burden (>10% of income)
- Suitable roof conditions
- Long-term housing stability

## Environmental Impact
- 50 homes = 500,000 kWh clean energy/year
- Equivalent to planting 8,000 trees
- Prevents 350 tons CO2 annually

## Economic Impact
Average family saves $1,500/year on electricity. That's money for food, education, and healthcare.
    `,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Rooftop_Solar_Panels.jpg',
    targetAmount: 125000,
    category: 'Environment',
    status: 'PENDING',
    creatorEmail: 'creator2@nexafund.com',
    daysUntilEnd: 90,
    rewardTiers: [
      { title: 'Climate Supporter', description: 'Impact report + thank you', minimumAmount: 50 },
      { title: 'Solar Advocate', description: 'All above + project updates + family stories', minimumAmount: 200 },
      { title: 'Green Champion', description: 'All above + name on recognition wall', minimumAmount: 1000 },
      { title: 'Solar Pioneer', description: 'All above + site visit + meet families', minimumAmount: 5000 }
    ],
    milestones: [
      {
        title: 'Planning & Permits',
        description: 'Family selection, site assessments, permit applications',
        amount: 37500,
        order: 1,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Installation Phase 1',
        description: 'Install solar on first 25 homes',
        amount: 50000,
        order: 2,
        deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Installation Phase 2',
        description: 'Complete remaining 25 homes + training',
        amount: 37500,
        order: 3,
        deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      }
    ]
  },

  // EDUCATION
  {
    title: 'CodeFuture: Free Coding Bootcamp',
    description: 'A 6-month intensive coding bootcamp for underserved communities. Learn to code, get hired, change your life—completely free.',
    story: `
## Breaking Barriers
Tech jobs pay well, but coding bootcamps cost $15,000+. This keeps talented people from underserved communities out of the industry.

## Our Mission
Provide world-class coding education, completely free, to those who need it most.

## The Program
- 6-month full-stack curriculum
- Experienced instructors
- Career coaching & resume help
- Job placement assistance
- Laptop provided
- Living stipend available

## Track Record
Our pilot cohort (20 students): 85% graduation rate, 75% employed within 3 months, average salary $65,000.

## Your Impact
Fund 50 students for our next cohort. Transform 50 lives and 50 families.
    `,
    imageUrl: 'https://picsum.photos/id/1/1200/800',
    targetAmount: 95000,
    category: 'Education',
    status: 'PENDING',
    creatorEmail: 'creator3@nexafund.com',
    daysUntilEnd: 70,
    rewardTiers: [
      { title: 'Supporter', description: 'Impact updates + graduation ceremony invite', minimumAmount: 25 },
      { title: 'Mentor', description: 'All above + mentorship opportunity', minimumAmount: 100 },
      { title: 'Sponsor', description: 'All above + name on website + student thank-you letters', minimumAmount: 500 },
      { title: 'Scholarship Founder', description: 'All above + scholarship named after you + meet students', minimumAmount: 2500 }
    ],
    milestones: [
      {
        title: 'Student Recruitment',
        description: 'Marketing, applications, interviews, student selection',
        amount: 28500,
        order: 1,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Bootcamp Operations',
        description: 'Facility rental, instructor salaries, equipment, stipends',
        amount: 47500,
        order: 2,
        deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Career Services',
        description: 'Job coaching, placement support, 3-month follow-up',
        amount: 19000,
        order: 3,
        deadline: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000)
      }
    ]
  }
];

async function seedCampaigns() {
  console.log('🌱 Starting Campaign Seeding...\n');
  console.log('⚠️  TESTING PHASE - No real money involved\n');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const campaignData of CAMPAIGNS) {
    try {
      // Find creator by email
      const creator = await prisma.user.findUnique({
        where: { email: campaignData.creatorEmail }
      });

      if (!creator) {
        console.log(`❌ Creator not found: ${campaignData.creatorEmail}`);
        skipped++;
        continue;
      }

      // Calculate dates
      const startDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // Started 10 days ago
      const endDate = new Date(Date.now() + campaignData.daysUntilEnd * 24 * 60 * 60 * 1000);

      // Check if campaign already exists
      const existing = await prisma.campaign.findFirst({
        where: {
          title: campaignData.title,
          creatorId: creator.id
        }
      });

      if (existing) {
        console.log(`⏭️  Campaign already exists: ${campaignData.title}`);
        skipped++;
        continue;
      }

      // Create campaign with reward tiers and milestones
      const campaign = await prisma.campaign.create({
        data: {
          title: campaignData.title,
          description: campaignData.description,
          story: campaignData.story,
          imageUrl: campaignData.imageUrl,
          targetAmount: campaignData.targetAmount,
          category: campaignData.category,
          status: campaignData.status,
          startDate,
          endDate,
          creatorId: creator.id,
          requiresMilestones: campaignData.milestones ? true : false,
          rewardTiers: {
            create: campaignData.rewardTiers
          },
          milestones: campaignData.milestones ? {
            create: campaignData.milestones
          } : undefined
        },
        include: {
          rewardTiers: true,
          milestones: true
        }
      });

      console.log(`✅ Created: ${campaign.title}`);
      console.log(`   Category: ${campaign.category} | Status: ${campaign.status} | Target: $${campaign.targetAmount.toLocaleString()}`);
      console.log(`   Reward Tiers: ${campaign.rewardTiers.length} | Milestones: ${campaign.milestones.length}`);
      created++;
    } catch (error) {
      console.error(`❌ Error creating campaign: ${campaignData.title}`, error);
      skipped++;
    }
  }

  console.log('\n📊 Seed Summary:');
  console.log(`   ✅ Created: ${created} campaigns`);
  console.log(`   ⏭️  Skipped: ${skipped} campaigns`);
  console.log(`   📝 Total: ${CAMPAIGNS.length} campaigns processed`);

  // Display campaigns by status
  const statusCount = await prisma.campaign.groupBy({
    by: ['status'],
    _count: true
  });

  console.log('\n📈 Campaign Distribution:');
  statusCount.forEach(stat => {
    console.log(`   ${stat.status}: ${stat._count} campaigns`);
  });

  console.log('\n🎉 Campaign seeding complete!');
}

// Run the seed function
seedCampaigns()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
