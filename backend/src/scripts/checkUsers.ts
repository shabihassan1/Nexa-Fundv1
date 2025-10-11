import { prisma } from '../config/database';

async function checkUsers() {
  try {
    console.log('🔍 Checking database users...\n');
    
    const users = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        name: true,
        status: true
      },
      orderBy: {
        role: 'asc'
      }
    });
    
    console.log(`📊 Total users in database: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found in database!');
      console.log('💡 Run: npm run db:seed\n');
    } else {
      console.log('Users by role:');
      users.forEach(user => {
        const email = user.email || 'no-email';
        const name = user.name || 'no-name';
        console.log(`   ${user.role.padEnd(15)} - ${email.padEnd(35)} - ${name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
