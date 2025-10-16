import prisma from '../config/database';

interface MilestoneUpdate {
  title: string;
  amount: number;
  description: string;
  proofRequirements: string;
}

interface CampaignUpdate {
  campaignId: string;
  title: string;
  newGoal: number;
  milestones: MilestoneUpdate[];
}

async function updateCampaigns() {
  try {
    console.log('🔄 Starting campaign updates...\n');

    const updates: CampaignUpdate[] = [
      {
        campaignId: 'cmgmu1opi0024rda437cp2i2j',
        title: 'CodeFuture: Free Coding Bootcamp',
        newGoal: 250,
        milestones: [
          {
            title: 'Course Materials & Platform Setup',
            amount: 80,
            description: 'Purchase learning resources, set up online platform, create curriculum structure',
            proofRequirements: 'Screenshots of: (1) Platform dashboard showing course modules, (2) Receipt for learning platform subscription, (3) Curriculum outline document with 10+ lesson topics, (4) Testing environment setup'
          },
          {
            title: 'Student Recruitment & Onboarding',
            amount: 100,
            description: 'Marketing campaign for student applications, conduct interviews, select first cohort of 5 students',
            proofRequirements: 'Evidence of: (1) Social media posts/flyers for recruitment (3+ platforms), (2) Application form responses (minimum 5 submissions), (3) Interview notes/selection criteria, (4) Welcome emails sent to accepted students'
          },
          {
            title: 'First Month Operations & Support',
            amount: 70,
            description: 'Instructor time for teaching, student mentorship, progress tracking, and basic administrative costs',
            proofRequirements: 'Documentation of: (1) Weekly lesson attendance records, (2) Student progress reports showing completed assignments, (3) Mentor session notes (minimum 2 per student), (4) Mid-month survey results from students'
          }
        ]
      },
      {
        campaignId: 'cmgmu1mxf001vrda4qvtiwof2',
        title: 'SolarNeighborhood: Free Solar for Low-Income Homes',
        newGoal: 280,
        milestones: [
          {
            title: 'Family Selection & Site Assessment',
            amount: 80,
            description: 'Identify 2 qualifying families, conduct energy audits, assess roof conditions',
            proofRequirements: 'Documents: (1) Signed family consent forms (2 families), (2) Energy audit reports with current usage data, (3) Photos of roof conditions from 4 angles per home, (4) Structural assessment confirming installation feasibility'
          },
          {
            title: 'Equipment Purchase & Permits',
            amount: 120,
            description: 'Purchase 2 small solar panel kits (300W each), obtain installation permits, insurance',
            proofRequirements: 'Receipts for: (1) Solar panel equipment purchase (itemized list), (2) Permit applications submitted to local authority, (3) Insurance policy documentation, (4) Photos of delivered equipment still in packaging'
          },
          {
            title: 'Installation & Training',
            amount: 80,
            description: 'Professional installation on 2 homes, system testing, teach families basic maintenance',
            proofRequirements: 'Evidence of: (1) Before/after installation photos (4+ angles each home), (2) System testing results showing power generation, (3) Video of family training session (2-3 minutes), (4) Signed completion certificates from both families'
          }
        ]
      },
      {
        campaignId: 'cmgmu1jq0001jrda41alhy2px',
        title: 'GreenSpace: Neighborhood Community Garden',
        newGoal: 200,
        milestones: [
          {
            title: 'Site Preparation & Soil Work',
            amount: 60,
            description: 'Clear 500 sq ft area, soil testing, amendment with compost and nutrients',
            proofRequirements: 'Photos of: (1) Before clearing - overgrown area, (2) After clearing - measured and marked plot, (3) Soil test results from local extension office, (4) Delivery receipt for compost/amendments (minimum 5 bags), (5) Photos showing soil mixing'
          },
          {
            title: 'Infrastructure & Raised Beds',
            amount: 90,
            description: 'Build 4 raised garden beds (4x8 ft each), install basic fencing, set up water access',
            proofRequirements: 'Documentation of: (1) Receipts for lumber, soil, and fencing materials, (2) Photos of bed construction progress (3 stages), (3) Completed beds filled with soil, (4) Fencing installation, (5) Water source setup (hose connection or rain barrels)'
          },
          {
            title: 'Planting & Community Launch',
            amount: 50,
            description: 'Purchase seeds/seedlings, community planting day, install signage and tool storage',
            proofRequirements: 'Evidence of: (1) Receipts for seeds/plants (minimum 8 varieties), (2) Photos of community planting day (10+ people), (3) Installed garden sign with project name, (4) Tool storage box/shed, (5) Garden plot assignment sheet signed by 4+ families'
          }
        ]
      },
      {
        campaignId: 'cmgmu1hra001arda415xwfg86',
        title: 'NourishHub: Community Food Bank Expansion',
        newGoal: 270,
        milestones: [
          {
            title: 'Space Acquisition & Basic Setup',
            amount: 100,
            description: 'Secure warehouse space (first month rent + deposit), basic cleaning and safety setup',
            proofRequirements: 'Documents: (1) Signed lease agreement with landlord, (2) Proof of first month rent payment, (3) Before/after photos of space cleaning, (4) Fire extinguisher and first aid kit installation photos, (5) Utility connection receipts'
          },
          {
            title: 'Storage Equipment & Organization',
            amount: 90,
            description: 'Purchase industrial shelving units, sorting bins, basic refrigeration unit',
            proofRequirements: 'Receipts and photos of: (1) Shelving purchase and assembly (4+ units), (2) Refrigerator/cooler unit installed and running, (3) Organization bins and labeling system, (4) Floor plan diagram showing storage zones, (5) Temperature monitoring system'
          },
          {
            title: 'Initial Inventory & Soft Launch',
            amount: 80,
            description: 'Purchase first month food supplies, coordinate with 3 food donors, serve first 20 families',
            proofRequirements: 'Evidence of: (1) Food purchase receipts showing variety (10+ items), (2) Partnership agreements with 3 donors (grocery stores, farms, etc.), (3) Photos of stocked shelves, (4) Distribution log showing 20 families served with signatures'
          }
        ]
      },
      {
        campaignId: 'cmgmu1fyk0011rda4c5qrmecm',
        title: 'Digital Renaissance: Virtual Art Gallery',
        newGoal: 240,
        milestones: [
          {
            title: 'Platform Development & Design',
            amount: 90,
            description: 'Build virtual gallery website, design 3D exhibition space, set up user navigation',
            proofRequirements: 'Screenshots of: (1) Website homepage (desktop and mobile), (2) 3D gallery space from 3 angles, (3) Navigation menu and user interface, (4) Working artwork upload system, (5) Link to live staging site for testing'
          },
          {
            title: 'Artist Recruitment & Content Creation',
            amount: 80,
            description: 'Commission 10 digital artists, curate 30 artworks, create artist profile pages',
            proofRequirements: 'Documentation of: (1) Signed agreements with 10 artists, (2) Portfolio of 30 curated artworks (thumbnails), (3) Artist profile pages with bios, (4) Payment receipts to artists, (5) Artist testimonial quotes (minimum 3)'
          },
          {
            title: 'Launch Event & Marketing',
            amount: 70,
            description: 'Virtual opening event, social media campaign, press release, first month hosting',
            proofRequirements: 'Evidence of: (1) Event recording or live stream link (minimum 30 minutes), (2) Social media posts across 3+ platforms with engagement metrics, (3) Press release published on 2+ outlets, (4) Visitor analytics showing 100+ unique visits'
          }
        ]
      },
      {
        campaignId: 'cmgmu1e6i000srda4c0b9aogb',
        title: 'Echoes of Tomorrow: Independent Sci-Fi Film',
        newGoal: 290,
        milestones: [
          {
            title: 'Script Finalization & Pre-Production',
            amount: 90,
            description: 'Complete final draft screenplay, storyboard key scenes, cast 4 main roles, scout 3 locations',
            proofRequirements: 'Submissions: (1) Final screenplay PDF (minimum 15 pages), (2) Storyboards for 5 key scenes, (3) Signed actor agreements (4 cast members with headshots), (4) Location photos with permission letters from property owners'
          },
          {
            title: 'Principal Filming (3-Day Shoot)',
            amount: 120,
            description: 'Shoot core scenes over 3 days, equipment rental (camera, lighting, audio), crew meals',
            proofRequirements: 'Production evidence: (1) Daily call sheets for all 3 shoot days, (2) Behind-the-scenes photos (minimum 15), (3) Raw footage screenshot samples (5 different scenes), (4) Equipment rental receipts, (5) Crew sign-in sheets'
          },
          {
            title: 'Post-Production & Release',
            amount: 80,
            description: 'Video editing, color grading, sound design, final render, submit to 2 film festivals',
            proofRequirements: 'Deliverables: (1) Link to final film (15-20 minute runtime), (2) Festival submission confirmations (2 festivals), (3) Behind-the-scenes editing screenshots, (4) Credits sequence, (5) Movie poster design'
          }
        ]
      },
      {
        campaignId: 'cmgmu1cef000jrda44rpm9c8w',
        title: 'DevFlow: Open Source Developer Toolkit',
        newGoal: 220,
        milestones: [
          {
            title: 'Core Feature Development',
            amount: 80,
            description: 'Build 5 core tools (code formatter, linter, debugger helper, snippet manager, docs generator)',
            proofRequirements: 'Technical proof: (1) GitHub repository link with 5+ committed features, (2) README.md with feature documentation, (3) Screenshots of each tool working, (4) Unit test coverage report (minimum 60%), (5) Demo video (3-5 minutes)'
          },
          {
            title: 'Beta Testing & Bug Fixes',
            amount: 70,
            description: 'Release beta version, recruit 15 testers, fix critical bugs, improve performance',
            proofRequirements: 'Evidence of: (1) Beta release notes with version number, (2) List of 15 beta testers with emails/GitHub handles, (3) Bug tracking board showing 20+ issues addressed, (4) Performance benchmarks (before/after), (5) Tester feedback compilation'
          },
          {
            title: 'Public Launch & Documentation',
            amount: 70,
            description: 'Complete documentation, create tutorial videos, publish to package registry, marketing push',
            proofRequirements: 'Launch materials: (1) Complete documentation site link, (2) Tutorial video series (3+ videos), (3) Package registry listing (npm/PyPI), (4) Download/install statistics (first 100 installs), (5) Social media announcement posts'
          }
        ]
      },
      {
        campaignId: 'cmgmu1alx000arda4n6fwerau',
        title: 'LearnAI: Personalized Learning Platform',
        newGoal: 260,
        milestones: [
          {
            title: 'Platform MVP Development',
            amount: 100,
            description: 'Build core learning platform with user accounts, 3 course modules, quiz system',
            proofRequirements: 'Technical deliverables: (1) Live platform link with demo account, (2) Screenshots of user dashboard, course pages, and quiz interface, (3) Database schema documentation, (4) Video walkthrough (5 minutes), (5) GitHub commits log'
          },
          {
            title: 'AI Integration & Content Creation',
            amount: 90,
            description: 'Integrate basic AI recommendation system, create 20 lessons across 3 subjects, student progress tracking',
            proofRequirements: 'Evidence of: (1) AI recommendation algorithm documentation, (2) Content library with 20 lessons (screenshots of 5), (3) Progress tracking dashboard demo, (4) AI testing results with 10 sample queries, (5) Content quality review checklist'
          },
          {
            title: 'Beta Launch with Real Students',
            amount: 70,
            description: 'Recruit 10 students for pilot program, collect feedback, make improvements, measure learning outcomes',
            proofRequirements: 'Program results: (1) Student enrollment forms (10 students), (2) Usage analytics (login frequency, time spent), (3) Feedback survey results (minimum 8 responses), (4) Before/after assessment scores, (5) Student testimonials (3+)'
          }
        ]
      },
      {
        campaignId: 'cmgmu17pp0001rda4hxb7t6tj',
        title: 'SmartGuard: Next-Gen Home Security System',
        newGoal: 230,
        milestones: [
          {
            title: 'Prototype Development & Testing',
            amount: 80,
            description: 'Build working prototype with motion sensors, camera module, mobile app connection',
            proofRequirements: 'Technical evidence: (1) Photos of assembled prototype from 4 angles, (2) Circuit diagram and component list, (3) Mobile app screenshots (5+ screens), (4) Video demonstration of motion detection working (2 minutes), (5) Test results log'
          },
          {
            title: 'Manufacturing First Batch',
            amount: 90,
            description: 'Manufacture 5 units with professional PCB fabrication, 3D printed enclosures, quality testing',
            proofRequirements: 'Manufacturing proof: (1) PCB fabrication order receipt, (2) Photos of 5 assembled units, (3) Quality testing checklist (passed/failed for each unit), (4) Packaging photos, (5) Component sourcing receipts'
          },
          {
            title: 'Backer Fulfillment & Setup Support',
            amount: 60,
            description: 'Ship 5 units to backers, provide installation guides, offer remote setup support',
            proofRequirements: 'Fulfillment evidence: (1) Shipping tracking numbers for 5 packages, (2) Installation manual PDF (minimum 10 pages with photos), (3) Support ticket system showing 5+ resolved inquiries, (4) Backer confirmation emails/messages, (5) Working installation photos from 3+ backers'
          }
        ]
      }
    ];

    for (const update of updates) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📦 Updating: ${update.title}`);
      console.log(`   New Goal: $${update.newGoal}\n`);

      // Update campaign goal
      await prisma.campaign.update({
        where: { id: update.campaignId },
        data: {
          targetAmount: update.newGoal
        }
      });
      console.log(`   ✅ Campaign goal updated to $${update.newGoal}`);

      // Get existing milestones
      const existingMilestones = await prisma.milestone.findMany({
        where: { campaignId: update.campaignId },
        orderBy: { order: 'asc' }
      });

      // Update each milestone
      for (let i = 0; i < update.milestones.length; i++) {
        const milestoneData = update.milestones[i];
        const existingMilestone = existingMilestones[i];

        if (existingMilestone) {
          await prisma.milestone.update({
            where: { id: existingMilestone.id },
            data: {
              title: milestoneData.title,
              amount: milestoneData.amount,
              description: milestoneData.description,
              proofRequirements: milestoneData.proofRequirements
            }
          });
          console.log(`   ✅ Milestone ${i + 1}: ${milestoneData.title} ($${milestoneData.amount})`);
        }
      }

      console.log(`   ✅ All milestones updated for ${update.title}`);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('\n✅ All campaigns updated successfully!\n');

  } catch (error) {
    console.error('❌ Error updating campaigns:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateCampaigns();
