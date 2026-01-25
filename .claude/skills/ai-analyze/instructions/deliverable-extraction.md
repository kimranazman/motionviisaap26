# Deliverable Extraction Instructions

## Purpose

Extract structured deliverables from quotation documents, particularly for Talenta/Motionvii video production projects.

## Context

SAAP tracks deliverables for video production projects. Quotes typically list:
- Video outputs (formats, durations)
- Production services included
- Revision rounds
- Additional services

## Fields to Extract

### Per Deliverable
- **Title**: Short name (e.g., "Main Video 30s")
- **Description**: Detailed description
- **Value/Price**: Amount for this deliverable
- **Type**: video, service, revision, other
- **Quantity**: Number of units (default 1)

### Quote Metadata
- **Quote Number**: Reference number
- **Quote Date**: Date issued
- **Valid Until**: Expiry date
- **Client Name**: Who quote is for
- **Project Title**: Project name
- **Total Value**: Grand total

## Talenta/Motionvii Format

Common deliverable patterns:

### Video Outputs
- "1x Main Video (60 seconds)"
- "2x Social Media Cut (15s each)"
- "1x Teaser (10s)"

### Production Services
- "Pre-production (concept, storyboard)"
- "Production (1 day shoot)"
- "Post-production (editing, color)"

### Additional Services
- "2 rounds of revision"
- "Motion graphics"
- "Voice-over recording"
- "Music licensing"

## Parsing Rules

### Duration Extraction
Convert to seconds:
- "30s" → 30
- "1 minute" → 60
- "1:30" → 90

### Quantity Patterns
- "2x Video" → quantity: 2
- "Video (x3)" → quantity: 3
- "3 videos" → quantity: 3

### Bundle Detection
If line contains multiple items, split into separate deliverables:
- "2x 30s + 1x 60s video" → 2 deliverables

## Deliverable Types

### video
- Main video, TVC, corporate video
- Social media cuts
- Teasers, trailers

### service
- Pre-production
- Production/shooting
- Post-production
- Specific services (color grading, sound mixing)

### revision
- Revision rounds
- Amendments
- Re-edits

### other
- Equipment rental
- Talent/actor fees
- Location fees
- Licensing

## Output Format

```json
{
  "quote": {
    "number": "QT-2024-001",
    "date": "2024-03-15",
    "validUntil": "2024-04-15",
    "client": "Company ABC",
    "projectTitle": "Brand Campaign 2024",
    "totalValue": 25000.00,
    "currency": "MYR"
  },
  "deliverables": [
    {
      "title": "Main Video 60s",
      "description": "Hero video for social media campaign",
      "value": 15000.00,
      "type": "video",
      "quantity": 1,
      "duration": 60
    },
    {
      "title": "Social Media Cuts",
      "description": "15-second cuts for Instagram/TikTok",
      "value": 5000.00,
      "type": "video",
      "quantity": 3,
      "duration": 15
    },
    {
      "title": "Revision Rounds",
      "description": "2 rounds of revision included",
      "value": 0,
      "type": "revision",
      "quantity": 2
    }
  ]
}
```

## Validation Rules

1. Sum of deliverable values should approximately match total
2. Video deliverables should have duration
3. Quantities should be positive integers
4. At least one deliverable should be extracted
5. Title should be concise (max 50 chars)

## Edge Cases

### Bundled Pricing
If price not shown per item:
- Set individual values to 0 or null
- Note "bundled pricing" in description

### Conditional Items
Items marked as optional or additional:
- Flag as optional
- Include in extraction but mark clearly

### Multi-Phase Projects
If quote has phases:
- Extract each phase as context
- Link deliverables to phases
