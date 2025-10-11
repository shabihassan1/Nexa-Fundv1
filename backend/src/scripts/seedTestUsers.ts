import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

/**
 * Seed Test Users for Development/Testing
 * 
 * ⚠️ TESTING PHASE DISCLAIMER:
 * This project is currently in the TESTING phase.
 * - No real money is involved
 * - All transactions are simulated
 * - Test data may be reset periodically
 * - Do not use real financial information
 */

interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'CREATOR' | 'BACKER' | 'USER';
  bio?: string;
}

const TEST_USERS: TestUser[] = [
  // Platform Administrators
  {
    email: 'superadmin@nexafund.com',
    password: 'Test@123',
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    bio: 'Platform owner with full system access'
  },
  {
    email: 'admin@nexafund.com',
    password: 'Test@123',
    name: 'Admin User',
    role: 'ADMIN',
    bio: 'Platform administrator'
  },
  {
    email: 'moderator@nexafund.com',
    password: 'Test@123',
    name: 'Content Moderator',
    role: 'MODERATOR',
    bio: 'Content moderation and review'
  },
  
  // Campaign Creators
  {
    email: 'creator1@nexafund.com',
    password: 'Test@123',
    name: 'Alice Johnson',
    role: 'CREATOR',
    bio: 'Tech entrepreneur passionate about innovative solutions'
  },
  {
    email: 'creator2@nexafund.com',
    password: 'Test@123',
    name: 'Bob Smith',
    role: 'CREATOR',
    bio: 'Environmental activist creating sustainable projects'
  },
  {
    email: 'creator3@nexafund.com',
    password: 'Test@123',
    name: 'Carol Martinez',
    role: 'CREATOR',
    bio: 'Artist and creative director'
  },
  
  // Backers (Campaign Supporters)
  {
    email: 'backer1@nexafund.com',
    password: 'Test@123',
    name: 'David Lee',
    role: 'BACKER',
    bio: 'Early adopter and tech enthusiast'
  },
  {
    email: 'backer2@nexafund.com',
    password: 'Test@123',
    name: 'Emma Wilson',
    role: 'BACKER',
    bio: 'Supporting innovative projects'
  },
  {
    email: 'backer3@nexafund.com',
    password: 'Test@123',
    name: 'Frank Thompson',
    role: 'BACKER',
    bio: 'Investor in community projects'
  },
  
  // Regular Users
  {
    email: 'user1@nexafund.com',
    password: 'Test@123',
    name: 'Grace Chen',
    role: 'USER',
    bio: 'Exploring crowdfunding opportunities'
  },
  {
    email: 'user2@nexafund.com',
    password: 'Test@123',
    name: 'Henry Davis',
    role: 'USER',
    bio: 'New to the platform'
  },
  {
    email: 'user3@nexafund.com',
    password: 'Test@123',
    name: 'Iris Taylor',
    role: 'USER',
    bio: 'Interested in supporting local initiatives'
  }
];

async function seedTestUsers() {
  try {
    console.log('🌱 Seeding Test Users for NexaFund...\n');
    console.log('⚠️  TESTING PHASE: No real money involved');
    console.log('⚠️  All accounts are for testing purposes only\n');
    
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const user of TEST_USERS) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });

        // Hash the password
        const hashedPassword = await bcrypt.hash(user.password, 10);

        if (existingUser) {
          // Update existing user
          await prisma.user.update({
            where: { email: user.email },
            data: {
              password: hashedPassword,
              name: user.name,
              role: user.role,
              status: 'ACTIVE',
              isVerified: true,
              bio: user.bio || null
            }
          });
          console.log(`✏️  Updated: ${user.name} (${user.role}) - ${user.email}`);
          updated++;
        } else {
          // Create new user
          await prisma.user.create({
            data: {
              email: user.email,
              password: hashedPassword,
              name: user.name,
              walletAddress: `test-wallet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              role: user.role,
              status: 'ACTIVE',
              isVerified: true,
              bio: user.bio || null
            }
          });
          console.log(`✅ Created: ${user.name} (${user.role}) - ${user.email}`);
          created++;
        }
      } catch (error) {
        console.log(`⚠️  Skipped: ${user.email} - ${error instanceof Error ? error.message : 'Unknown error'}`);
        skipped++;
      }
    }

    console.log('\n📊 Seed Summary:');
    console.log(`   ✅ Created: ${created} users`);
    console.log(`   ✏️  Updated: ${updated} users`);
    console.log(`   ⚠️  Skipped: ${skipped} users`);
    console.log(`   📝 Total: ${TEST_USERS.length} users processed`);
    
    console.log('\n🔑 All Test Accounts Use Password: Test@123');
    console.log('\n📋 Test Accounts by Role:');
    console.log('   SUPER_ADMIN: superadmin@nexafund.com');
    console.log('   ADMIN:       admin@nexafund.com');
    console.log('   MODERATOR:   moderator@nexafund.com');
    console.log('   CREATORS:    creator1@nexafund.com, creator2@nexafund.com, creator3@nexafund.com');
    console.log('   BACKERS:     backer1@nexafund.com, backer2@nexafund.com, backer3@nexafund.com');
    console.log('   USERS:       user1@nexafund.com, user2@nexafund.com, user3@nexafund.com');
    
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('   • This is a TESTING environment');
    console.log('   • No real money or transactions');
    console.log('   • Change passwords in production');
    console.log('   • Test data may be reset periodically');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
seedTestUsers()
  .then(() => {
    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });
