# Issue #31: Custom Branding - Database Schema & Pro/Enterprise Tier Access

## Summary

Add database support for custom branding as a Pro/Enterprise tier feature. Clinicians with premium subscriptions can customize content packets with their practice's branding for a cohesive, professional patient experience.

## Status: Mostly Complete

Most requirements are already implemented. See checklist below for remaining items.

## User Story

> As a clinician with a Pro or Enterprise subscription, I want to customize my content packets with my practice's branding so that patients receive a cohesive, professional experience.

## Completed Items

### Database Schema (`clinic_branding` table)
- [x] `id` (UUID, primary key)
- [x] `userId` (references users, unique)
- [x] `logoUrl` (text, optional)
- [x] `primaryColor` (text, hex color)
- [x] `secondaryColor` (text, hex color)
- [x] `accentColor` (text, hex color)
- [x] `clinicName` (text)
- [x] `tagline` (text, optional)
- [x] `footerText` (text, optional)
- [x] `showWatermark` (boolean)
- [x] `showPoweredBy` (boolean)
- [x] `isActive` (boolean)
- [x] `createdAt`, `updatedAt` (timestamps)

### Tier-Based Access Control
- [x] `custom_branding` entitlement in subscription tier matrix
- [x] Gate access based on Pro/Enterprise subscription tier
- [x] Check both `subscriptionTier` AND `subscriptionStatus` for access

### API Endpoints
- [x] `GET /api/branding` - Get current user's branding
- [x] `PUT /api/branding` - Update branding
- [x] `DELETE /api/branding` - Delete branding settings

## Remaining Items

### Future Enhancement
- [ ] `POST /api/branding/logo` - Upload logo image

## Acceptance Criteria

- [x] Branding settings persist per user
- [x] Only Pro/Enterprise users with active subscription can access branding
- [x] Changes are audit-logged
- [x] Graceful fallback to default DriverPath branding for Basic tier

## Labels

`enhancement`, `backend`, `premium-feature`, `replit-ready`

## Related

- PR #138 (auto-created)
