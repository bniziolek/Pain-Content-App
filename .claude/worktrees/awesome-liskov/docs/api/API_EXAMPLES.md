# API Examples

These examples use curl and show common flows. All endpoints are prefixed with `/api`.

## Base URL

```bash
export BASE_URL=http://localhost:5000
```

## Login (Session Cookie)

```bash
curl -i -c /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@driverpath.com","password":"admin123"}' \
  "$BASE_URL/api/login"
```

## Get Current User

```bash
curl -i -b /tmp/cookies.txt "$BASE_URL/api/user"
```

## List Content

```bash
curl -i -b /tmp/cookies.txt "$BASE_URL/api/content"
```

## Create Content

```bash
curl -i -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"title":"New Content","summary":"Short summary","body":"# Markdown body","tags":["education"],"readTime":"3 min"}' \
  "$BASE_URL/api/content"
```

## Send Content Email

```bash
curl -i -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"patientEmail":"patient@example.com","subject":"Your materials","type":"content_bundle","contentIds":["content-id-1"],"providerNote":"Please review."}' \
  "$BASE_URL/api/email-logs"
```

## Create Assessment

```bash
curl -i -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"name":"Pain Assessment","description":"Quick screening","surveyJson":{},"scoringConfig":{},"outcomeRules":{},"isPublished":true}' \
  "$BASE_URL/api/assessments"
```

## Create Assessment Invite

```bash
curl -i -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"assessmentId":"assessment-id","patientEmail":"patient@example.com"}' \
  "$BASE_URL/api/assessment-invites"
```

## Stripe Config

```bash
curl -i "$BASE_URL/api/subscription/stripe/config"
```

## Create Stripe Checkout Session

```bash
curl -i -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_123","successUrl":"http://localhost:5000/settings?success=true","cancelUrl":"http://localhost:5000/settings?canceled=true"}' \
  "$BASE_URL/api/subscription/checkout"
```

## Health Check

```bash
curl -i "$BASE_URL/api/health"
```

Notes:

- Some endpoints require an active subscription and feature flags.
- If Stripe is not configured, subscription endpoints return HTTP 503.
- For a full list of endpoints, see `docs/api/api-reference.md`.
