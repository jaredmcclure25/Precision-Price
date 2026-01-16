# Precision Prices Analytics Scripts

Scripts for analyzing user engagement, pricing data quality, and AI prediction accuracy.

## Setup

```bash
# Install dependencies
pip install -r scripts/requirements.txt

# Authenticate with Google Cloud (if not already done)
gcloud auth application-default login
```

## Scripts

### 1. User Engagement Analysis
Analyzes DAU/MAU, feature adoption, user journey completion, and drop-off points.

```bash
python scripts/user_engagement_analysis.py
```

**Collections analyzed:** `sessions`, `activities`, `users`, `user_stats`

**Key metrics:**
- DAU (7-day active users)
- MAU (30-day active users)
- Retention rates
- Activity breakdown (analyses, uploads, feedback)
- User journey funnel
- Session duration stats

### 2. Pricing Data Quality
Identifies data quality issues and gaps in your `soldPrices` training data.

```bash
python scripts/pricing_data_quality.py
```

**Collections analyzed:** `soldPrices`, `listings`, `feedback_events`

**Key outputs:**
- Missing field percentages
- Category volume & pricing stats
- Sparse categories (need more data)
- Geographic coverage gaps
- Price distribution analysis
- Top 3 data quality priorities

### 3. AI Accuracy Validator
Compares AI predictions against actual sold prices.

```bash
python scripts/ai_accuracy_validator.py
```

**Collections analyzed:** `listings`, `listings_temp`, `feedback_events`, `soldPrices`

**Key outputs:**
- Mean Absolute Error (MAE)
- Mean Absolute Percentage Error (MAPE)
- Accuracy by category (best/worst)
- Directional bias (over vs under prediction)
- Recommendations for improvement

### 4. Data Cleanup
Identifies and optionally executes cleanup tasks.

```bash
# Dry run (see what would be changed)
python scripts/data_cleanup.py

# To execute cleanup, edit the script and set dry_run=False
```

**Tasks identified:**
- Old temp listings (>7/30 days)
- Incomplete soldPrices records
- Duplicate/rapid sessions
- Orphaned feedback events
- Pricing integrity issues

## Quick Start

Run all analyses:
```bash
cd /Users/ericalmlowe/Desktop/precision-prices
pip install -r scripts/requirements.txt
python scripts/user_engagement_analysis.py
python scripts/pricing_data_quality.py
python scripts/ai_accuracy_validator.py
python scripts/data_cleanup.py
```

## Notes

- Scripts use your Firebase project credentials from `gcloud auth`
- All scripts are read-only except `data_cleanup.py` when `dry_run=False`
- Output is printed to console; redirect to file if needed: `python script.py > output.txt`
