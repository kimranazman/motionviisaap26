# Cost Categorization Instructions

## Purpose

Convert raw cost item descriptions into standardized, normalized item names for comparison across suppliers.

## Rules

### 1. Remove Specifics
- Remove quantities (e.g., "50 pcs" → nothing)
- Remove unit prices (e.g., "RM 2.50 each" → nothing)
- Remove brand names unless essential for identification
- Remove colors unless it's the primary identifier (paint, fabric)
- Remove exact dimensions if approximate category works

### 2. Keep Essential Identifiers
- Product type (what it is)
- Size category when relevant (Small/Medium/Large, not exact mm)
- Material when it affects pricing significantly
- Industry-standard specifications (e.g., "M8 Bolt" not just "Bolt")

### 3. Formatting
- Title Case
- 3-6 words maximum
- No abbreviations unless industry standard
- No punctuation except hyphens for compound words

## Examples

### Good Normalizations

| Raw Description | Normalized Item |
|----------------|-----------------|
| "50 pcs M8 x 20mm Hex Bolt SS304" | "M8 Stainless Hex Bolt" |
| "DULUX Weathershield 20L White Matt" | "Exterior Wall Paint 20L" |
| "Labor: Painting 500 sqft @ RM2/sqft" | "Painting Labor" |
| "3/4 inch GI Pipe 6m length" | "GI Pipe Three-Quarter Inch" |
| "LED Downlight 7W Round Cool White" | "LED Downlight Round 7W" |
| "Cement 50kg bag ORANG KUAT brand" | "Portland Cement 50kg" |

### Bad Normalizations (Avoid)

| Raw Description | Bad Normalization | Why |
|----------------|-------------------|-----|
| "50 pcs M8 bolts" | "50 pcs Bolts" | Includes quantity |
| "Premium paint" | "Premium Quality Paint" | Vague marketing term |
| "Screw" | "Screw" | Too generic - what type? |
| "THE AMAZING BOLT THAT NEVER RUSTS" | "Amazing Non-Rusting Bolt" | Marketing language |

## Process

1. Read the cost description
2. Identify the core product/service
3. Determine essential specifications
4. Format according to rules above
5. Verify it's 3-6 words in Title Case

## Categories to Consider

- **Hardware**: Bolts, nuts, screws, nails, anchors
- **Electrical**: Cables, switches, lights, panels
- **Plumbing**: Pipes, fittings, valves, fixtures
- **Finishing**: Paint, tiles, flooring, ceiling
- **Structural**: Cement, steel, wood, concrete
- **Labor**: Installation, painting, wiring, plumbing
- **Equipment**: Tools, machinery, rentals

## Special Cases

### Bundled Items
If description contains multiple items, normalize to the primary item or use "Miscellaneous [Category]"

### Services/Labor
Always end with "Labor" or "Service" (e.g., "Electrical Installation Labor")

### Unknown Items
If cannot determine what the item is, set to null - do not guess
