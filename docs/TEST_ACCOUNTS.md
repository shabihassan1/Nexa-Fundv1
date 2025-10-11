# 🧪 Test Accounts# 🧪 NexaFund Test Accounts



**⚠️ TESTING PHASE - NO REAL MONEY**## ⚠️ TESTING PHASE DISCLAIMER



All test accounts use password: **`Test@123`****This project is currently in the TESTING/DEVELOPMENT phase:**



---- ❌ **NO REAL MONEY** is involved in any transactions

- ❌ **NO REAL FINANCIAL DATA** should be entered

## 🔑 Login Credentials- ✅ All transactions are **SIMULATED** for testing purposes

- ✅ Test data may be **RESET PERIODICALLY**

| Role | Email | Purpose |- ✅ This is a **DEMONSTRATION/EDUCATIONAL** platform

|------|-------|---------|

| **SUPER_ADMIN** | superadmin@nexafund.com | Full platform access |**Do not:**

| **ADMIN** | admin@nexafund.com | Platform administration |- Enter real credit card information

| **MODERATOR** | moderator@nexafund.com | Content moderation |- Use real cryptocurrency wallets with actual funds

| **CREATOR** | creator1@nexafund.com | Campaign creator #1 |- Share sensitive personal information

| **CREATOR** | creator2@nexafund.com | Campaign creator #2 |- Expect transactions to have real-world value

| **CREATOR** | creator3@nexafund.com | Campaign creator #3 |

| **BACKER** | backer1@nexafund.com | Campaign supporter #1 |---

| **BACKER** | backer2@nexafund.com | Campaign supporter #2 |

| **BACKER** | backer3@nexafund.com | Campaign supporter #3 |## 🔑 Test Account Credentials

| **USER** | user1@nexafund.com | Regular user #1 |

| **USER** | user2@nexafund.com | Regular user #2 |All test accounts use the password: **`Test@123`**

| **USER** | user3@nexafund.com | Regular user #3 |

### Platform Administrators

---

| Role | Email | Password | Purpose |

## 🧪 Testing Scenarios|------|-------|----------|---------|

| **SUPER_ADMIN** | superadmin@nexafund.com | Test@123 | Full platform access, system management |

### Campaign Creation| **ADMIN** | admin@nexafund.com | Test@123 | User management, campaign oversight |

- Login: **creator1@nexafund.com** / Test@123| **MODERATOR** | moderator@nexafund.com | Test@123 | Content moderation, report handling |

- Create campaign with milestones

- Test admin approval workflow### Campaign Creators



### Campaign Backing| Name | Email | Password | Character Profile |

- Login: **backer1@nexafund.com** / Test@123|------|-------|----------|-------------------|

- Browse active campaigns| Alice Johnson | creator1@nexafund.com | Test@123 | Tech entrepreneur |

- Test contribution flow| Bob Smith | creator2@nexafund.com | Test@123 | Environmental activist |

| Carol Martinez | creator3@nexafund.com | Test@123 | Artist and creative director |

### Admin Dashboard

- Login: **superadmin@nexafund.com** / Test@123### Campaign Backers

- View platform statistics

- Manage users and campaigns| Name | Email | Password | Character Profile |

|------|-------|----------|-------------------|

### Content Moderation| David Lee | backer1@nexafund.com | Test@123 | Early adopter, tech enthusiast |

- Login: **moderator@nexafund.com** / Test@123| Emma Wilson | backer2@nexafund.com | Test@123 | Innovation supporter |

- Review reported campaigns| Frank Thompson | backer3@nexafund.com | Test@123 | Community investor |

- Test moderation actions

### Regular Users

---

| Name | Email | Password | Character Profile |

**All transactions are simulated for testing purposes only.**|------|-------|----------|-------------------|

| Grace Chen | user1@nexafund.com | Test@123 | Exploring opportunities |
| Henry Davis | user2@nexafund.com | Test@123 | New platform user |
| Iris Taylor | user3@nexafund.com | Test@123 | Local initiative supporter |

