"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
// @ts-nocheck
// Import environment configuration first
const env_1 = require("./config/env");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const database_1 = require("./config/database");
const routes_1 = __importDefault(require("./routes"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
exports.app = app;
// Security middleware with explicit headers
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    frameguard: { action: 'deny' },
    contentSecurityPolicy: false,
    xssFilter: true,
}));
// Add explicit security headers that tests are looking for
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});
// Enhanced CORS configuration - should be before any routes
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [env_1.config.frontendUrl, 'http://localhost:5173', 'http://localhost:8080'];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use((0, cors_1.default)(corsOptions));
// Serve uploaded files statically
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '..', 'uploads')));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.rateLimitWindowMs,
    max: env_1.config.rateLimitMax,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);
// Logging
app.use((0, morgan_1.default)(env_1.config.nodeEnv === 'production' ? 'combined' : 'dev'));
// JSON parsing error handler
app.use((req, res, next) => {
    express_1.default.json({
        limit: '10mb'
    })(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: 'Invalid JSON payload' });
        }
        next();
    });
});
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: env_1.config.nodeEnv,
        database: 'connected'
    });
});
// API info endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        message: 'Nexa Fund API is running!',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            campaigns: '/api/campaigns',
            users: '/api/users',
            milestones: '/api/milestones',
            reports: '/api/reports'
        }
    });
});
// Register all API routes
app.use('/api', routes_1.default);
// 404 handler for unmatched routes
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        error: env_1.config.nodeEnv === 'production' ? 'Internal Server Error' : err.message,
        ...(env_1.config.nodeEnv !== 'production' && { stack: err.stack })
    });
});
// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    try {
        await database_1.prisma.$disconnect();
        console.log('Database connections closed.');
        process.exit(0);
    }
    catch (err) {
        console.error('Error during graceful shutdown:', err);
        process.exit(1);
    }
};
// Attach shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Initialize server with proper error handling
async function startServer() {
    try {
        // Test database connection
        await database_1.prisma.$connect();
        console.log('🐘 Database connected successfully');
        // Start server
        const server = app.listen(env_1.config.port, () => {
            console.log(`
🚀 Nexa Fund API Server Information:
📡 Port: ${env_1.config.port}
📊 Environment: ${env_1.config.nodeEnv}
🔗 Frontend URL: ${env_1.config.frontendUrl}
💾 Database: Connected
🛡️ Security: Enabled (Helmet)
⚡ Rate Limiting: ${env_1.config.rateLimitMax} requests per ${env_1.config.rateLimitWindowMs}ms
      `);
        });
        return server;
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        await database_1.prisma.$disconnect();
        process.exit(1);
    }
}
// Start the server
const server = startServer();
exports.server = server;
//# sourceMappingURL=index.js.map