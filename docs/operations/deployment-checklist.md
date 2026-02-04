# Deployment Checklist

Steps to verify before publishing RehabPilot to production.

## Pre-Deployment Checks

### Environment Variables

- [ ] `DATABASE_URL` is set and points to production database
- [ ] `SESSION_SECRET` is set (unique, random, 32+ characters)
- [ ] `CONTENTFUL_SPACE_ID` and `CONTENTFUL_ACCESS_TOKEN` are set (if using Contentful)
- [ ] `STRIPE_SECRET_KEY` is set (if using payments)
- [ ] Gmail connector is authorized

### Database

- [ ] Database schema is up to date (`npm run db:push`)
- [ ] Seed data is loaded (content, permissions)
- [ ] Admin user exists with correct credentials
- [ ] Test queries work (content loads, auth works)

### Authentication

- [ ] Can register new account
- [ ] Can login with existing account
- [ ] Session persists across page refreshes
- [ ] Logout works correctly
- [ ] Password hashing is working (scrypt)

### Core Features

- [ ] Content library loads (from Contentful or DB)
- [ ] Can send content to patient email
- [ ] Patient portal login works with access code
- [ ] Patient can view content
- [ ] Assessment builder opens and saves
- [ ] Assessment invites send correctly
- [ ] Assessment completion triggers scoring
- [ ] Recommendations generate properly

### Email Delivery

- [ ] Gmail connector is authorized
- [ ] Test email sends successfully
- [ ] Email templates render correctly
- [ ] Links in emails work (correct domain)

### Security

- [ ] HTTPS is enforced
- [ ] Cookies are secure in production
- [ ] Access codes are hashed (not plain text)
- [ ] Rate limiting is in place
- [ ] Audit logging is working

## Deployment Steps

### 1. Final Code Review

```bash
# Check for console.log statements
grep -r "console.log" server/ --include="*.ts" | wc -l

# Check for debug code
grep -r "TODO\|FIXME\|DEBUG" server/ client/
```

### 2. Run Tests

```bash
npm test
```

### 3. Build Application

```bash
npm run build
```

### 4. Database Migration

```bash
npm run db:push
```

### 5. Publish via Replit

1. Open the **Deploy** pane in Replit
2. Review settings
3. Click **Publish**
4. Wait for deployment to complete
5. Note the production URL

### 6. Post-Deployment Verification

- [ ] Production URL loads
- [ ] Login works
- [ ] Core workflow (send content → patient views) works end-to-end
- [ ] Check logs for errors

## Environment-Specific Settings

### Development

```typescript
// Cookie settings
cookie: {
  secure: false,
  sameSite: 'lax',
}

// Base URL
baseUrl = process.env.REPLIT_DEV_DOMAIN
```

### Production

```typescript
// Cookie settings
cookie: {
  secure: true,
  sameSite: 'strict',
}

// Base URL
baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0]
```

## Rollback Plan

If deployment fails:

1. **Immediate**: Use Replit's rollback feature
   - Click "View Checkpoints" in the deployment pane
   - Select last working checkpoint
   - Restore

2. **Database**: If schema changes caused issues
   - Restore from Replit database backup
   - Revert schema changes in code
   - Re-deploy

## Monitoring Post-Deploy

### Check Logs

```bash
# View workflow logs
# (Available in Replit's workflow pane)
```

### Key Metrics to Watch

- Server errors (500s)
- Auth failures
- Email delivery failures
- Database connection issues

### Common Issues

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| 500 errors on all routes | DATABASE_URL missing | Add env var |
| Sessions not persisting | SESSION_SECRET missing | Add env var |
| Contentful content missing | API keys wrong | Check Contentful settings |
| Emails not sending | Gmail not authorized | Re-authorize connector |
| Patient portal 401 | Cookie security mismatch | Check secure flag |

## Production Support

### Accessing Logs

Logs are available in:
- Replit workflow pane (server logs)
- Database audit_logs table (user actions)

### Emergency Contacts

- Replit Support: support@replit.com
- Gmail API Issues: Google Cloud Console

### Scheduled Maintenance

Consider:
- Weekly database backup verification
- Monthly password rotation for admin accounts
- Quarterly security review
