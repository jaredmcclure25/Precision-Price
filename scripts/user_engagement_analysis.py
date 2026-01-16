# user_engagement_analysis.py
"""
Precision Prices User Engagement Analysis

Analyzes sessions, activities, and user_stats collections to understand:
- DAU/MAU metrics
- Feature adoption (what users are actually doing)
- User journey completion rates
- Drop-off points

Run: python scripts/user_engagement_analysis.py
"""

from google.cloud import firestore
from datetime import datetime, timedelta
from collections import defaultdict
import pandas as pd

db = firestore.Client()


def analyze_user_engagement():
    """Main engagement analysis function."""

    # Get date ranges
    now = datetime.now()
    last_7_days = now - timedelta(days=7)
    last_30_days = now - timedelta(days=30)

    print("Fetching data from Firestore...")

    # Fetch collections
    sessions = list(db.collection('sessions').stream())
    activities = list(db.collection('activities').stream())
    users = list(db.collection('users').stream())
    user_stats = list(db.collection('user_stats').stream())

    print(f"\n{'='*60}")
    print("USER ENGAGEMENT REPORT - Precision Prices")
    print(f"{'='*60}")
    print(f"Report Generated: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\nTotal Users: {len(users)}")
    print(f"Total Sessions: {len(sessions)}")
    print(f"Total Activities: {len(activities)}")

    # ===========================================
    # ACTIVE USER ANALYSIS (DAU/MAU)
    # ===========================================
    active_7d = set()
    active_30d = set()
    guest_sessions_7d = 0
    guest_sessions_30d = 0
    session_data = []

    for session in sessions:
        data = session.to_dict()
        # Your schema uses 'startTime' for session timestamp
        session_time = data.get('startTime') or data.get('lastActivity')
        user_id = data.get('userId')
        is_guest = data.get('isGuest', False)

        if session_time:
            # Handle Firestore timestamp
            if hasattr(session_time, 'timestamp'):
                session_time = session_time.timestamp()
                session_dt = datetime.fromtimestamp(session_time)
            else:
                session_dt = session_time

            if session_dt > last_7_days:
                if user_id and not is_guest:
                    active_7d.add(user_id)
                else:
                    guest_sessions_7d += 1

            if session_dt > last_30_days:
                if user_id and not is_guest:
                    active_30d.add(user_id)
                else:
                    guest_sessions_30d += 1

        # Session duration in milliseconds per your schema
        duration_ms = data.get('duration', 0) or 0
        session_data.append({
            'user_id': user_id,
            'is_guest': is_guest,
            'timestamp': session_time,
            'duration_seconds': duration_ms / 1000 if duration_ms else 0,
            'device_type': data.get('deviceInfo', {}).get('type', 'unknown'),
            'browser': data.get('deviceInfo', {}).get('browser', 'unknown'),
        })

    total_users = len(users) if users else 1  # Avoid division by zero

    print(f"\n{'='*60}")
    print("ACTIVE USERS (DAU/MAU)")
    print(f"{'='*60}")
    print(f"DAU (7-day active registered users): {len(active_7d)}")
    print(f"MAU (30-day active registered users): {len(active_30d)}")
    print(f"Guest sessions (7-day): {guest_sessions_7d}")
    print(f"Guest sessions (30-day): {guest_sessions_30d}")
    print(f"7-day Retention Rate: {len(active_7d)/total_users*100:.1f}%")
    print(f"30-day Retention Rate: {len(active_30d)/total_users*100:.1f}%")

    if len(active_30d) > 0:
        print(f"Stickiness (DAU/MAU): {len(active_7d)/len(active_30d)*100:.1f}%")

    # ===========================================
    # ACTIVITY BREAKDOWN (Feature Adoption)
    # ===========================================
    activity_types = defaultdict(int)
    activity_by_user = defaultdict(lambda: defaultdict(int))
    recent_activities = []

    for activity in activities:
        data = activity.to_dict()
        activity_type = data.get('activityType', 'unknown')
        activity_types[activity_type] += 1

        user_id = data.get('userId') or 'guest'
        activity_by_user[user_id][activity_type] += 1

        timestamp = data.get('timestamp')
        if timestamp:
            if hasattr(timestamp, 'timestamp'):
                timestamp = datetime.fromtimestamp(timestamp.timestamp())
            if timestamp > last_7_days:
                recent_activities.append({
                    'type': activity_type,
                    'user_id': user_id,
                    'page': data.get('page', ''),
                    'metadata': data.get('metadata', {})
                })

    print(f"\n{'='*60}")
    print("ACTIVITY BREAKDOWN (Feature Adoption)")
    print(f"{'='*60}")

    # Map to your actual activity types from analytics.js
    key_activities = {
        'analysis': 'Price Analyses Completed',
        'image_upload': 'Images Uploaded',
        'feedback': 'Feedback Submitted',
        'bulk_analysis': 'Bulk Analyses',
        'export': 'Exports',
        'login': 'Logins',
        'signup': 'Signups',
        'page_view': 'Page Views',
        'session_start': 'Session Starts',
        'session_end': 'Session Ends',
    }

    for activity_type, count in sorted(activity_types.items(), key=lambda x: x[1], reverse=True):
        label = key_activities.get(activity_type, activity_type)
        print(f"  {label}: {count}")

    # ===========================================
    # USER JOURNEY ANALYSIS
    # ===========================================
    print(f"\n{'='*60}")
    print("USER JOURNEY COMPLETION RATES")
    print(f"{'='*60}")

    # Define the ideal user journey stages
    journey_stages = ['session_start', 'page_view', 'image_upload', 'analysis', 'feedback']

    users_at_stage = defaultdict(set)
    for user_id, activities in activity_by_user.items():
        for stage in journey_stages:
            if activities.get(stage, 0) > 0:
                users_at_stage[stage].add(user_id)

    print("\nFunnel Analysis (cumulative users reaching each stage):")
    prev_count = len(activity_by_user)
    for stage in journey_stages:
        count = len(users_at_stage[stage])
        pct = (count / prev_count * 100) if prev_count > 0 else 0
        drop = prev_count - count
        print(f"  {stage}: {count} users ({pct:.1f}% of previous, {drop} dropped)")
        prev_count = count if count > 0 else prev_count

    # ===========================================
    # DROP-OFF ANALYSIS
    # ===========================================
    print(f"\n{'='*60}")
    print("DROP-OFF POINTS")
    print(f"{'='*60}")

    # Users who started but didn't complete analysis
    started_session = users_at_stage.get('session_start', set())
    completed_analysis = users_at_stage.get('analysis', set())

    dropped_before_analysis = started_session - completed_analysis
    if started_session:
        drop_rate = len(dropped_before_analysis) / len(started_session) * 100
        print(f"Users who started but didn't complete analysis: {len(dropped_before_analysis)} ({drop_rate:.1f}%)")

    # Users who analyzed but didn't give feedback
    gave_feedback = users_at_stage.get('feedback', set())
    analyzed_no_feedback = completed_analysis - gave_feedback
    if completed_analysis:
        no_feedback_rate = len(analyzed_no_feedback) / len(completed_analysis) * 100
        print(f"Users who analyzed but didn't give feedback: {len(analyzed_no_feedback)} ({no_feedback_rate:.1f}%)")

    # ===========================================
    # SESSION METRICS
    # ===========================================
    df = pd.DataFrame(session_data)

    if not df.empty and df['duration_seconds'].sum() > 0:
        print(f"\n{'='*60}")
        print("SESSION METRICS")
        print(f"{'='*60}")

        valid_sessions = df[df['duration_seconds'] > 0]
        if not valid_sessions.empty:
            print(f"Avg session duration: {valid_sessions['duration_seconds'].mean():.1f}s ({valid_sessions['duration_seconds'].mean()/60:.1f} min)")
            print(f"Median session duration: {valid_sessions['duration_seconds'].median():.1f}s")
            print(f"Max session duration: {valid_sessions['duration_seconds'].max():.1f}s ({valid_sessions['duration_seconds'].max()/60:.1f} min)")

        # Device breakdown
        print(f"\nDevice Breakdown:")
        device_counts = df['device_type'].value_counts()
        for device, count in device_counts.items():
            pct = count / len(df) * 100
            print(f"  {device}: {count} ({pct:.1f}%)")

        # Browser breakdown
        print(f"\nBrowser Breakdown:")
        browser_counts = df['browser'].value_counts()
        for browser, count in browser_counts.head(5).items():
            pct = count / len(df) * 100
            print(f"  {browser}: {count} ({pct:.1f}%)")

    # ===========================================
    # USER STATS ANALYSIS
    # ===========================================
    if user_stats:
        print(f"\n{'='*60}")
        print("USER ENGAGEMENT TIERS")
        print(f"{'='*60}")

        power_users = 0  # 10+ analyses
        regular_users = 0  # 3-9 analyses
        casual_users = 0  # 1-2 analyses
        inactive_users = 0  # 0 analyses

        total_analyses = 0
        total_images = 0

        for stat in user_stats:
            data = stat.to_dict()
            analyses = data.get('totalAnalyses', 0)
            total_analyses += analyses
            total_images += data.get('totalImages', 0)

            if analyses >= 10:
                power_users += 1
            elif analyses >= 3:
                regular_users += 1
            elif analyses >= 1:
                casual_users += 1
            else:
                inactive_users += 1

        total_tracked = len(user_stats)
        print(f"Power Users (10+ analyses): {power_users} ({power_users/total_tracked*100:.1f}%)")
        print(f"Regular Users (3-9 analyses): {regular_users} ({regular_users/total_tracked*100:.1f}%)")
        print(f"Casual Users (1-2 analyses): {casual_users} ({casual_users/total_tracked*100:.1f}%)")
        print(f"Inactive Users (0 analyses): {inactive_users} ({inactive_users/total_tracked*100:.1f}%)")
        print(f"\nTotal Analyses Across All Users: {total_analyses}")
        print(f"Total Images Uploaded: {total_images}")
        if total_tracked > 0:
            print(f"Avg Analyses per User: {total_analyses/total_tracked:.1f}")

    # ===========================================
    # RECOMMENDATIONS
    # ===========================================
    print(f"\n{'='*60}")
    print("RECOMMENDATIONS")
    print(f"{'='*60}")

    recommendations = []

    if guest_sessions_30d > len(active_30d):
        recommendations.append("- High guest traffic: Consider improving signup conversion flow")

    if activity_types.get('feedback', 0) < activity_types.get('analysis', 0) * 0.3:
        recommendations.append("- Low feedback rate: Add more prompts for feedback after analysis")

    if activity_types.get('image_upload', 0) < activity_types.get('analysis', 0) * 0.5:
        recommendations.append("- Many text-only analyses: Encourage image uploads for better accuracy")

    if len(active_7d) < len(active_30d) * 0.3:
        recommendations.append("- Low stickiness: Users aren't returning regularly. Consider engagement features")

    if not recommendations:
        recommendations.append("- Engagement metrics look healthy! Focus on growth.")

    for rec in recommendations:
        print(rec)

    print(f"\n{'='*60}")

    return {
        'dau': len(active_7d),
        'mau': len(active_30d),
        'guest_sessions_7d': guest_sessions_7d,
        'guest_sessions_30d': guest_sessions_30d,
        'total_users': len(users),
        'activity_breakdown': dict(activity_types),
        'retention_7d': len(active_7d)/total_users*100 if total_users else 0,
        'retention_30d': len(active_30d)/total_users*100 if total_users else 0,
    }


if __name__ == "__main__":
    results = analyze_user_engagement()
