# Milestone Voting API - Quick Reference

**Base URL:** `http://localhost:5050/api`  
**Authentication:** Bearer token in Authorization header

---

## 📊 Voting Endpoints

### 1. Get Voting Statistics
```http
GET /milestones/:milestoneId/voting-stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalVotes": 15,
  "approvalPercentage": 70.0,
  "quorumPercentage": 18.5,
  "quorumMet": true,
  "approvalMet": true,
  "yesVotingPower": 1050.00,
  "noVotingPower": 450.00,
  "voters": [
    {
      "id": "user123",
      "walletAddress": "0x123...",
      "isApproval": true,
      "votingPower": 500.00,
      "comment": "Great progress!",
      "votedAt": "2025-10-15T10:30:00Z"
    }
  ]
}
```

---

### 2. Cast Weighted Vote (Backer)
```http
POST /milestones/:milestoneId/vote-weighted
Authorization: Bearer <backer-token>
Content-Type: application/json

{
  "isApproval": true,
  "comment": "Excellent work!",
  "voterPrivateKey": "0x..."
}
```

**Response:**
```json
{
  "message": "Vote cast successfully",
  "vote": {
    "id": "vote123",
    "isApproval": true,
    "votingPower": 500.00,
    "transactionHash": "0xabc...",
    "votedAt": "2025-10-15T10:30:00Z"
  },
  "stats": {
    "approvalPercentage": 72.5,
    "quorumPercentage": 19.0
  }
}
```

---

### 3. Submit Milestone for Voting (Creator)
```http
POST /milestones/:milestoneId/submit-for-voting
Authorization: Bearer <creator-token>
Content-Type: application/json

{
  "description": "Completed prototype with all features",
  "files": [
    { "url": "/uploads/demo.mp4", "name": "demo.mp4" }
  ],
  "links": [
    "https://demo.example.com",
    "https://github.com/user/repo"
  ]
}
```

**Response:**
```json
{
  "message": "Milestone submitted and voting opened",
  "milestone": {
    "id": "milestone123",
    "status": "VOTING",
    "voteStartTime": "2025-10-15T10:00:00Z",
    "voteEndTime": "2025-10-22T10:00:00Z",
    "blockchainMilestoneIndex": 0
  }
}
```

---

### 4. Get Active Milestone (Campaign)
```http
GET /campaigns/:campaignId/active-milestone
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "milestone123",
  "milestoneNumber": 1,
  "title": "Prototype Development",
  "description": "Build working prototype",
  "amount": 5000.00,
  "status": "ACTIVE",
  "deadline": "2025-11-15T00:00:00Z",
  "proofRequirements": "Working demo video + GitHub repo"
}
```

**If no active milestone:** `404 Not Found`

---

## 🔐 Admin Endpoints

### 5. Open Voting Manually (Admin)
```http
POST /milestones/:milestoneId/open-voting
Authorization: Bearer <admin-token>
```

**Use Case:** Manually trigger voting if auto-open fails

---

### 6. Check Release Conditions (Admin)
```http
POST /milestones/:milestoneId/check-release
Authorization: Bearer <admin-token>
```

**Use Case:** Force immediate check before cron job runs

---

### 7. Trigger Cron Job Manually (Admin)
```http
POST /milestones/admin/trigger-release-check
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "message": "Milestone release check triggered successfully",
  "note": "Process is running in background. Check server logs for results."
}
```

**Use Case:** Test cron job, force check of ALL expired voting periods

---

## 📋 Business Rules

### Weighted Voting
- **Vote Power** = Sum of all user contributions to campaign
- **Release Conditions:**
  - Approval: YES votes ≥ 60% of total voting power
  - Quorum: Total votes ≥ 10% of campaign goal
- **Both conditions** must be met for release

### Milestone Status Flow
```
PENDING → ACTIVE → SUBMITTED → VOTING → APPROVED/REJECTED
         (backers) (creator)   (7 days)  (funds released)
          fund      submits     backers   or milestone
                    proof       vote      fails
```

### Validation Rules
1. Only backers (with contributions) can vote
2. Cannot vote twice on same milestone
3. Voting only during 7-day window
4. Creator must own campaign to submit
5. Admin role required for manual triggers

---

## 🕒 Automated System

### Cron Job
- **Schedule:** Every hour at minute 0
- **Action:** Checks all VOTING milestones with expired voteEndTime
- **If Release Conditions Met:**
  - Calls smart contract finalize()
  - Updates status to APPROVED
  - Sets next milestone to ACTIVE
- **If Conditions Not Met:**
  - Updates status to REJECTED
  - Does NOT release funds

### Manual Trigger
Admin can force immediate check using:
```http
POST /milestones/admin/trigger-release-check
```

---

## 🧪 Testing Workflow

### 1. Setup
```bash
# Create campaign with milestones
POST /campaigns
{ title, goalAmount, milestones: [...] }

# Get active milestone
GET /campaigns/:id/active-milestone
```

### 2. Fund Campaign
```bash
# Multiple users contribute
POST /campaigns/:id/contribute
{ amount: 500 }

# Repeat with 3-5 users
```

### 3. Submit & Vote
```bash
# Creator submits
POST /milestones/:id/submit-for-voting
{ description, files, links }

# Backers vote
POST /milestones/:id/vote-weighted
{ isApproval: true, voterPrivateKey }

# Check stats
GET /milestones/:id/voting-stats
```

### 4. Release
```bash
# Option A: Wait for cron job (hourly)
# Option B: Manual trigger
POST /milestones/:id/check-release
```

---

## 🔍 Debugging

### Check Cron Job Logs
```bash
# Server console output shows:
🕒 Milestone Release Job: Checking for expired voting periods...
📋 Found X expired voting period(s)
🎯 Processing: Milestone #1...
✅ RELEASED / ❌ REJECTED
```

### Verify Blockchain Integration
```bash
# All votes should appear on blockchain
# Check Tenderly VTN explorer:
https://dashboard.tenderly.co/...

# Contract: 0x2428fB67608E04Dc3171f05e212211BBB633f589
# Chain ID: 73571
```

---

## 📞 Support

**Issues?**
1. Check server logs for errors
2. Verify database migrations applied
3. Confirm ethers.js v5.7.2 installed
4. Ensure contract ABI in `backend/src/abi/`
5. Test blockchain connection to Tenderly VTN

**Error Codes:**
- `401` - Invalid/missing token
- `403` - Insufficient permissions
- `404` - Milestone/campaign not found
- `500` - Server error (check logs)

---

**Backend Ready! 🚀**
