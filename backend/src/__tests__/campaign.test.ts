import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app, server } from '../index';
import { prisma } from '../config/database';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

describe('Campaign API Endpoints', () => {
  let testUserId: string;
  let testToken: string;
  let testCampaignId: string;
  
  // Setup - create test user and campaign
  beforeAll(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        walletAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User'
      }
    });
    
    testUserId = testUser.id;
    
    // Generate token for test user
    testToken = jwt.sign({ id: testUser.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    });
    
    // Create test campaign
    const testCampaign = await prisma.campaign.create({
      data: {
        title: 'Test Campaign',
        description: 'This is a test campaign',
        targetAmount: 1000,
        category: 'Technology',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        creatorId: testUser.id
      }
    });
    
    testCampaignId = testCampaign.id;
  });
  
  // Cleanup - delete test data
  afterAll(async () => {
    // Delete test campaign
    await prisma.campaign.deleteMany({
      where: {
        creatorId: testUserId
      }
    });
    
    // Delete test user
    await prisma.user.delete({
      where: {
        id: testUserId
      }
    });
    
    // Close server and database connections
    await server?.close();
    await prisma.$disconnect();
  });
  
  describe('GET /api/campaigns', () => {
    it('should return a list of campaigns with pagination', async () => {
      const res = await request(app)
        .get('/api/campaigns')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body).toHaveProperty('campaigns');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('limit');
      expect(res.body.pagination).toHaveProperty('pages');
    });
    
    it('should filter campaigns by category', async () => {
      const res = await request(app)
        .get('/api/campaigns?category=Technology')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body).toHaveProperty('campaigns');
      expect(res.body.campaigns.length).toBeGreaterThan(0);
      expect(res.body.campaigns[0].category).toBe('Technology');
    });
  });
  
  describe('GET /api/campaigns/:id', () => {
    it('should return a single campaign by ID', async () => {
      const res = await request(app)
        .get(`/api/campaigns/${testCampaignId}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body).toHaveProperty('id', testCampaignId);
      expect(res.body).toHaveProperty('title', 'Test Campaign');
      expect(res.body).toHaveProperty('description', 'This is a test campaign');
      expect(res.body).toHaveProperty('creatorId', testUserId);
    });
    
    it('should return 404 for non-existent campaign ID', async () => {
      const res = await request(app)
        .get('/api/campaigns/non-existent-id')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(res.body).toHaveProperty('error', 'Campaign not found');
    });
  });
  
  describe('POST /api/campaigns', () => {
    it('should create a new campaign when authenticated', async () => {
      const newCampaign = {
        title: 'New Test Campaign',
        description: 'This is a new test campaign',
        targetAmount: 2000,
        category: 'Education',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days from now
      };
      
      const res = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${testToken}`)
        .send(newCampaign)
        .expect('Content-Type', /json/)
        .expect(201);
      
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('title', newCampaign.title);
      expect(res.body).toHaveProperty('description', newCampaign.description);
      expect(res.body).toHaveProperty('creatorId', testUserId);
      
      // Clean up - delete the created campaign
      await prisma.campaign.delete({
        where: { id: res.body.id }
      });
    });
    
    it('should return 401 when not authenticated', async () => {
      const newCampaign = {
        title: 'Unauthorized Campaign',
        description: 'This should not be created',
        targetAmount: 1000,
        category: 'Other',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      const res = await request(app)
        .post('/api/campaigns')
        .send(newCampaign)
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(res.body).toHaveProperty('error', 'Authentication required');
    });
  });
  
  describe('PUT /api/campaigns/:id', () => {
    it('should update an existing campaign when authenticated as creator', async () => {
      const updates = {
        title: 'Updated Test Campaign',
        description: 'This campaign has been updated'
      };
      
      const res = await request(app)
        .put(`/api/campaigns/${testCampaignId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updates)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body).toHaveProperty('id', testCampaignId);
      expect(res.body).toHaveProperty('title', updates.title);
      expect(res.body).toHaveProperty('description', updates.description);
    });
    
    it('should return 401 when not authenticated', async () => {
      const updates = {
        title: 'Unauthorized Update'
      };
      
      const res = await request(app)
        .put(`/api/campaigns/${testCampaignId}`)
        .send(updates)
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(res.body).toHaveProperty('error', 'Authentication required');
    });
  });
  
  describe('DELETE /api/campaigns/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .delete(`/api/campaigns/${testCampaignId}`)
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(res.body).toHaveProperty('error', 'Authentication required');
    });
    
    // Note: We don't test actual deletion here since that would remove our test campaign
    // which is needed for other tests. The actual deletion is tested in the afterAll cleanup.
  });
}); 