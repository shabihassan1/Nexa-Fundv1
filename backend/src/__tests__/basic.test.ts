/// <reference types="jest" />
import { describe, expect, it, jest, beforeEach, afterAll } from '@jest/globals';
import { config } from '../config/env';
import { prisma } from '../config/database';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should load required environment variables', () => {
    expect(config.nodeEnv).toBeDefined();
    expect(config.port).toBeDefined();
    expect(config.databaseUrl).toBeDefined();
    expect(config.jwtSecret).toBeDefined();
  });

  it('should have correct data types for configuration', () => {
    expect(typeof config.port).toBe('number');
    expect(typeof config.nodeEnv).toBe('string');
    expect(typeof config.databaseUrl).toBe('string');
    expect(typeof config.jwtSecret).toBe('string');
    expect(typeof config.rateLimitWindowMs).toBe('number');
    expect(typeof config.rateLimitMax).toBe('number');
  });

  it('should have valid values for rate limiting', () => {
    expect(config.rateLimitWindowMs).toBeGreaterThan(0);
    expect(config.rateLimitMax).toBeGreaterThan(0);
  });
});

describe('Database Configuration', () => {
  it('should have valid Prisma client configuration', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
    expect(typeof prisma.$disconnect).toBe('function');
  });
}); 