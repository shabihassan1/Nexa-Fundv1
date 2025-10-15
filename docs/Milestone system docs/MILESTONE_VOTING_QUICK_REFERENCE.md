# 🚀 Milestone Voting - Quick Reference

**Last Updated:** October 15, 2025  
**Status:** ✅ 100% Complete - Ready for Testing

---

## 📋 Quick Start

### Start Services
```powershell
# Backend
cd backend; npm run dev

# Frontend  
cd frontend; npm run dev
```

### Access Points
- Frontend: http://localhost:8080
- Backend: http://localhost:5050
- API Docs: http://localhost:5050/api/docs (if configured)

---

## 🎯 Key Concepts

### Milestone States
```
PENDING → ACTIVE → SUBMITTED → VOTING → APPROVED/REJECTED
```

### Release Conditions
- ✅ **60% Approval Rate** (YES votes / total votes)
- ✅ **10% Quorum** (total voting power / campaign goal)
- ✅ **Both must be met** for automatic release

### Voting Power
```
Voting Power = Total Contribution Amount
$500 contribution = $500 voting power
```

---

## 🔗 API Endpoints

### Active Milestone
```http
GET /api/campaigns/:campaignId/active-milestone
Authorization: Bearer {token}
```

### Voting Stats
```http
GET /api/milestones/:milestoneId/voting-stats
Authorization: Bearer {token}
```

### Submit for Voting
```http
POST /api/milestones/:milestoneId/submit-for-voting
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Milestone completed",
  "evidenceLinks": ["https://demo.app", "https://github.com/repo"]
}
```

### Cast Vote
```http
POST /api/milestones/:milestoneId/vote-weighted
Authorization: Bearer {token}
Content-Type: application/json

{
  "isApproval": true,
  "comment": "Great work!",
  "voterPrivateKey": "0x..."
}
```

### Manual Release Check (Admin)
```http
POST /api/milestones/:milestoneId/trigger-release-check
Authorization: Bearer {adminToken}
```

---

## 🧩 Component Usage

### VotingStats
```tsx
import { VotingStats } from '@/components/campaign/VotingStats';

<VotingStats 
  milestoneId={milestone.id} 
  token={authToken} 
/>
```

### VoteButtons
```tsx
import { VoteButtons } from '@/components/campaign/VoteButtons';

<VoteButtons
  milestoneId={milestone.id}
  userHasVoted={false}
  userVotingPower={500}
  onVoteSuccess={() => refetch()}
/>
```

### Enhanced BackingModal
```tsx
// Automatically fetches and displays active milestone
// No additional props needed
<BackingModal campaign={campaign} isOpen={true} />
```

---

## 🔍 Database Queries

### Check Milestone Status
```sql
SELECT id, title, status, "voteStartTime", "voteEndTime"
FROM "Milestone" 
WHERE "campaignId" = '{id}';
```

### Check Active Milestone
```sql
SELECT c.id, c.title, c."activeMilestoneId", m.title as "activeMilestoneTitle"
FROM "Campaign" c
LEFT JOIN "Milestone" m ON c."activeMilestoneId" = m.id
WHERE c.id = '{id}';
```

### View Votes
```sql
SELECT v.*, u.name as "voterName"
FROM "MilestoneVote" v
JOIN "User" u ON v."userId" = u.id
WHERE v."milestoneId" = '{id}'
ORDER BY v."votedAt" DESC;
```

### Expired Voting Periods
```sql
SELECT * FROM "Milestone"
WHERE status = 'VOTING'
  AND "voteEndTime" < NOW();
```

---

## 🐛 Common Issues

### Issue: Progress bars not colored
**Fix:** Using custom divs, not `<Progress>` component

### Issue: Cron job not running
**Check:** `backend/src/index.ts` calls `milestoneReleaseJob.start()`

### Issue: Stats not updating
**Check:** React Query refetchInterval = 10000 (10 seconds)

### Issue: Vote not recording
**Check:** Private key format (must start with 0x...)

### Issue: Release not triggering
**Check:** Backend console for errors in `checkAndReleaseMilestone()`

---

## 📊 Testing Checklist

