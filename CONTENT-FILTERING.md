# Content Filtering System

## Smart Context-Aware Detection

Our content filtering system uses an **allowlist-first approach** with context-aware pattern matching to minimize false positives while protecting against inappropriate content.

## How It Works

### 1. Allowlist First (Explicit Approval)
The system first checks if an item matches legitimate marketplace product patterns:

```javascript
✅ ALLOWED Examples:
- "baby shoes" → Baby product
- "kids clothes" → Children's clothing
- "baby monitor" → Baby electronics
- "vintage knife collection" → Collectible
- "antique sword" → Historical item
- "replica gun" → Prop/display item
- "vitamin supplements" → Health product
- "protein powder" → Dietary supplement
```

### 2. Then Check Prohibited Patterns
Only if not allowlisted, check for problematic content:

```javascript
❌ BLOCKED Examples:
- "photo of my baby" → Image OF a person
- "selfie" → Photo of person
- "family portrait" → Image of people
- "loaded gun for sale" → Active weapon
- "functional firearm" → Working weapon
- "cocaine" → Illegal drug
- "heroin" → Illegal drug
- "stolen iPhone" → Illegal item
- "fake Rolex" → Counterfeit
```

## Categories

### ✅ Always Allowed
- **Baby/Kids Products**: Shoes, clothes, toys, monitors, cribs, strollers
- **Collectibles**: Vintage knives, antique swords, military memorabilia, replicas
- **Health Products**: Vitamins, supplements, protein powder, OTC medications
- **Kitchen Items**: Knife sets, chef knives, cooking tools
- **Toys**: Toy guns, play weapons, action figures

### ❌ Always Blocked

#### 1. Images OF People
**Why**: Privacy, child safety, human trafficking concerns
- Selfies, portraits, headshots
- "Photo of my child/baby/kid"
- Family photos, wedding photos
- Any image with a person visible

#### 2. Illegal Drugs
**Why**: Federal law, controlled substances
- Cocaine, heroin, meth, fentanyl
- LSD, ecstasy, MDMA
- Prescription pills "for sale"
- Marijuana/cannabis "for sale"

#### 3. Active Weapons
**Why**: Safety, legal compliance, potential violence
- "Loaded gun", "functional firearm"
- Live ammunition
- Bombs, explosives, grenades
- "Unlicensed" or "illegal" weapons

**Note**: Collectibles explicitly allowed via allowlist

#### 4. Adult/Explicit Content
**Why**: Platform integrity, age restrictions
- Pornography, explicit content
- Sex toys, adult toys
- NSFW, XXX content
- Nude photos, sexual content

#### 5. Illegal Items
**Why**: Legal compliance, fraud prevention
- Stolen goods
- Counterfeit designer items
- Fake IDs, forged documents
- Cracked/pirated software
- Credit cards, bank credentials

#### 6. Body Parts/Fluids
**Why**: Federal law, human dignity
- Human organs for sale
- Blood, tissue, plasma
- Human remains

#### 7. Protected Animals
**Why**: International treaties, conservation
- Ivory, elephant tusks
- Rhino horn, tiger skin
- Endangered species parts

## Technical Implementation

### Allowlist Patterns (Checked First)
```javascript
LEGITIMATE_PATTERNS = [
  'baby shoes', 'kids shoes', 'baby clothes',
  'vintage knife', 'antique sword', 'knife collection',
  'replica gun', 'toy gun', 'prop weapon',
  'vitamin', 'supplement', 'baby formula'
]
```

### Prohibited Triggers (Checked Second)
```javascript
PROHIBITED_PATTERNS = {
  peopleInPhotos: ['photo of child', 'selfie', 'portrait'],
  illegalDrugs: ['cocaine', 'heroin', 'weed for sale'],
  activeWeapons: ['loaded gun', 'live ammo', 'working firearm'],
  // ... etc
}
```

### Example Flow

```
Input: "vintage knife collection"
  ↓
Check Allowlist: "knife collection" FOUND
  ↓
Result: ✅ ALLOWED (explicitly allowlisted)
  ↓
Log: "✅ Allowlisted item detected: knife collection"
```

```
Input: "loaded gun for sale"
  ↓
Check Allowlist: No match found
  ↓
Check Prohibited: "loaded gun" FOUND in activeWeapons
  ↓
Result: ❌ BLOCKED
  ↓
Return: "We cannot provide pricing for active weapons or ammunition."
  ↓
Log: "🚫 Blocked prohibited content: activeWeapons - loaded gun"
```

## User-Facing Messages

When content is blocked, users see clear, helpful messages:

```
⚠️ We cannot analyze photos of people.
Please upload images of physical items only.

Precision Prices is designed for legitimate marketplace
items only. Please try a different item.
```

## Backend Logging

Server console shows real-time filtering:

```bash
✅ Allowlisted item detected: "baby shoes"
🚫 Blocked prohibited content: peopleInPhotos - "selfie"
✅ Allowlisted item detected: "vintage knife"
🚫 Blocked prohibited content: illegalDrugs - "cocaine"
```

## Why This Approach?

1. **Minimize False Positives**: "Baby shoes" is a $10B market - shouldn't be blocked
2. **Context Matters**: "Knife" in "kitchen knife" ≠ "knife" in "loaded knife attack"
3. **Legitimate Commerce**: Collectibles, antiques, vitamins are valid marketplace items
4. **Clear Intent Focus**: Block actual harmful content, not everyday products
5. **User Experience**: Fewer frustrated users from over-blocking

## Maintenance

To add new allowed patterns:
1. Add to `LEGITIMATE_PATTERNS` array in server.js
2. Test with example item names
3. Deploy

To add new prohibited triggers:
1. Add to relevant category in `PROHIBITED_PATTERNS`
2. Use specific phrases (not single words)
3. Test for false positives against allowlist
4. Deploy
