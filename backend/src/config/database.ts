import { PrismaClient } from '../generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? 
    [
      {
        emit: 'event',
        level: 'query',
      },
      'warn',
      'error'
    ] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Performance monitoring - log slow queries
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    if (e.duration > 100) {
      console.warn(`⚠️ SLOW QUERY (${e.duration}ms): ${e.query}`);
    }
  });
}

// Test database connection
if (process.env.NODE_ENV === 'development') {
  prisma.$connect()
    .then(() => console.log('🐘 Database connected successfully'))
    .catch((error: unknown) => console.error('❌ Database connection failed:', error));
}

export default prisma; 