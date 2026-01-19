# data_cleanup.py
"""
Precision Prices - Data Cleanup Recommendations & Execution

Generates and optionally executes cleanup tasks:
- Remove stale temp listings
- Flag incomplete soldPrices records
- Identify duplicate sessions
- Clean up orphaned feedback events
- Validate data integrity

IMPORTANT: Run with dry_run=True first to see what would be changed!

Run: python scripts/data_cleanup.py
"""

from google.cloud import firestore
from google.oauth2 import service_account
from datetime import datetime, timedelta
from collections import defaultdict
import os

# Initialize Firestore with service account
script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)
key_path = os.path.join(project_dir, 'serviceAccountKey.json')

if os.path.exists(key_path):
    credentials = service_account.Credentials.from_service_account_file(key_path)
    db = firestore.Client(credentials=credentials, project=credentials.project_id)
else:
    print(f"ERROR: Service account key not found at: {key_path}")
    print("\nTo fix this:")
    print("1. Go to Firebase Console → Project Settings → Service Accounts")
    print("2. Click 'Generate new private key'")
    print("3. Save the file as 'serviceAccountKey.json' in your project root")
    print(f"   Expected location: {key_path}")
    exit(1)


def generate_cleanup_tasks(dry_run=True):
    """
    Generate and optionally execute data cleanup tasks.

    Args:
        dry_run: If True, only shows what would be done. If False, executes changes.
    """

    now = datetime.now()

    print(f"\n{'='*60}")
    print("DATA CLEANUP REPORT - Precision Prices")
    print(f"{'='*60}")
    print(f"Report Generated: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Mode: {'DRY RUN (no changes)' if dry_run else '⚠️  LIVE EXECUTION'}")

    if not dry_run:
        print("\n" + "!"*60)
        print("! WARNING: Changes will be made to Firestore!")
        print("!"*60)

    tasks = []
    executed_tasks = []

    # ===========================================
    # TASK 1: Clean up old temp listings
    # ===========================================
    print(f"\n{'='*60}")
    print("TASK 1: Old Temporary Listings")
    print(f"{'='*60}")

    cutoff_7_days = now - timedelta(days=7)
    cutoff_30_days = now - timedelta(days=30)

    try:
        # Get all temp listings (can't query by timestamp easily, so fetch all)
        temp_listings = list(db.collection('listings_temp').stream())

        old_temp_7d = []
        old_temp_30d = []
        stale_no_activity = []

        for doc in temp_listings:
            data = doc.to_dict()
            created = data.get('createdAt')
            updated = data.get('updatedAt')
            last_feedback = data.get('lastFeedbackAt')

            # Convert Firestore timestamps
            if created and hasattr(created, 'timestamp'):
                created = datetime.fromtimestamp(created.timestamp())

            latest_activity = updated or last_feedback or created

            if latest_activity and hasattr(latest_activity, 'timestamp'):
                latest_activity = datetime.fromtimestamp(latest_activity.timestamp())

            if created:
                if created < cutoff_30_days:
                    old_temp_30d.append(doc)
                elif created < cutoff_7_days:
                    old_temp_7d.append(doc)

            # Check for stale entries with no outcome
            stage = data.get('stage')
            if stage in ['pre_listing', 'active_listing'] and latest_activity:
                if latest_activity < cutoff_7_days:
                    stale_no_activity.append(doc)

        print(f"Temp listings > 30 days old: {len(old_temp_30d)}")
        print(f"Temp listings > 7 days old: {len(old_temp_7d)}")
        print(f"Stale listings (no activity in 7 days, not sold): {len(stale_no_activity)}")

        if old_temp_30d:
            tasks.append({
                'name': 'Delete very old temp listings (>30 days)',
                'count': len(old_temp_30d),
                'docs': old_temp_30d,
                'action': 'delete'
            })

            if not dry_run:
                batch = db.batch()
                for doc in old_temp_30d[:500]:  # Batch limit is 500
                    batch.delete(doc.reference)
                batch.commit()
                executed_tasks.append(f"Deleted {min(len(old_temp_30d), 500)} old temp listings")
                print(f"✓ Deleted {min(len(old_temp_30d), 500)} old temp listings")

    except Exception as e:
        print(f"Error checking temp listings: {e}")

    # ===========================================
    # TASK 2: Flag incomplete soldPrices
    # ===========================================
    print(f"\n{'='*60}")
    print("TASK 2: Incomplete Sold Prices Records")
    print(f"{'='*60}")

    try:
        sold_prices = list(db.collection('soldPrices').stream())

        incomplete_records = []
        fixable_records = []

        for doc in sold_prices:
            data = doc.to_dict()
            issues = []

            # Check required fields
            if not data.get('actualSoldPrice'):
                issues.append('missing_price')
            if not data.get('category'):
                issues.append('missing_category')
            if not data.get('condition'):
                issues.append('missing_condition')
            if not data.get('itemName'):
                issues.append('missing_item_name')

            # Location check (nested)
            location = data.get('location', {})
            parsed = location.get('parsed', {}) if isinstance(location, dict) else {}
            if not (parsed.get('metro') or parsed.get('state') or parsed.get('city')):
                issues.append('missing_location')

            if issues:
                incomplete_records.append({
                    'id': doc.id,
                    'issues': issues,
                    'data': data
                })

                # Check if fixable (has some data we can infer from)
                if 'missing_category' in issues and data.get('itemName'):
                    fixable_records.append(doc.id)

        print(f"Total incomplete records: {len(incomplete_records)}")
        print(f"Potentially fixable (have item name): {len(fixable_records)}")

        if incomplete_records:
            # Group by issue type
            issue_counts = defaultdict(int)
            for rec in incomplete_records:
                for issue in rec['issues']:
                    issue_counts[issue] += 1

            print("\nIssue breakdown:")
            for issue, count in sorted(issue_counts.items(), key=lambda x: x[1], reverse=True):
                print(f"  {issue}: {count}")

            tasks.append({
                'name': 'Review incomplete soldPrices',
                'count': len(incomplete_records),
                'action': 'review',
                'ids': [r['id'] for r in incomplete_records[:20]]
            })

            # Export IDs for manual review
            print(f"\nFirst 20 incomplete record IDs for review:")
            for rec in incomplete_records[:20]:
                print(f"  - {rec['id']}: {', '.join(rec['issues'])}")

    except Exception as e:
        print(f"Error checking sold prices: {e}")

    # ===========================================
    # TASK 3: Identify duplicate/suspicious sessions
    # ===========================================
    print(f"\n{'='*60}")
    print("TASK 3: Session Cleanup")
    print(f"{'='*60}")

    try:
        sessions = list(db.collection('sessions').stream())

        # Group sessions by user
        user_sessions = defaultdict(list)
        orphan_sessions = []
        very_short_sessions = []

        for session in sessions:
            data = session.to_dict()
            user_id = data.get('userId')
            start_time = data.get('startTime')
            duration = data.get('duration', 0)

            # Convert timestamps
            if start_time and hasattr(start_time, 'timestamp'):
                start_time = datetime.fromtimestamp(start_time.timestamp())

            session_info = {
                'doc': session,
                'start_time': start_time,
                'duration': duration,
                'is_guest': data.get('isGuest', False)
            }

            if user_id:
                user_sessions[user_id].append(session_info)
            else:
                orphan_sessions.append(session)

            # Very short sessions (< 10 seconds)
            if duration and duration < 10000:  # milliseconds
                very_short_sessions.append(session)

        # Find rapid-fire sessions (potential duplicates)
        rapid_sessions = []
        for user_id, sessions_list in user_sessions.items():
            sorted_sessions = sorted(sessions_list, key=lambda x: x['start_time'] or datetime.min)

            for i in range(len(sorted_sessions) - 1):
                current = sorted_sessions[i]['start_time']
                next_sess = sorted_sessions[i + 1]['start_time']

                if current and next_sess:
                    gap = (next_sess - current).total_seconds()
                    if gap < 60:  # Sessions within 1 minute
                        rapid_sessions.append({
                            'user_id': user_id,
                            'session1': sorted_sessions[i]['doc'].id,
                            'session2': sorted_sessions[i + 1]['doc'].id,
                            'gap_seconds': gap
                        })

        print(f"Total sessions: {len(sessions)}")
        print(f"Sessions without user_id: {len(orphan_sessions)}")
        print(f"Very short sessions (<10s): {len(very_short_sessions)}")
        print(f"Rapid-fire session pairs (<1min apart): {len(rapid_sessions)}")

        if rapid_sessions:
            tasks.append({
                'name': 'Review potential duplicate sessions',
                'count': len(rapid_sessions),
                'action': 'review'
            })
            print(f"\nFirst 10 rapid session pairs:")
            for pair in rapid_sessions[:10]:
                print(f"  User {pair['user_id']}: {pair['session1']} -> {pair['session2']} ({pair['gap_seconds']:.1f}s gap)")

    except Exception as e:
        print(f"Error checking sessions: {e}")

    # ===========================================
    # TASK 4: Orphaned feedback events
    # ===========================================
    print(f"\n{'='*60}")
    print("TASK 4: Orphaned Feedback Events")
    print(f"{'='*60}")

    try:
        feedback_events = list(db.collection('feedback_events').stream())
        listings = {doc.id: doc.to_dict() for doc in db.collection('listings').stream()}
        listings_temp = {doc.id: doc.to_dict() for doc in db.collection('listings_temp').stream()}

        orphaned_feedback = []

        for feedback in feedback_events:
            data = feedback.to_dict()
            listing_id = data.get('listingId')

            if listing_id:
                # Check if listing exists in either collection
                if listing_id not in listings and listing_id not in listings_temp:
                    orphaned_feedback.append({
                        'feedback_id': feedback.id,
                        'listing_id': listing_id,
                        'purpose': data.get('purpose'),
                        'created': data.get('createdAt')
                    })

        print(f"Total feedback events: {len(feedback_events)}")
        print(f"Orphaned feedback (no matching listing): {len(orphaned_feedback)}")

        if orphaned_feedback:
            tasks.append({
                'name': 'Review orphaned feedback events',
                'count': len(orphaned_feedback),
                'action': 'review'
            })

            # These might still be valuable for aggregate data, so don't auto-delete
            print(f"\nFirst 10 orphaned feedback events:")
            for fb in orphaned_feedback[:10]:
                print(f"  - {fb['feedback_id']} -> listing {fb['listing_id']} ({fb['purpose']})")

    except Exception as e:
        print(f"Error checking feedback events: {e}")

    # ===========================================
    # TASK 5: Data integrity checks
    # ===========================================
    print(f"\n{'='*60}")
    print("TASK 5: Data Integrity Issues")
    print(f"{'='*60}")

    integrity_issues = []

    try:
        # Check for listings with impossible prices
        listings_all = list(db.collection('listings').stream())

        for listing in listings_all:
            data = listing.to_dict()
            pricing = data.get('pricingStrategy', {})

            min_price = pricing.get('min', 0)
            max_price = pricing.get('max', 0)
            optimal = pricing.get('optimal', 0)
            listing_price = pricing.get('listingPrice', 0)

            issues = []

            if min_price and max_price and min_price > max_price:
                issues.append('min > max price')

            if optimal and max_price and optimal > max_price:
                issues.append('optimal > max price')

            if optimal and min_price and optimal < min_price:
                issues.append('optimal < min price')

            if listing_price and (listing_price < 0 or listing_price > 100000):
                issues.append('listing price out of range')

            if issues:
                integrity_issues.append({
                    'id': listing.id,
                    'issues': issues,
                    'pricing': pricing
                })

        print(f"Listings with pricing integrity issues: {len(integrity_issues)}")

        if integrity_issues:
            tasks.append({
                'name': 'Fix pricing integrity issues',
                'count': len(integrity_issues),
                'action': 'fix'
            })

            for issue in integrity_issues[:10]:
                print(f"  - {issue['id']}: {', '.join(issue['issues'])}")
                print(f"    Pricing: {issue['pricing']}")

    except Exception as e:
        print(f"Error checking data integrity: {e}")

    # ===========================================
    # SUMMARY
    # ===========================================
    print(f"\n{'='*60}")
    print("CLEANUP SUMMARY")
    print(f"{'='*60}")

    print(f"\nTotal tasks identified: {len(tasks)}")
    for i, task in enumerate(tasks, 1):
        print(f"  {i}. {task['name']}: {task['count']} items ({task['action']})")

    if executed_tasks:
        print(f"\nTasks executed:")
        for task in executed_tasks:
            print(f"  ✓ {task}")

    if dry_run and tasks:
        print(f"\n{'='*60}")
        print("TO EXECUTE CLEANUP:")
        print(f"{'='*60}")
        print("Run with: generate_cleanup_tasks(dry_run=False)")
        print("\n⚠️  Review the changes above before executing!")

    return tasks


