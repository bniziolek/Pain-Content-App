# Recommendation Engine Logic

How RehabPilot generates content recommendations based on assessment scores.

## Three-Tier Architecture

The recommendation engine uses a priority-based system:

```
1. Clinician Rules (highest priority)
   ↓ (if no matches)
2. Pathway Context
   ↓ (if no matches)
3. Tag-Based Fallback (lowest priority)
```

## Tier 1: Clinician Rules

Custom rules defined in `/recommendation-rules`.

### Creating a Rule

| Field | Description |
|-------|-------------|
| Name | Descriptive name for the rule |
| Tag | Assessment tag to match (e.g., "fear_avoidance") |
| Min Score | Minimum score % to trigger (0-100) |
| Max Score | Maximum score % to trigger (0-100) |
| Priority | Lower number = higher priority |
| Content | Content items to recommend |
| Rationale | Why this rule exists (for your reference) |

### Scoping Rules

Rules can be scoped to specific contexts:

- **Global**: Applies to all assessments
- **Assessment-specific**: Only for a particular assessment
- **Pathway-specific**: Only for patients in a pathway
- **Week-specific**: Only for a specific week in a pathway

### Example Rules

**High Fear-Avoidance Rule:**
```
Tag: fear_avoidance
Score Range: 70-100%
Content: "Graded Exposure Therapy", "Motion is Lotion"
Rationale: High fear scores need movement encouragement
```

**Moderate Pain Education:**
```
Tag: catastrophizing
Score Range: 40-70%
Content: "Understanding Pain Pathways"
Rationale: Moderate catastrophizing benefits from education
```

## Tier 2: Pathway Context

If no clinician rules match, the system checks pathway enrollment.

### How It Works

1. Check if patient is enrolled in a care pathway
2. Find current week's milestone
3. Get content assigned to that milestone
4. Prioritize content matching elevated assessment tags

### Example

Patient enrolled in "Low Back Pain Pathway", currently Week 3:
- Week 3 milestone has content: ["Sleep & Recovery", "Stress & The Body"]
- Assessment shows elevated `stress` tag
- "Stress & The Body" is prioritized

## Tier 3: Tag-Based Fallback

If no rules or pathway content match, fall back to tag matching.

### How It Works

1. Find tags with elevated scores (>50%)
2. Search content library for matching tags
3. Return content with most tag overlap

### Example

Assessment scores:
- `pain`: 75%
- `fear`: 60%
- `function`: 40%

Content tagged with `pain` or `fear` is recommended.

## Scoring Process

### Input: Assessment Responses

```json
{
  "pain_current": 7,
  "pain_worst": 9,
  "fear_movement_1": 4,
  "fear_movement_2": 3
}
```

### Output: Tag Scores

```json
[
  { "tag": "pain", "score": 80, "maxPossible": 100, "percentage": 80 },
  { "tag": "fear", "score": 7, "maxPossible": 10, "percentage": 70 }
]
```

### Scoring Methods

1. **Explicit Config**: Uses `scoringConfig` in assessment
2. **Inference**: Extracts tags from question names

## Preview Functionality

Test rules before deployment:

1. Go to `/recommendation-rules`
2. Click **Preview Recommendations**
3. Enter test scores for each tag
4. View which rules fire and what content is recommended

## API Reference

### Generate Recommendations

```
POST /api/recommendations
Body: { tagScores: [...] }
Response: [{ contentId, title, rationale }]
```

### Preview Recommendations

```
POST /api/recommendations/preview
Body: { 
  tagScores: [...],
  assessmentId: "optional",
  pathwayId: "optional",
  pathwayWeek: 3
}
Response: {
  recommendations: [...],
  matchedRules: [...],
  tier: "clinician_rules" | "pathway_context" | "tag_fallback"
}
```

### Manage Configs

```
GET    /api/recommendation-configs
POST   /api/recommendation-configs
PUT    /api/recommendation-configs/:id
DELETE /api/recommendation-configs/:id
```

## Data Model

### recommendation_configs

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| clinicianUserId | uuid | Rule owner |
| name | text | Rule name |
| assessmentId | uuid | Optional: scope to assessment |
| pathwayId | uuid | Optional: scope to pathway |
| pathwayWeek | int | Optional: scope to week |
| tag | text | Tag to match |
| minScore | int | Minimum % (0-100) |
| maxScore | int | Maximum % (0-100) |
| priority | int | Lower = higher priority |
| contentIds | text[] | Content to recommend |
| rationale | text | Clinician notes |
| isActive | bool | Rule enabled |

### patient_recommendations

Tracks what was recommended (for audit/review):

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| patientEmail | text | Patient |
| source | text | "assessment", "pathway_milestone", "manual" |
| tagScores | jsonb | Scores at recommendation time |
| matchedRuleIds | text[] | Which rules fired |
| recommendedContentIds | text[] | What was recommended |
| contentRationale | jsonb | { contentId: reason } |
| status | text | "generated", "sent", "viewed" |

## Best Practices

### Rule Design

1. **Start broad, refine later**: Begin with general rules, add specificity as you learn
2. **Avoid overlapping ranges**: If rule A is 0-50% and B is 50-100%, scores at 50 might match both
3. **Use priority carefully**: Higher priority rules fire first
4. **Include rationale**: Helps you remember why you created the rule

### Content Tagging

1. **Consistent tags**: Use same tags across content and assessments
2. **Hierarchical tags**: Consider `pain`, `pain.chronic`, `pain.acute`
3. **Multiple tags**: Content can have multiple tags for broader matching

### Testing

1. **Preview before deploy**: Always test rules with sample scores
2. **Edge cases**: Test scores at boundaries (0, 50, 100)
3. **No-match scenarios**: Verify fallback behavior works
