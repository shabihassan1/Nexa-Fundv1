import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import { config } from '../config/env';

async function main() {
  try {
    // Load environment variables
    console.log('Environment loaded:', !!config.jwtSecret);
    
    // Get a user from the database
    const email = 'm@gmail.com'; // Use the email that works
    console.log(`Looking for user with email: ${email}`);
    
    const user = await prisma.user.findUnique({
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
      const isPasswordValid = await bcrypt.compare(testPassword, user.password);
      console.log('Password valid:', isPasswordValid ? 'Yes' : 'No');
      
      if (!isPasswordValid) {
        console.log('Password comparison failed. This could be because:');
        console.log('1. The password is incorrect');
        console.log('2. The password in the database was not hashed correctly');
        console.log('3. The bcrypt comparison is not working properly');
      }
    } else {
      console.log('No password set for this user');
    }
    
    console.log('Test completed');
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 