### Quick Smoke Test (15 minutes)
- [ ] Create campaign with 3 milestones
- [ ] Make contribution (milestone activates)
- [ ] BackingModal shows active milestone
- [ ] Creator submits evidence
- [ ] Voting opens automatically
- [ ] Cast vote with private key
- [ ] Stats update in UI
- [ ] Check blockchain transaction

### Full Flow Test (1 hour)
- [ ] Follow MILESTONE_VOTING_TESTING_GUIDE.md
- [ ] Test all 8 test flows
- [ ] Verify edge cases
- [ ] Check cron job functionality

---

## 📚 Documentation Files

| File | Purpose | Lines |
|------|---------|-------|
| MILESTONE_VOTING_IMPLEMENTATION_PLAN.md | Technical spec | 700+ |
| MILESTONE_VOTING_COMPLETE_FLOW.md | User journeys | 800+ |
| MILESTONE_VOTING_TESTING_GUIDE.md | Test procedures | 1,200+ |
| MILESTONE_VOTING_COMPLETION_SUMMARY.md | Final summary | 500+ |
| MILESTONE_VOTING_QUICK_REFERENCE.md | This file | 150+ |

---

## 🎯 File Locations

### Backend
```
backend/src/
├── services/
│   ├── blockchainService.ts (203 lines)
│   └── milestoneService.ts (extended)
├── controllers/
│   └── milestone.controller.ts (extended)
├── routes/
│   └── milestoneRoutes.ts (extended)
└── jobs/
    └── milestoneReleaseJob.ts (190 lines)
```

### Frontend
```
frontend/src/
├── components/campaign/
│   ├── VotingStats.tsx (236 lines)
│   ├── VoteButtons.tsx (200 lines)
│   └── MilestoneCard.tsx (modified)
├── services/
│   └── campaignService.ts (4 new functions)
└── components/
    └── BackingModal.tsx (enhanced)
```

---

## 🔐 Smart Contract

**Network:** Tenderly Virtual TestNet  
**Chain ID:** 73571  
**Contract:** 0x2428fB67608E04Dc3171f05e212211BBB633f589  
**ABI Location:** `frontend/src/abi/NexaFundWeighted.json`

### Key Functions
- `openVoting(milestoneIndex, duration)` - Opens voting period
- `voteMilestone(milestoneIndex, isApproval, voterPrivateKey)` - Cast vote
- `finalizeMilestone(milestoneIndex)` - Release funds
- `getMilestone(milestoneIndex)` - Get milestone data

---

## ⏰ Cron Job

**Schedule:** Every hour (`0 * * * *`)  
**Function:** Checks expired voting periods and auto-releases  
**File:** `backend/src/jobs/milestoneReleaseJob.ts`  
**Started:** On server startup in `backend/src/index.ts`

### Manual Trigger
```typescript
import { milestoneReleaseJob } from './jobs/milestoneReleaseJob';
await milestoneReleaseJob.checkExpiredVotingMilestones();
```

---

## 📈 Success Metrics

### Implementation
- ✅ 0 TypeScript errors
- ✅ 0 runtime errors
- ✅ All components render
- ✅ Backend starts successfully
- ✅ Cron job schedules

### Testing (To Complete)
- ⏳ End-to-end flow passes
- ⏳ All edge cases handled
- ⏳ Performance meets targets
- ⏳ Cross-browser compatible

---

## 🚀 Next Steps

1. **Test** → Follow testing guide
2. **Fix** → Address any bugs
3. **Deploy** → Staging environment
4. **Monitor** → Cron job execution
5. **Launch** → Production deployment

---

## 💡 Tips

### For Developers
- Use React Query DevTools to debug stats updates
- Check backend console for cron job logs
- Monitor blockchain transactions on Tenderly

### For Testers
- Use 3+ test accounts for voting scenarios
- Test with different contribution amounts
- Verify both immediate and cron-based releases

### For Users
- Voting power = your total contributions
- 7-day voting period per milestone
- 60% + 10% required for release
- Private key never stored

---

**Quick Access:**
- 📖 Full Testing Guide: `MILESTONE_VOTING_TESTING_GUIDE.md`
- 🎯 User Flows: `MILESTONE_VOTING_COMPLETE_FLOW.md`
- 📊 Final Summary: `MILESTONE_VOTING_COMPLETION_SUMMARY.md`

**Status:** ✅ Ready to Test → 🧪 Testing → 🚀 Deploy
