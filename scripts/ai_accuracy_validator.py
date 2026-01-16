# ai_accuracy_validator.py
"""
Precision Prices - AI Prediction Accuracy Validator

Compares AI price predictions against actual sold prices to:
- Calculate prediction accuracy (MAPE, MAE)
- Identify worst/best performing categories
- Find systematic over/under-pricing patterns
- Recommend categories needing more training data

Data sources:
- listings: contains pricingStrategy.listingPrice (AI prediction)
- feedback_events: contains actual sale prices from transaction outcomes
- listings_temp: contains outcome data with actualPrice
- soldPrices: historical sold prices for comparison

Run: python scripts/ai_accuracy_validator.py
"""

from google.cloud import firestore
from datetime import datetime, timedelta
from collections import defaultdict
import pandas as pd
import numpy as np

db = firestore.Client()


def validate_ai_predictions():
    """Main AI accuracy validation function."""

    print("Fetching data from Firestore...")

    listings = list(db.collection('listings').stream())
    listings_temp = list(db.collection('listings_temp').stream())
    feedback_events = list(db.collection('feedback_events').stream())
    sold_prices = list(db.collection('soldPrices').stream())

    now = datetime.now()

    print(f"\n{'='*60}")
    print("AI PREDICTION ACCURACY REPORT - Precision Prices")
    print(f"{'='*60}")
    print(f"Report Generated: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\nTotal Listings: {len(listings)}")
    print(f"Total Temp Listings: {len(listings_temp)}")
    print(f"Total Feedback Events: {len(feedback_events)}")
    print(f"Total Sold Prices Records: {len(sold_prices)}")

    # ===========================================
    # METHOD 1: Match listings with feedback outcomes
    # ===========================================
    print(f"\n{'='*60}")
    print("METHOD 1: Listings with Transaction Outcomes")
    print(f"{'='*60}")

    # Build lookup for listings by various IDs
    listings_by_id = {}
    for listing in listings:
        data = listing.to_dict()
        listings_by_id[listing.id] = data
        # Also index by custom ID field if present
        if data.get('id'):
            listings_by_id[data['id']] = data

    matches = []

    # Check feedback_events for price_accuracy and actual prices
    for feedback in feedback_events:
        data = feedback.to_dict()
        listing_id = data.get('listingId')
        purpose = data.get('purpose')
        stage = data.get('stage')
        value = data.get('value')
        metadata = data.get('metadata', {})

        # Look for transaction outcome feedback
        if stage in ['sold', 'SOLD'] and listing_id:
            listing_data = listings_by_id.get(listing_id)
            if listing_data:
                # Get AI predicted price
                pricing_strategy = listing_data.get('pricingStrategy', {})
                ai_price = pricing_strategy.get('listingPrice') or pricing_strategy.get('optimal')

                # Get actual price from feedback or metadata
                actual_price = None
                if isinstance(value, dict):
                    actual_price = value.get('actualPrice') or value.get('soldPrice')
                elif metadata:
                    actual_price = metadata.get('actualPrice') or metadata.get('soldPrice')

                if ai_price and actual_price and ai_price > 0 and actual_price > 0:
                    error = actual_price - ai_price
                    abs_error = abs(error)
                    pct_error = (abs_error / actual_price) * 100
                    direction = 'over' if ai_price > actual_price else 'under' if ai_price < actual_price else 'exact'

                    item_id = listing_data.get('itemIdentification', {})
                    matches.append({
                        'listing_id': listing_id,
                        'category': item_id.get('category') or listing_data.get('category', 'unknown'),
                        'condition': item_id.get('observedCondition') or listing_data.get('condition', 'unknown'),
                        'item_name': item_id.get('name') or listing_data.get('itemName', ''),
                        'ai_price': ai_price,
                        'actual_price': actual_price,
                        'error': error,
                        'abs_error': abs_error,
                        'pct_error': pct_error,
                        'direction': direction,
                    })

    # ===========================================
    # METHOD 2: Check listings_temp for outcomes
    # ===========================================
    print(f"\n{'='*60}")
    print("METHOD 2: Temp Listings with Outcomes")
    print(f"{'='*60}")

    for temp_listing in listings_temp:
        data = temp_listing.to_dict()

        if data.get('wasSold') and data.get('actualPrice'):
            actual_price = data['actualPrice']

            # Try to find corresponding listing for AI price
            session_id = data.get('sessionId')
            item_name = data.get('itemName', '')

            # Look for listing with same item name (approximate match)
            ai_price = None
            category = 'unknown'
            condition = 'unknown'

            for lid, ldata in listings_by_id.items():
                l_item = ldata.get('itemIdentification', {})
                l_name = l_item.get('name') or ldata.get('itemName', '')

                if l_name and item_name and l_name.lower() == item_name.lower():
                    pricing = ldata.get('pricingStrategy', {})
                    ai_price = pricing.get('listingPrice') or pricing.get('optimal')
                    category = l_item.get('category') or 'unknown'
                    condition = l_item.get('observedCondition') or 'unknown'
                    break

            if ai_price and actual_price and ai_price > 0 and actual_price > 0:
                error = actual_price - ai_price
                abs_error = abs(error)
                pct_error = (abs_error / actual_price) * 100
                direction = 'over' if ai_price > actual_price else 'under' if ai_price < actual_price else 'exact'

                matches.append({
                    'listing_id': temp_listing.id,
                    'category': category,
                    'condition': condition,
                    'item_name': item_name,
                    'ai_price': ai_price,
                    'actual_price': actual_price,
                    'error': error,
                    'abs_error': abs_error,
                    'pct_error': pct_error,
                    'direction': direction,
                    'days_to_sell': data.get('daysToSell'),
                })

    # ===========================================
    # RESULTS ANALYSIS
    # ===========================================
    if not matches:
        print(f"\n{'='*60}")
        print("⚠️  NO MATCHED PREDICTIONS FOUND")
        print(f"{'='*60}")
        print("""
To validate AI accuracy, you need listings that have both:
1. An AI predicted price (pricingStrategy.listingPrice)
2. An actual sold price (from feedback_events or listings_temp)

RECOMMENDATIONS TO COLLECT THIS DATA:
1. Prompt users to report when they sell an item
2. Add "Did you sell it? At what price?" follow-up
3. Incentivize outcome reporting (badges, features)
4. Track listings_temp through the full sale lifecycle
        """)

        # Show what data you DO have
        print(f"\nCurrent data available:")
        listings_with_ai_price = 0
        for listing in listings:
            data = listing.to_dict()
            pricing = data.get('pricingStrategy', {})
            if pricing.get('listingPrice') or pricing.get('optimal'):
                listings_with_ai_price += 1
        print(f"  - Listings with AI prices: {listings_with_ai_price}")

        sold_feedback = sum(1 for f in feedback_events if f.to_dict().get('stage') in ['sold', 'SOLD'])
        print(f"  - Feedback events marked 'sold': {sold_feedback}")

        sold_temp = sum(1 for t in listings_temp if t.to_dict().get('wasSold'))
        print(f"  - Temp listings marked 'sold': {sold_temp}")

        return {'matches': 0, 'message': 'No matched predictions found'}

    # Convert to DataFrame for analysis
    df = pd.DataFrame(matches)

    print(f"\n{'='*60}")
    print("OVERALL ACCURACY METRICS")
    print(f"{'='*60}")
    print(f"Total validated predictions: {len(df)}")

    # Key metrics
    mae = df['abs_error'].mean()
    mape = df['pct_error'].mean()
    median_pct_error = df['pct_error'].median()

    print(f"\nMean Absolute Error (MAE): ${mae:.2f}")
    print(f"Mean Absolute Percentage Error (MAPE): {mape:.1f}%")
    print(f"Median Percentage Error: {median_pct_error:.1f}%")

    # Accuracy buckets
    within_10 = len(df[df['pct_error'] <= 10])
    within_20 = len(df[df['pct_error'] <= 20])
    within_30 = len(df[df['pct_error'] <= 30])

    print(f"\nAccuracy Distribution:")
    print(f"  Within 10%: {within_10} ({within_10/len(df)*100:.1f}%) - EXCELLENT")
    print(f"  Within 20%: {within_20} ({within_20/len(df)*100:.1f}%) - GOOD")
    print(f"  Within 30%: {within_30} ({within_30/len(df)*100:.1f}%) - ACCEPTABLE")
    print(f"  Over 30%: {len(df) - within_30} ({(len(df)-within_30)/len(df)*100:.1f}%) - NEEDS IMPROVEMENT")

    # Directional bias
    over_predictions = len(df[df['direction'] == 'over'])
    under_predictions = len(df[df['direction'] == 'under'])
    exact_predictions = len(df[df['direction'] == 'exact'])

    print(f"\nDirectional Bias:")
    print(f"  Over-predicted (AI > Actual): {over_predictions} ({over_predictions/len(df)*100:.1f}%)")
    print(f"  Under-predicted (AI < Actual): {under_predictions} ({under_predictions/len(df)*100:.1f}%)")
    print(f"  Exact: {exact_predictions}")

    avg_over = df[df['direction'] == 'over']['error'].mean() if over_predictions else 0
    avg_under = df[df['direction'] == 'under']['error'].mean() if under_predictions else 0
    print(f"  Avg over-prediction: ${abs(avg_over):.2f}")
    print(f"  Avg under-prediction: ${abs(avg_under):.2f}")

    # ===========================================
    # CATEGORY ANALYSIS
    # ===========================================
    print(f"\n{'='*60}")
    print("WORST PERFORMING CATEGORIES (Need More Training Data)")
    print(f"{'='*60}")

    category_stats = df.groupby('category').agg({
        'pct_error': ['mean', 'median', 'count'],
        'error': 'mean',
        'abs_error': 'mean'
    }).round(2)

    category_stats.columns = ['avg_pct_error', 'median_pct_error', 'count', 'avg_error', 'avg_abs_error']
    category_stats = category_stats[category_stats['count'] >= 2]  # Min 2 samples

    if not category_stats.empty:
        worst = category_stats.nlargest(10, 'avg_pct_error')
        print("\nCategories with highest prediction error:")
        for cat, row in worst.iterrows():
            direction = "OVER" if row['avg_error'] < 0 else "UNDER"
            print(f"  {cat}:")
            print(f"    - Avg error: {row['avg_pct_error']:.1f}% ({direction}-predicted)")
            print(f"    - Samples: {int(row['count'])}")
            print(f"    - Avg $ off: ${row['avg_abs_error']:.2f}")

        print(f"\n{'='*60}")
        print("BEST PERFORMING CATEGORIES (AI is accurate)")
        print(f"{'='*60}")

        best = category_stats.nsmallest(10, 'avg_pct_error')
        print("\nCategories with lowest prediction error:")
        for cat, row in best.iterrows():
            print(f"  {cat}: {row['avg_pct_error']:.1f}% avg error ({int(row['count'])} samples)")

    # ===========================================
    # CONDITION ANALYSIS
    # ===========================================
    print(f"\n{'='*60}")
    print("ACCURACY BY CONDITION")
    print(f"{'='*60}")

    condition_stats = df.groupby('condition').agg({
        'pct_error': ['mean', 'count'],
        'error': 'mean'
    }).round(2)

    condition_stats.columns = ['avg_pct_error', 'count', 'avg_error']

    for cond, row in condition_stats.iterrows():
        direction = "over" if row['avg_error'] < 0 else "under"
        print(f"  {cond}: {row['avg_pct_error']:.1f}% avg error (tends to {direction}-predict), {int(row['count'])} samples")

    # ===========================================
    # PRICE RANGE ANALYSIS
    # ===========================================
    print(f"\n{'='*60}")
    print("ACCURACY BY PRICE RANGE")
    print(f"{'='*60}")

    df['price_bucket'] = pd.cut(df['actual_price'],
                                 bins=[0, 25, 50, 100, 250, 500, 1000, float('inf')],
                                 labels=['$0-25', '$25-50', '$50-100', '$100-250', '$250-500', '$500-1K', '$1K+'])

    price_stats = df.groupby('price_bucket').agg({
        'pct_error': ['mean', 'count'],
        'error': 'mean'
    }).round(2)

    price_stats.columns = ['avg_pct_error', 'count', 'avg_error']

    for bucket, row in price_stats.iterrows():
        if pd.notna(bucket) and row['count'] > 0:
            direction = "over" if row['avg_error'] < 0 else "under"
            print(f"  {bucket}: {row['avg_pct_error']:.1f}% avg error ({direction}), {int(row['count'])} samples")

    # ===========================================
    # DAYS TO SELL CORRELATION
    # ===========================================
    if 'days_to_sell' in df.columns and df['days_to_sell'].notna().any():
        print(f"\n{'='*60}")
        print("PRICING ACCURACY VS TIME TO SELL")
        print(f"{'='*60}")

        df_with_days = df[df['days_to_sell'].notna()]
        if len(df_with_days) > 0:
            # Items that sold quickly vs slowly
            quick = df_with_days[df_with_days['days_to_sell'] <= 3]
            medium = df_with_days[(df_with_days['days_to_sell'] > 3) & (df_with_days['days_to_sell'] <= 14)]
            slow = df_with_days[df_with_days['days_to_sell'] > 14]

            if len(quick) > 0:
                print(f"  Quick sells (≤3 days): {quick['pct_error'].mean():.1f}% avg error")
            if len(medium) > 0:
                print(f"  Medium sells (4-14 days): {medium['pct_error'].mean():.1f}% avg error")
            if len(slow) > 0:
                print(f"  Slow sells (>14 days): {slow['pct_error'].mean():.1f}% avg error")

            # Correlation
            correlation = df_with_days['pct_error'].corr(df_with_days['days_to_sell'])
            print(f"\n  Correlation (error vs days to sell): {correlation:.2f}")
            if correlation > 0.3:
                print("  ↳ Positive correlation: Higher errors correlate with longer sell times")
                print("    (Possible over-pricing when predictions are off)")

    # ===========================================
    # SPECIFIC IMPROVEMENT RECOMMENDATIONS
    # ===========================================
    print(f"\n{'='*60}")
    print("RECOMMENDATIONS FOR AI IMPROVEMENT")
    print(f"{'='*60}")

    recommendations = []

    # Check for systematic bias
    if over_predictions > under_predictions * 1.5:
        recommendations.append({
            'issue': 'Systematic Over-Prediction',
            'detail': f'AI over-predicts {over_predictions/len(df)*100:.0f}% of the time',
            'fix': 'Consider applying a global correction factor or adjusting confidence in historical high prices'
        })
    elif under_predictions > over_predictions * 1.5:
        recommendations.append({
            'issue': 'Systematic Under-Prediction',
            'detail': f'AI under-predicts {under_predictions/len(df)*100:.0f}% of the time',
            'fix': 'Users may be getting better prices than predicted. Consider adjusting for market conditions.'
        })

    # Check for category-specific issues
    if not category_stats.empty:
        worst_cat = category_stats.nlargest(1, 'avg_pct_error')
        if worst_cat['avg_pct_error'].iloc[0] > 30:
            cat_name = worst_cat.index[0]
            recommendations.append({
                'issue': f'High Error in "{cat_name}" Category',
                'detail': f'{worst_cat["avg_pct_error"].iloc[0]:.0f}% average error',
                'fix': f'Collect more training data for "{cat_name}" or apply category-specific adjustments'
            })

    # Check for price range issues
    if len(df[df['price_bucket'] == '$1K+']) < 5:
        recommendations.append({
            'issue': 'Limited High-Value Item Data',
            'detail': 'Few validated predictions for items >$1000',
            'fix': 'Focus data collection on high-value items for better accuracy in this range'
        })

    # Data volume recommendation
    if len(df) < 50:
        recommendations.append({
            'issue': 'Limited Validation Data',
            'detail': f'Only {len(df)} predictions validated',
            'fix': 'Prioritize collecting actual sale outcomes to build a larger validation set'
        })

    for i, rec in enumerate(recommendations, 1):
        print(f"\n{i}. {rec['issue']}")
        print(f"   Detail: {rec['detail']}")
        print(f"   Fix: {rec['fix']}")

    if not recommendations:
        print("\n✅ AI accuracy looks healthy! Continue collecting validation data.")

    print(f"\n{'='*60}")

    return {
        'total_validated': len(df),
        'mae': mae,
        'mape': mape,
        'within_20_pct': within_20 / len(df) * 100,
        'over_prediction_rate': over_predictions / len(df) * 100,
        'under_prediction_rate': under_predictions / len(df) * 100,
        'worst_categories': worst.index.tolist()[:5] if not category_stats.empty else [],
        'recommendations': recommendations
    }


if __name__ == "__main__":
    results = validate_ai_predictions()
