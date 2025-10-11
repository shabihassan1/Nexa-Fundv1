"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const campaign_routes_1 = __importDefault(require("./campaign.routes"));
const milestone_routes_1 = __importDefault(require("./milestone.routes"));
const rewardTier_routes_1 = __importDefault(require("./rewardTier.routes"));
const contribution_routes_1 = __importDefault(require("./contribution.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const upload_controller_1 = require("../controllers/upload.controller");
const router = (0, express_1.Router)();
console.log('🔧 Registering API routes...');
// Register upload route
router.post('/uploads', upload_controller_1.uploadImage);
console.log('✅ Upload routes registered');
// Register auth routes
router.use('/auth', auth_routes_1.default);
console.log('✅ Auth routes registered');
// Register campaign routes
router.use('/campaigns', campaign_routes_1.default);
console.log('✅ Campaign routes registered');
// Register milestone routes
router.use('/milestones', milestone_routes_1.default);
console.log('✅ Milestone routes registered');
// Register reward tier routes
router.use('/reward-tiers', rewardTier_routes_1.default);
console.log('✅ Reward tier routes registered');
// Register contribution routes
router.use('/contributions', contribution_routes_1.default);
console.log('✅ Contribution routes registered');
// Register user routes
router.use('/users', user_routes_1.default);
console.log('✅ User routes registered');
console.log('🎉 All API routes registered successfully');
exports.default = router;
//# sourceMappingURL=index.js.map