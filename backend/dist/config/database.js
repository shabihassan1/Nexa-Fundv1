"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const prisma_1 = require("../generated/prisma");
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ?? new prisma_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
// Test database connection
if (process.env.NODE_ENV === 'development') {
    exports.prisma.$connect()
        .then(() => console.log('🐘 Database connected successfully'))
        .catch((error) => console.error('❌ Database connection failed:', error));
}
exports.default = exports.prisma;
//# sourceMappingURL=database.js.map