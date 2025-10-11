// @ts-nocheck
import express, { Request, Response } from 'express';
import { prisma } from '../config/database';
import * as jwt from 'jsonwebtoken';
import { config } from '../config/env';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Registration endpoint
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create a new user
    const user = await prisma.user.create({
      data: { 
        email, 
        name,
        password: hashedPassword,
        walletAddress: `temp-${Date.now()}` // Temporary wallet address as it's required
      }
    });
    
    const token = jwt.sign({ id: user.id }, config.jwtSecret as string, { expiresIn: config.jwtExpiresIn });
    
    // Don't send the password back to the client
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    // Debug log to see what's being queried
    console.log(`Attempting login for email: ${email}`);
    
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Debug log to see if user was found
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.password) {
      return res.status(400).json({ error: 'Password not set for this account' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    // Debug log for password verification
    console.log('Password valid:', isPasswordValid ? 'Yes' : 'No');
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id }, config.jwtSecret as string, { expiresIn: config.jwtExpiresIn });
    
    // Don't send the password back to the client
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Profile endpoint - Get the current user's profile
router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    // The user is already attached to the request by the authMiddleware
    const userId = req.user.id;
    
    // Fetch the user from the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        walletAddress: true,
        bio: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json(user);
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Profile endpoint - Update the current user's profile
router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { name, email, bio, walletAddress } = req.body;
    
    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (walletAddress !== undefined) updateData.walletAddress = walletAddress;
    
    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await prisma.user.findUnique({ 
        where: { email },
        select: { id: true }
      });
      
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Email is already taken' });
      }
    }
    
    // Check if wallet address is being changed and if it's already taken
    if (walletAddress) {
      // Basic validation for Ethereum address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return res.status(400).json({ error: 'Invalid Ethereum wallet address format' });
      }
      
      const existingWallet = await prisma.user.findUnique({ 
        where: { walletAddress },
        select: { id: true }
      });
      
      // Only prevent duplicate if the wallet belongs to a different user
      // Allow users to update from temp addresses to real ones
      if (existingWallet && existingWallet.id !== userId) {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { walletAddress: true }
        });
        
        // If current user has a temp address, allow them to update to any real address
        if (!currentUser?.walletAddress?.startsWith('temp-')) {
          return res.status(400).json({ error: 'Wallet address is already associated with another account' });
        }
      }
    }
    
    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        walletAddress: true,
        bio: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return res.status(200).json(updatedUser);
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// New endpoint specifically for updating wallet address
router.put('/wallet-address', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // Basic validation for Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Ethereum wallet address format' });
    }
    
    // Check if wallet address is already taken
    const existingWallet = await prisma.user.findUnique({ 
      where: { walletAddress },
      select: { id: true }
    });
    
    // Only prevent duplicate if the wallet belongs to a different user
    // Allow users to update from temp addresses to real ones
    if (existingWallet && existingWallet.id !== userId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { walletAddress: true }
      });
      
      // If current user has a temp address, allow them to update to any real address
      if (!currentUser?.walletAddress?.startsWith('temp-')) {
        return res.status(400).json({ error: 'Wallet address is already associated with another account' });
      }
    }
    
    // Update the user's wallet address
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { walletAddress },
      select: {
        id: true,
        email: true,
        name: true,
        walletAddress: true,
        bio: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return res.status(200).json({ 
      message: 'Wallet address updated successfully', 
      user: updatedUser 
    });
  } catch (err) {
    console.error('Wallet address update error:', err);
    return res.status(500).json({ error: 'Failed to update wallet address' });
  }
});

// Special endpoint for swapping wallet addresses between users (admin only)
router.post('/swap-wallets', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId1, userId2 } = req.body;
    
    // Check if the requesting user is an admin (you can modify this check as needed)
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can swap wallet addresses' });
    }
    
    if (!userId1 || !userId2) {
      return res.status(400).json({ error: 'Both userId1 and userId2 are required' });
    }
    
    // Get both users
    const user1 = await prisma.user.findUnique({
      where: { id: userId1 },
      select: { id: true, name: true, email: true, walletAddress: true }
    });
    
    const user2 = await prisma.user.findUnique({
      where: { id: userId2 },
      select: { id: true, name: true, email: true, walletAddress: true }
    });
    
    if (!user1 || !user2) {
      return res.status(404).json({ error: 'One or both users not found' });
    }
    
    // Store the wallet addresses
    const wallet1 = user1.walletAddress;
    const wallet2 = user2.walletAddress;
    
    // Temporarily set both to temp addresses to avoid unique constraint issues
    await prisma.user.update({
      where: { id: userId1 },
      data: { walletAddress: `temp-swap-${Date.now()}-1` }
    });
    
    await prisma.user.update({
      where: { id: userId2 },
      data: { walletAddress: `temp-swap-${Date.now()}-2` }
    });
    
    // Now swap the addresses
    await prisma.user.update({
      where: { id: userId1 },
      data: { walletAddress: wallet2 }
    });
    
    await prisma.user.update({
      where: { id: userId2 },
      data: { walletAddress: wallet1 }
    });
    
    return res.status(200).json({
      message: 'Wallet addresses swapped successfully',
      user1: { id: userId1, name: user1.name, newWallet: wallet2 },
      user2: { id: userId2, name: user2.name, newWallet: wallet1 }
    });
    
  } catch (err) {
    console.error('Wallet swap error:', err);
    return res.status(500).json({ error: 'Failed to swap wallet addresses' });
  }
});

export default router; 