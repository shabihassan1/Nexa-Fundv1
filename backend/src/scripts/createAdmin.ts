import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  try {
    console.log('🔧 Creating Admin user...');
    
    const email = 'admin2@nexafund.com';
    const password = 'admin456'; // Change this to a secure password
    const name = 'Regular Admin';
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log('⚠️  User already exists. Updating password and role...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          isVerified: true,
          name
        }
      });
      
      console.log(`✅ Admin updated with ID: ${updatedUser.id}`);
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create new admin
      const admin = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          walletAddress: `temp-admin-${Date.now()}`, // Temporary wallet address
          role: 'ADMIN',
          status: 'ACTIVE',
          isVerified: true
        }
      });
      
      console.log(`✅ Admin created with ID: ${admin.id}`);
    }
    
    console.log('📋 Admin Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('⚠️  Please change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdmin(); 