---

## 🚀 How to Seed Test Accounts

### Method 1: Run the Seed Script (Recommended)

```powershell
cd backend
npx ts-node src/scripts/seedTestUsers.ts
```

This will create all test accounts at once.

### Method 2: Individual Admin Creation (Legacy)

```powershell
cd backend
npx ts-node src/scripts/createSuperAdmin.ts
npx ts-node src/scripts/createAdmin.ts
```

---

## 🎭 Testing Scenarios

### Scenario 1: Campaign Creation & Management
1. Login as **creator1@nexafund.com**
2. Create a new campaign
3. Add reward tiers and milestones
4. Login as **admin@nexafund.com**
5. Approve/reject the campaign

### Scenario 2: Campaign Backing
1. Login as **backer1@nexafund.com**
2. Browse active campaigns
3. Make a contribution (simulated)
4. Login as **creator1@nexafund.com**
5. View backer list and contributions

### Scenario 3: Content Moderation
1. Login as **user1@nexafund.com**
2. Report a campaign or user
3. Login as **moderator@nexafund.com**
4. Review and resolve the report

### Scenario 4: Admin Dashboard
1. Login as **admin@nexafund.com**
2. View platform statistics
3. Manage users and campaigns
4. Review system activity

### Scenario 5: Role Progression
1. Login as **user1@nexafund.com** (USER role)
2. Make a contribution → Auto-upgrade to BACKER
3. Request creator status → Admin approval → CREATOR

---

## 🛡️ Security Notes for Testing

### Development Environment
- ✅ Passwords are simple for easy testing
- ✅ All accounts are clearly marked as test accounts
- ✅ No real financial data is processed

### Production Environment (Future)
- ⚠️ All test accounts must be deleted
- ⚠️ Strong password requirements enforced
- ⚠️ Real email verification required
- ⚠️ Two-factor authentication recommended
- ⚠️ Real financial compliance needed

---

## 🔄 Resetting Test Data

To reset all test users and start fresh:

```powershell
cd backend

# Reset database (will delete ALL data)
npx prisma migrate reset

# Re-initialize permissions
npx ts-node src/scripts/initializePermissions.ts

# Seed test users again
npx ts-node src/scripts/seedTestUsers.ts
```

⚠️ **Warning:** This will delete ALL data in the database!

---

## 📝 Quick Reference Card

**Print or bookmark this:**

```
┌─────────────────────────────────────────────────────┐
│        NexaFund Test Accounts Quick Reference       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🔐 Universal Password: Test@123                    │
│                                                     │
│  Admin Access:                                      │
│  • superadmin@nexafund.com (Full Access)           │
│  • admin@nexafund.com (Admin)                      │
│  • moderator@nexafund.com (Moderator)              │
│                                                     │
│  Test Creators:                                     │
│  • creator1@nexafund.com (Alice)                   │
│  • creator2@nexafund.com (Bob)                     │
│  • creator3@nexafund.com (Carol)                   │
│                                                     │
│  Test Backers:                                      │
│  • backer1@nexafund.com (David)                    │
│  • backer2@nexafund.com (Emma)                     │
│  • backer3@nexafund.com (Frank)                    │
│                                                     │
│  Regular Users:                                     │
│  • user1@nexafund.com (Grace)                      │
│  • user2@nexafund.com (Henry)                      │
│  • user3@nexafund.com (Iris)                       │
│                                                     │
│  ⚠️  TESTING ONLY - NO REAL MONEY                   │
└─────────────────────────────────────────────────────┘
```

---

## 🎓 Educational Use

This platform is designed for:
- **Academic projects** and research
- **Portfolio demonstrations**
- **Learning blockchain** and Web3 concepts
- **Understanding crowdfunding** mechanics
- **Testing enterprise security** patterns

---

## 📧 Contact

For questions about test accounts or platform access:
- Check project documentation
- Contact repository maintainer
- Review setup guides

---

**Remember:** This is a learning and testing environment. Treat it as such and enjoy exploring the platform! 🚀