def export_incomplete_records(output_file='incomplete_records.json'):
    """Export incomplete soldPrices records for manual review."""
    import json

    sold_prices = list(db.collection('soldPrices').stream())
    incomplete = []

    for doc in sold_prices:
        data = doc.to_dict()
        issues = []

        if not data.get('actualSoldPrice'):
            issues.append('missing_price')
        if not data.get('category'):
            issues.append('missing_category')
        if not data.get('condition'):
            issues.append('missing_condition')

        if issues:
            # Convert timestamps for JSON
            export_data = dict(data)
            for key, value in export_data.items():
                if hasattr(value, 'timestamp'):
                    export_data[key] = value.timestamp()

            incomplete.append({
                'doc_id': doc.id,
                'issues': issues,
                'data': export_data
            })

    with open(output_file, 'w') as f:
        json.dump(incomplete, f, indent=2, default=str)

    print(f"Exported {len(incomplete)} incomplete records to {output_file}")
    return incomplete


if __name__ == "__main__":
    # Run in dry-run mode first
    tasks = generate_cleanup_tasks(dry_run=True)

    # Uncomment to export incomplete records for review:
    # export_incomplete_records()

    # Uncomment to actually execute cleanup (BE CAREFUL!):
    # tasks = generate_cleanup_tasks(dry_run=False)
