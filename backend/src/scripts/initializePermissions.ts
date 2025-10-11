import { prisma } from '../config/database';
import { PermissionService } from '../services/permissionService';

async function initializePermissions() {
  try {
    console.log('🚀 Initializing permissions and roles...');
    
    // Initialize all permissions and role permissions
    await PermissionService.initializePermissions();
    
    console.log('✅ Permissions and roles initialized successfully!');
    
    // Create a super admin user if none exists
    const superAdminExists = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });
    
    if (!superAdminExists) {
      console.log('🔧 Creating default super admin user...');
      
      // Create a default super admin (you should change these credentials)
      const superAdmin = await prisma.user.create({
        data: {
          walletAddress: '0x0000000000000000000000000000000000000000', // Placeholder
          email: 'admin@nexafund.com',
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          isVerified: true
        }
      });
      
      console.log(`✅ Super admin created with ID: ${superAdmin.id}`);
      console.log('⚠️  Please update the wallet address and credentials for the super admin user');
    } else {
      console.log('ℹ️  Super admin user already exists');
    }
    
    console.log('🎉 Initialization complete!');
    
  } catch (error) {
    console.error('❌ Error initializing permissions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializePermissions(); 