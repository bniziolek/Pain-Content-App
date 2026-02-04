# Assessment Builder Guide

How to create, configure, and deploy assessments in RehabPilot.

## Overview

RehabPilot uses SurveyJS for building assessments. This gives you:
- Visual drag-and-drop builder
- Multiple question types
- Conditional logic (decision trees)
- Scoring configuration
- Preview before publishing

## Accessing the Builder

1. Go to **Assessments** in the sidebar
2. Click **Create New Assessment** or **Build New**
3. The SurveyJS Creator opens

## Building Your Assessment

### Adding Questions

1. Click **Add Question** or drag from the toolbox
2. Choose a question type:
   - **Single Choice** - Radio buttons
   - **Multiple Choice** - Checkboxes
   - **Rating Scale** - Numeric scale (0-10, etc.)
   - **Text** - Open-ended response
   - **Matrix** - Grid of questions

### Question Properties

For each question, configure:
- **Name**: Internal identifier (used for scoring)
- **Title**: What the patient sees
- **Required**: Must answer to proceed
- **Description**: Help text

### Naming for Scoring

Name questions strategically for automatic scoring:

```
pain_intensity_current
fear_avoidance_movement
catastrophizing_helplessness
```

The scoring engine extracts tags from question names:
- `pain_intensity_current` → tag: `pain`
- `fear_avoidance_movement` → tag: `fear`

### Adding Pages

Break long assessments into pages:
1. Click **Add Page**
2. Drag questions to the new page
3. Set page title and description

### Conditional Logic

Show/hide questions based on answers:

1. Select a question
2. Go to **Logic** tab
3. Add a **Visible If** condition:
   ```
   {pain_rating} >= 7
   ```

This shows the question only if pain rating is 7 or higher.

## Configuring Scoring

### Automatic Scoring

If you name questions with tags (e.g., `fear_movement_1`), scoring happens automatically:
- Each numeric answer contributes to its tag's score
- Scores are normalized to 0-100%

### Custom Scoring Config

For precise control, add a `scoringConfig` in the assessment:

```json
{
  "tags": {
    "fear_avoidance": {
      "questionWeights": {
        "fear_question_1": 2,
        "fear_question_2": 1,
        "fear_question_3": 1
      }
    },
    "catastrophizing": {
      "questionWeights": {
        "catastrophe_1": 1,
        "catastrophe_2": 1
      }
    }
  }
}
```

### Outcome Rules

Define primary outcomes based on scores:

```json
{
  "outcomes": [
    {
      "name": "high_fear_avoidance",
      "conditions": [
        { "tag": "fear_avoidance", "minScore": 70 }
      ]
    },
    {
      "name": "pain_education_focus",
      "conditions": [
        { "tag": "pain_catastrophizing", "minScore": 60 }
      ]
    }
  ]
}
```

## Preview Mode

Before publishing:
1. Click **Preview** in the builder
2. Complete the assessment as a patient would
3. Check question flow and logic
4. Verify scoring produces expected results

## Publishing

1. Save your assessment
2. Toggle **Published** status
3. The assessment is now available to send to patients

## Sending to Patients

### Via Assessment Invite
1. Go to **Assessments**
2. Find your assessment
3. Click **Send to Patient**
4. Enter patient email
5. Click **Send**

Patient receives email with unique link to complete the assessment.

### Via Content Bundle
Include an assessment invite when sending educational content.

## Viewing Results

1. Go to **Assessments** > **Invites** or **History**
2. Find the completed assessment
3. View:
   - Patient answers
   - Tag scores
   - Primary outcome
   - Recommended content

## Best Practices

### Question Design
- Keep questions clear and concise
- Use consistent scales (all 0-10, or all 1-5)
- Group related questions on the same page
- Limit to 15-20 questions for patient compliance

### Scoring Strategy
- Focus on 3-5 key tags
- Use evidence-based assessments where possible
- Test scoring with sample responses

### Logic Flow
- Don't over-complicate branching
- Ensure all paths lead to completion
- Test edge cases in preview

## Common Assessment Types

### Pain Assessment
Tags: `pain_intensity`, `pain_interference`, `pain_duration`

### Fear-Avoidance
Tags: `fear_movement`, `fear_reinjury`, `avoidance_behavior`

### Catastrophizing
Tags: `rumination`, `magnification`, `helplessness`

### Functional Status
Tags: `mobility`, `self_care`, `daily_activities`

## Troubleshooting

### Questions not showing
- Check conditional logic
- Verify required previous questions are answered

### Scoring not working
- Ensure question names contain tag keywords
- Check scoringConfig JSON is valid

### Patient can't access
- Verify invite was sent (check email logs)
- Confirm invite status is not "completed"
- Check patient is using correct link
