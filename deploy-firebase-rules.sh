#!/bin/bash

# Deploy Firestore Rules Script
# This script will install Firebase CLI and deploy your Firestore rules

echo "🔥 Firebase Rules Deployment Script"
echo "===================================="
echo ""

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Firebase CLI"
        echo "Please run: sudo npm install -g firebase-tools"
        exit 1
    fi
fi

echo "✅ Firebase CLI is installed"
echo ""

# Login to Firebase
echo "🔐 Logging into Firebase..."
echo "A browser window will open for authentication"
firebase login

if [ $? -ne 0 ]; then
    echo "❌ Firebase login failed"
    exit 1
fi

echo "✅ Logged in successfully"
echo ""

# Initialize Firebase (if not already initialized)
if [ ! -f "firebase.json" ]; then
    echo "📝 Initializing Firebase..."
    firebase init firestore --project precisionprices
else
    echo "✅ Firebase already initialized"
fi

echo ""

# Deploy Firestore rules
echo "🚀 Deploying Firestore rules..."
firebase deploy --only firestore:rules --project precisionprices

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Firestore rules deployed!"
    echo ""
    echo "Your bug reports will now save to Firebase."
    echo "View them at: https://console.firebase.google.com/project/precisionprices/firestore"
else
    echo ""
    echo "❌ Deployment failed"
    echo "Please manually deploy via Firebase Console:"
    echo "1. Go to https://console.firebase.google.com"
    echo "2. Select 'precisionprices' project"
    echo "3. Click 'Firestore Database' → 'Rules' tab"
    echo "4. Copy/paste contents from firestore.rules"
    echo "5. Click 'Publish'"
fi
