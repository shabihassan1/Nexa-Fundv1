# Local PostgreSQL 18 Database Access

Quick reference for accessing and managing your local NexaFund database via terminal.

---

## 🔑 Connection Details

- **Host:** `localhost`
- **Port:** `5433`
- **Database:** `nexafund`
- **Username:** `postgres`
- **Password:** `2003`

---

## 🚀 Quick Access

### Connect to Database
```powershell
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund
```

### One-Line Queries (No Interactive Mode)
```powershell
# View all users
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c 'SELECT id, email, role FROM users'

# View all campaigns
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c 'SELECT id, title, status, goal FROM campaigns'

# View milestones with status
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c 'SELECT id, title, status, current_amount, amount FROM milestones'
```

---

## 📊 Common Queries

### View Table Counts
```powershell
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c '
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM campaigns) as campaigns,
  (SELECT COUNT(*) FROM milestones) as milestones,
  (SELECT COUNT(*) FROM contributions) as contributions,
  (SELECT COUNT(*) FROM votes) as votes
'
```

### List All Tables
```powershell
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c '\dt'
```

### View Table Structure
```powershell
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c '\d users'
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c '\d campaigns'
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c '\d milestones'
```

---

## 🔧 Debugging Queries

### Check User Details
```powershell
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c '
SELECT id, email, role, created_at 
FROM users 
WHERE email = '\''creator1@nexafund.com'\''
'
```

### Check Campaign Status
```powershell
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c '
SELECT id, title, status, current_amount, goal, deadline 
FROM campaigns 
WHERE status = '\''ACTIVE'\''
'
```

### Check Milestone Voting Details
```powershell
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c '
SELECT m.id, m.title, m.status, m.current_amount, m.amount,
       COUNT(v.id) as vote_count,
       SUM(CASE WHEN v.support THEN 1 ELSE 0 END) as yes_votes
FROM milestones m
LEFT JOIN votes v ON m.id = v.milestone_id
WHERE m.status = '\''VOTING'\''
GROUP BY m.id
'
```

### View Recent Contributions
```powershell
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c '
SELECT c.id, u.email as backer, cmp.title as campaign, c.amount, c.created_at
FROM contributions c
JOIN users u ON c.user_id = u.id
JOIN campaigns cmp ON c.campaign_id = cmp.id
ORDER BY c.created_at DESC
LIMIT 10
'
```

---

## ✏️ Data Editing

### Update User Role
```powershell
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c '
UPDATE users 
SET role = '\''CREATOR'\'' 
WHERE email = '\''user1@nexafund.com'\''
'
```

### Update Campaign Status
```powershell
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c '
UPDATE campaigns 
SET status = '\''ACTIVE'\'' 
WHERE id = '\''campaign-id-here'\''
'
```

### Update Milestone Status
```powershell
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c '
UPDATE milestones 
SET status = '\''APPROVED'\'' 
WHERE id = '\''milestone-id-here'\''
'
```

### Reset Vote Times (for testing)
```powershell
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c '
UPDATE milestones 
SET vote_start_time = NOW(), 
    vote_end_time = NOW() + INTERVAL '\''7 days'\''
WHERE status = '\''VOTING'\''
'
```

---

## 🗑️ Data Cleanup

### Delete All Votes
```powershell
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c 'DELETE FROM votes'
```

### Delete All Contributions
```powershell
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c 'DELETE FROM contributions'
```

### Reset Database (Careful!)
```powershell
# Drop and recreate database
$env:PGPASSWORD="2003"; dropdb -U postgres -p 5433 nexafund
$env:PGPASSWORD="2003"; createdb -U postgres -p 5433 nexafund

# Then re-run migrations
cd backend
npm run db:setup
```

---

## 💾 Backup & Restore

### Create Backup
```powershell
pg_dump -U postgres -p 5433 -d nexafund -F p --no-owner --no-acl > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

### Restore from Backup
```powershell
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -f backup_file.sql
```

### Migrate from Neon to Local
```powershell
# Export from Neon
pg_dump -F p --no-owner --no-acl "postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require" > neon_backup.sql

# Import to Local
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -f neon_backup.sql
```

---

## 🔍 Advanced Queries

### Find Campaigns with Pending Milestones
```powershell
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c '
SELECT c.title, COUNT(m.id) as pending_milestones
FROM campaigns c
JOIN milestones m ON c.id = m.campaign_id
WHERE m.status = '\''PENDING'\''
GROUP BY c.id, c.title
'
```

### Calculate Total Platform Statistics
```powershell
$env:PGPASSWORD="2003"; psql -U postgres -p 5433 -d nexafund -c '
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM campaigns) as total_campaigns,
  (SELECT COUNT(*) FROM campaigns WHERE status = '\''ACTIVE'\'') as active_campaigns,
  (SELECT SUM(amount) FROM contributions) as total_contributions,
  (SELECT COUNT(DISTINCT user_id) FROM contributions) as total_backers
'
```

---

## 📝 Tips

- **Environment Variable:** `$env:PGPASSWORD="2003"` avoids password prompt
- **Escape Single Quotes:** Use `'\''` in PowerShell for SQL strings
- **Interactive Mode:** For multiple queries, connect once and run multiple commands
- **Table Names:** Use lowercase (e.g., `users`, `campaigns`, not `User`, `Campaign`)
- **Prisma Studio:** For GUI access, run `npm run db:studio` in backend folder

---

## 🛠️ Prisma Studio (GUI Alternative)

If you prefer a visual interface:

```powershell
cd backend
npm run db:studio
```

Opens browser at `http://localhost:5555` with full database GUI.
