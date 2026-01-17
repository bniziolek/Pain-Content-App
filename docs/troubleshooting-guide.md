# Troubleshooting Guide

Common issues and solutions for RehabPilot.

## Authentication Issues

### "Invalid email or password"

**Possible Causes:**
1. Wrong credentials
2. Account doesn't exist
3. Password hashing mismatch

**Solutions:**
- Double-check email spelling
- Use admin panel to reset password
- Verify account exists in database

### Session Keeps Expiring

**Possible Causes:**
1. `SESSION_SECRET` not set or changing
2. Cookie settings misconfigured
3. Database session store issues

**Solutions:**
- Ensure `SESSION_SECRET` is set and consistent
- Check cookie `secure` flag matches environment
- Verify database connection is stable

### Patient Can't Log Into Portal

**Possible Causes:**
1. Wrong email/access code combination
2. Access code expired or locked
3. Too many failed attempts

**Solutions:**
- Verify email matches exactly (case-insensitive)
- Check email_logs table for lockout status
- Resend content with new access code

**Check lockout status:**
```sql
SELECT failed_attempts, locked_until, permanently_locked 
FROM email_logs 
WHERE patient_email = 'patient@example.com'
ORDER BY sent_at DESC LIMIT 1;
```

## Email Delivery Issues

### Emails Not Sending

**Possible Causes:**
1. Gmail connector not authorized
2. Invalid recipient email
3. Rate limiting

**Solutions:**
- Re-authorize Gmail in Replit connectors
- Check recipient email is valid
- Wait and retry if rate limited

### Emails Going to Spam

**Possible Causes:**
1. Domain reputation issues
2. Missing email authentication (SPF/DKIM)

**Solutions:**
- Use a reputable sending domain
- Configure SPF/DKIM records (if using custom domain)
- Ask patients to add sender to contacts

## Content Issues

### Content Not Loading

**Possible Causes:**
1. Contentful not configured
2. Contentful API error
3. Database fallback also failing

**Solutions:**
- Check `CONTENTFUL_SPACE_ID` and `CONTENTFUL_ACCESS_TOKEN`
- Verify Contentful space has content
- Check database has seeded content

**Check content source:**
```bash
curl http://localhost:5000/api/content/status
# Returns: { "source": "contentful" | "database", "configured": true/false }
```

### Content Showing Wrong Language/Format

**Possible Causes:**
1. Rich text not rendered properly
2. Markdown parsing issues

**Solutions:**
- Ensure content body uses valid markdown
- Check frontend markdown renderer

## Database Issues

### "Database connection failed"

**Possible Causes:**
1. `DATABASE_URL` not set
2. Database server down
3. Connection pool exhausted

**Solutions:**
- Verify `DATABASE_URL` environment variable
- Check Replit database pane for status
- Restart application

### Schema Mismatch Errors

**Possible Causes:**
1. Code schema differs from database
2. Migration not applied

**Solutions:**
```bash
# Sync schema to database
npm run db:push

# Force if needed (careful!)
npm run db:push --force
```

## Assessment Issues

### Assessment Builder Not Loading

**Possible Causes:**
1. SurveyJS CSS not loading
2. JavaScript bundle error

**Solutions:**
- Check browser console for errors
- Verify SurveyJS imports in code
- Clear browser cache

### Scoring Not Working

**Possible Causes:**
1. Question names don't contain tags
2. Invalid `scoringConfig` JSON
3. Answers not in expected format

**Solutions:**
- Name questions with tag prefixes (e.g., `fear_movement_1`)
- Validate scoringConfig JSON
- Check assessment response structure

**Debug scoring:**
```typescript
// In server/scoring.ts, add logging:
console.log('Input answers:', answers);
console.log('Extracted scores:', tagScores);
```

### Recommendations Not Generating

**Possible Causes:**
1. No matching rules
2. Tag scores below thresholds
3. Content not tagged properly

**Solutions:**
- Use preview feature to test rules
- Check rule score ranges
- Verify content has matching tags

## Performance Issues

### Slow Page Loads

**Possible Causes:**
1. Large database queries
2. Contentful API latency
3. Too many re-renders

**Solutions:**
- Add database indexes
- Implement caching for Contentful
- Optimize React components

### Memory Issues

**Possible Causes:**
1. Session data growing
2. Memory leaks in server code

**Solutions:**
- Clean up expired sessions regularly
- Monitor memory usage in logs

## Common Error Messages

### "Subscription required"

User doesn't have active subscription.

**Fix:** Admin can activate subscription:
```bash
curl -X PATCH http://localhost:5000/api/admin/users/[userId]/subscription \
  -H "Content-Type: application/json" \
  -d '{"subscriptionStatus": "active"}'
```

### "Not authorized"

User lacks permission for the action.

**Fix:** Check user role and resource ownership.

### "Content not found"

Content ID doesn't exist in Contentful or database.

**Fix:** Verify content ID exists, check for typos.

### "Assessment already completed"

Patient trying to resubmit assessment.

**Fix:** By design - each invite can only be completed once. Send new invite if needed.

## Debugging Tools

### Check Server Logs

View in Replit workflow pane or:
```bash
# In shell
cat /tmp/logs/Start_application_*.log
```

### Check Audit Logs

```sql
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

### Check Email Status

```sql
SELECT patient_email, subject, status, sent_at 
FROM email_logs 
WHERE clinician_user_id = '[clinicianId]'
ORDER BY sent_at DESC 
LIMIT 10;
```

### Test API Endpoints

```bash
# Get content
curl http://localhost:5000/api/content

# Check auth status
curl http://localhost:5000/api/user -b "connect.sid=your-session-cookie"
```

## Getting Help

If issues persist:

1. Check browser developer console for client errors
2. Check server logs for backend errors
3. Search audit logs for failed actions
4. Review recent code changes
5. Contact Replit support for platform issues
