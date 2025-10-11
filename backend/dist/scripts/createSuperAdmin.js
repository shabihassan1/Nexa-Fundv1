"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function createSuperAdmin() {
    try {
        console.log('🔧 Creating Super Admin user...');
        const email = 'admin@nexafund.com';
        const password = 'admin123'; // Change this to a secure password
        const name = 'Super Admin';
        // Check if user already exists
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            console.log('⚠️  User already exists. Updating password and role...');
            // Hash the password
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            // Update existing user
            const updatedUser = await database_1.prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    role: 'SUPER_ADMIN',
                    status: 'ACTIVE',
                    isVerified: true,
                    name
                }
            });
            console.log(`✅ Super admin updated with ID: ${updatedUser.id}`);
        }
        else {
            // Hash the password
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            // Create new super admin
            const superAdmin = await database_1.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    walletAddress: `temp-${Date.now()}`, // Temporary wallet address
                    role: 'SUPER_ADMIN',
                    status: 'ACTIVE',
                    isVerified: true
                }
            });
            console.log(`✅ Super admin created with ID: ${superAdmin.id}`);
        }
        console.log('📋 Super Admin Credentials:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log('⚠️  Please change the password after first login!');
    }
    catch (error) {
        console.error('❌ Error creating super admin:', error);
    }
    finally {
        await database_1.prisma.$disconnect();
    }
}
// Run the script
createSuperAdmin();
//# sourceMappingURL=createSuperAdmin.js.map