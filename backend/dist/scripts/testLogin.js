"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("../config/env");
async function main() {
    try {
        // Load environment variables
        console.log('Environment loaded:', !!env_1.config.jwtSecret);
        // Get a user from the database
        const email = 'm@gmail.com'; // Use the email that works
        console.log(`Looking for user with email: ${email}`);
        const user = await database_1.prisma.user.findUnique({
            where: { email }
        });
        console.log('User found:', user ? 'Yes' : 'No');
        if (!user) {
            console.log('User not found in database');
            return;
        }
        console.log('User details:', {
            id: user.id,
            email: user.email,
            name: user.name,
            hasPassword: !!user.password,
            walletAddress: user.walletAddress
        });
        // Test password comparison with the correct password
        const testPassword = '123456789'; // The correct password
        if (user.password) {
            const isPasswordValid = await bcryptjs_1.default.compare(testPassword, user.password);
            console.log('Password valid:', isPasswordValid ? 'Yes' : 'No');
            if (!isPasswordValid) {
                console.log('Password comparison failed. This could be because:');
                console.log('1. The password is incorrect');
                console.log('2. The password in the database was not hashed correctly');
                console.log('3. The bcrypt comparison is not working properly');
            }
        }
        else {
            console.log('No password set for this user');
        }
        console.log('Test completed');
    }
    catch (error) {
        console.error('Error during test:', error);
    }
    finally {
        await database_1.prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=testLogin.js.map