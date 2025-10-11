import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app, server } from '../index';
import { prisma } from '../config/database';

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
    // Don't try to close the server in tests since it's not a real server instance
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123', name: 'Test User' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email: 'test@example.com', name: 'Test User' });
    // Password should not be returned
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('should login existing user', async () => {
    // Create a test user first
    const password = 'securepass123';
    const email = 'login@example.com';
    
    // We'll use the API to create the user to ensure password is properly hashed
    await request(app)
      .post('/api/auth/register')
      .send({ email, password, name: 'Login Test' });
    
    // Now try to login
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email, name: 'Login Test' });
    // Password should not be returned
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('should return 400 if email or password missing in register', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Missing Fields' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 404 if user not found in login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'password123' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'User not found');
  });
}); 