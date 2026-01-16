# pricing_data_quality.py
"""
Precision Prices - Pricing Data Quality Analysis

Analyzes soldPrices collection to identify:
- Data quality issues (missing fields, invalid values)
- Pricing patterns by category/condition/location
- Data gaps needing more training data
- Opportunities for AI improvement

Your soldPrices schema:
{
    itemName: string
    category: string
    condition: string
    actualSoldPrice: number
    daysToSell: number
    timestamp: timestamp
    location: {
        parsed: {
            city: string
            state: string
            metro: string
        }
    }
}

Run: python scripts/pricing_data_quality.py
"""

from google.cloud import firestore
from datetime import datetime, timedelta
from collections import defaultdict
import pandas as pd
import numpy as np

db = firestore.Client()


def analyze_pricing_data():
    """Main pricing data quality analysis."""

    print("Fetching data from Firestore...")

    sold_prices = list(db.collection('soldPrices').stream())
    listings = list(db.collection('listings').stream())
    feedback_events = list(db.collection('feedback_events').stream())

    now = datetime.now()
    ninety_days_ago = now - timedelta(days=90)

    print(f"\n{'='*60}")
    print("PRICING DATA QUALITY REPORT - Precision Prices")
    print(f"{'='*60}")
    print(f"Report Generated: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\nTotal Sold Prices Records: {len(sold_prices)}")
    print(f"Total Listings: {len(listings)}")
    print(f"Total Feedback Events: {len(feedback_events)}")

    # ===========================================
    # DATA QUALITY CHECKS
    # ===========================================
    quality_issues = {
        'missing_price': 0,
        'missing_category': 0,
        'missing_condition': 0,
        'missing_item_name': 0,
        'missing_location': 0,
        'missing_timestamp': 0,
        'invalid_price_zero_negative': 0,
        'invalid_price_too_high': 0,  # > $50,000 seems suspicious
        'missing_days_to_sell': 0,
        'invalid_days_to_sell': 0,  # > 365 or negative
    }

    # Data aggregations
    category_data = defaultdict(list)
    condition_breakdown = defaultdict(int)
    metro_breakdown = defaultdict(int)
    state_breakdown = defaultdict(int)
    recent_count = 0
    historical_count = 0

    all_records = []

    for doc in sold_prices:
        data = doc.to_dict()
        record = {'doc_id': doc.id}

        # Price validation
        price = data.get('actualSoldPrice')
        if price is None:
            quality_issues['missing_price'] += 1
            record['price'] = None
        elif price <= 0:
            quality_issues['invalid_price_zero_negative'] += 1
            record['price'] = price
        elif price > 50000:
            quality_issues['invalid_price_too_high'] += 1
            record['price'] = price
        else:
            record['price'] = price

        # Category validation
        category = data.get('category')
        if not category:
            quality_issues['missing_category'] += 1
            record['category'] = 'unknown'
        else:
            record['category'] = category
            if record['price'] and record['price'] > 0:
                category_data[category].append(record['price'])

        # Condition validation
        condition = data.get('condition')
        if not condition:
            quality_issues['missing_condition'] += 1
            record['condition'] = 'unknown'
        else:
            record['condition'] = condition
            condition_breakdown[condition] += 1

        # Item name validation
        if not data.get('itemName'):
            quality_issues['missing_item_name'] += 1

        # Location validation (nested structure)
        location = data.get('location', {})
        parsed = location.get('parsed', {}) if isinstance(location, dict) else {}
        metro = parsed.get('metro')
        state = parsed.get('state')
        city = parsed.get('city')

        if not (metro or state or city):
            quality_issues['missing_location'] += 1
        else:
            if metro:
                metro_breakdown[metro] += 1
            if state:
                state_breakdown[state] += 1

        record['metro'] = metro
        record['state'] = state
        record['city'] = city

        # Timestamp validation
        timestamp = data.get('timestamp')
        if not timestamp:
            quality_issues['missing_timestamp'] += 1
            record['timestamp'] = None
        else:
            if hasattr(timestamp, 'timestamp'):
                ts_dt = datetime.fromtimestamp(timestamp.timestamp())
            else:
                ts_dt = timestamp
            record['timestamp'] = ts_dt

            if ts_dt > ninety_days_ago:
                recent_count += 1
            else:
                historical_count += 1

        # Days to sell validation
        days_to_sell = data.get('daysToSell')
        if days_to_sell is None:
            quality_issues['missing_days_to_sell'] += 1
            record['days_to_sell'] = None
        elif days_to_sell < 0 or days_to_sell > 365:
            quality_issues['invalid_days_to_sell'] += 1
            record['days_to_sell'] = days_to_sell
        else:
            record['days_to_sell'] = days_to_sell

        all_records.append(record)

    # ===========================================
    # QUALITY ISSUES SUMMARY
    # ===========================================
    print(f"\n{'='*60}")
    print("DATA QUALITY ISSUES")
    print(f"{'='*60}")

    total_records = len(sold_prices) if sold_prices else 1
    critical_issues = []
    warning_issues = []

    for issue, count in sorted(quality_issues.items(), key=lambda x: x[1], reverse=True):
        pct = count / total_records * 100
        severity = "🔴" if pct > 20 else "🟡" if pct > 5 else "🟢"
        print(f"{severity} {issue}: {count} ({pct:.1f}%)")

        if pct > 20:
            critical_issues.append((issue, count, pct))
        elif pct > 5:
            warning_issues.append((issue, count, pct))

    # ===========================================
    # DATA FRESHNESS
    # ===========================================
    print(f"\n{'='*60}")
    print("DATA FRESHNESS")
    print(f"{'='*60}")
    print(f"Recent data (last 90 days): {recent_count} ({recent_count/total_records*100:.1f}%)")
    print(f"Historical data (>90 days): {historical_count} ({historical_count/total_records*100:.1f}%)")

    if recent_count < total_records * 0.5:
        print("⚠️  WARNING: Less than 50% of data is recent. AI predictions may be outdated.")

    # ===========================================
    # CATEGORY ANALYSIS
    # ===========================================
    print(f"\n{'='*60}")
    print("TOP CATEGORIES BY VOLUME")
    print(f"{'='*60}")

    top_categories = sorted(category_data.items(), key=lambda x: len(x[1]), reverse=True)[:15]
    for cat, prices in top_categories:
        if prices:
            avg = sum(prices) / len(prices)
            median = sorted(prices)[len(prices)//2]
            min_p = min(prices)
            max_p = max(prices)
            print(f"  {cat}: {len(prices)} items | Avg: ${avg:.2f} | Med: ${median:.2f} | Range: ${min_p:.2f}-${max_p:.2f}")

    # ===========================================
    # DATA GAPS (Sparse Categories)
    # ===========================================
    print(f"\n{'='*60}")
    print("DATA GAPS - Categories Needing More Data")
    print(f"{'='*60}")

    # Categories with < 10 samples can't reliably inform pricing
    sparse_categories = [(cat, len(prices)) for cat, prices in category_data.items() if len(prices) < 10]
    sparse_categories.sort(key=lambda x: x[1], reverse=True)

    print(f"Categories with <10 samples: {len(sparse_categories)}")
    print("\nThese categories need more training data:")
    for cat, count in sparse_categories[:20]:
        print(f"  - {cat}: only {count} samples")

    # ===========================================
    # CONDITION BREAKDOWN
    # ===========================================
    print(f"\n{'='*60}")
    print("CONDITION BREAKDOWN")
    print(f"{'='*60}")

    # Your conditions: excellent, good, fair, poor
    expected_conditions = ['excellent', 'good', 'fair', 'poor']
    for condition in expected_conditions:
        count = condition_breakdown.get(condition, 0)
        pct = count / total_records * 100 if total_records else 0
        print(f"  {condition}: {count} ({pct:.1f}%)")

    # Check for unexpected conditions
    unexpected = [c for c in condition_breakdown.keys() if c not in expected_conditions]
    if unexpected:
        print(f"\n⚠️  Unexpected condition values found: {unexpected}")
        for cond in unexpected:
            print(f"     - '{cond}': {condition_breakdown[cond]} records")

    # ===========================================
    # GEOGRAPHIC COVERAGE
    # ===========================================
    print(f"\n{'='*60}")
    print("GEOGRAPHIC COVERAGE")
    print(f"{'='*60}")

    print(f"\nTop 10 Metro Areas:")
    top_metros = sorted(metro_breakdown.items(), key=lambda x: x[1], reverse=True)[:10]
    for metro, count in top_metros:
        pct = count / total_records * 100
        print(f"  {metro}: {count} ({pct:.1f}%)")

    print(f"\nTop 10 States:")
    top_states = sorted(state_breakdown.items(), key=lambda x: x[1], reverse=True)[:10]
    for state, count in top_states:
        pct = count / total_records * 100
        print(f"  {state}: {count} ({pct:.1f}%)")

    # Geographic gaps
    states_with_data = set(state_breakdown.keys())
    all_states = {'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
                  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'}
    missing_states = all_states - states_with_data
    if missing_states:
        print(f"\n⚠️  States with NO data: {', '.join(sorted(missing_states))}")

    # ===========================================
    # PRICE DISTRIBUTION ANALYSIS
    # ===========================================
    df = pd.DataFrame(all_records)

    if not df.empty and df['price'].notna().any():
        valid_prices = df[df['price'].notna() & (df['price'] > 0) & (df['price'] <= 50000)]['price']

        print(f"\n{'='*60}")
        print("PRICE DISTRIBUTION")
        print(f"{'='*60}")
        print(f"Valid price records: {len(valid_prices)}")
        print(f"Mean price: ${valid_prices.mean():.2f}")
        print(f"Median price: ${valid_prices.median():.2f}")
        print(f"Std deviation: ${valid_prices.std():.2f}")
        print(f"Min: ${valid_prices.min():.2f}")
        print(f"Max: ${valid_prices.max():.2f}")

        # Price buckets
        print(f"\nPrice Buckets:")
        buckets = [0, 25, 50, 100, 250, 500, 1000, 5000, float('inf')]
        bucket_labels = ['$0-25', '$25-50', '$50-100', '$100-250', '$250-500', '$500-1K', '$1K-5K', '$5K+']
        for i in range(len(buckets)-1):
            count = len(valid_prices[(valid_prices > buckets[i]) & (valid_prices <= buckets[i+1])])
            pct = count / len(valid_prices) * 100
            print(f"  {bucket_labels[i]}: {count} ({pct:.1f}%)")

    # ===========================================
    # DAYS TO SELL ANALYSIS
    # ===========================================
    if not df.empty and df['days_to_sell'].notna().any():
        valid_days = df[(df['days_to_sell'].notna()) & (df['days_to_sell'] >= 0) & (df['days_to_sell'] <= 365)]['days_to_sell']

        print(f"\n{'='*60}")
        print("DAYS TO SELL ANALYSIS")
        print(f"{'='*60}")
        print(f"Records with valid days_to_sell: {len(valid_days)}")
        print(f"Average days to sell: {valid_days.mean():.1f}")
        print(f"Median days to sell: {valid_days.median():.1f}")

        # Quick sell vs slow sell
        quick_sell = len(valid_days[valid_days <= 3])
        week_sell = len(valid_days[(valid_days > 3) & (valid_days <= 7)])
        month_sell = len(valid_days[(valid_days > 7) & (valid_days <= 30)])
        slow_sell = len(valid_days[valid_days > 30])

        print(f"\n  Quick (≤3 days): {quick_sell} ({quick_sell/len(valid_days)*100:.1f}%)")
        print(f"  Week (4-7 days): {week_sell} ({week_sell/len(valid_days)*100:.1f}%)")
        print(f"  Month (8-30 days): {month_sell} ({month_sell/len(valid_days)*100:.1f}%)")
        print(f"  Slow (>30 days): {slow_sell} ({slow_sell/len(valid_days)*100:.1f}%)")

    # ===========================================
    # RECOMMENDATIONS
    # ===========================================
    print(f"\n{'='*60}")
    print("TOP 3 DATA QUALITY PRIORITIES")
    print(f"{'='*60}")

    priorities = []

    if quality_issues['missing_category'] / total_records > 0.1:
        priorities.append({
            'issue': 'Missing Categories',
            'impact': 'HIGH - Categories are essential for pricing comparisons',
            'fix': 'Retroactively classify items OR require category on new submissions',
            'records_affected': quality_issues['missing_category']
        })

    if quality_issues['missing_condition'] / total_records > 0.1:
        priorities.append({
            'issue': 'Missing Condition',
            'impact': 'HIGH - Condition dramatically affects price (up to 50% variance)',
            'fix': 'Add condition inference from item descriptions OR require on submission',
            'records_affected': quality_issues['missing_condition']
        })

    if quality_issues['missing_location'] / total_records > 0.1:
        priorities.append({
            'issue': 'Missing Location',
            'impact': 'MEDIUM - Location affects prices by 15-35% based on your multipliers',
            'fix': 'Request location from users OR infer from IP/timezone',
            'records_affected': quality_issues['missing_location']
        })

    if recent_count < total_records * 0.3:
        priorities.append({
            'issue': 'Stale Data',
            'impact': 'HIGH - Less than 30% recent data may give outdated prices',
            'fix': 'Incentivize users to report actual sale outcomes',
            'records_affected': historical_count
        })

    if len(sparse_categories) > len(category_data) * 0.5:
        priorities.append({
            'issue': 'Sparse Category Coverage',
            'impact': 'MEDIUM - AI relies more on general knowledge for these categories',
            'fix': 'Focus data collection on high-value sparse categories',
            'records_affected': sum(c[1] for c in sparse_categories)
        })

    # Sort by impact and show top 3
    for i, priority in enumerate(priorities[:3], 1):
        print(f"\n{i}. {priority['issue']}")
        print(f"   Impact: {priority['impact']}")
        print(f"   Records Affected: {priority['records_affected']}")
        print(f"   Recommended Fix: {priority['fix']}")

    if not priorities:
        print("✅ Data quality looks good! Focus on growing your dataset.")

    print(f"\n{'='*60}")

    return {
        'quality_issues': quality_issues,
        'total_records': total_records,
        'category_counts': {k: len(v) for k, v in category_data.items()},
        'sparse_categories': sparse_categories,
        'recent_data_pct': recent_count / total_records * 100 if total_records else 0,
        'top_metros': top_metros[:5],
        'priorities': priorities[:3]
    }


if __name__ == "__main__":
    results = analyze_pricing_data()
