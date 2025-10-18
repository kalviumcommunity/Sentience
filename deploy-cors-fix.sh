#!/bin/bash

echo "🔧 Deploying CORS Fix..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Commit changes
echo "💾 Committing CORS fixes..."
git add .
git commit -m "Fix CORS headers for error responses

- Add CORS headers to error handling middleware
- Improve error logging in login endpoint
- Temporarily disable CSRF for login/register endpoints for debugging
- Ensure CORS headers are present even when server errors occur
- Add better error handling and logging throughout"

# Push to trigger deployment
echo "🚀 Pushing to trigger deployment..."
git push origin main

echo "✅ CORS fixes deployed!"
echo ""
echo "🔧 Key fixes applied:"
echo "   - CORS headers now included in error responses"
echo "   - Better error logging in login endpoint"
echo "   - CSRF temporarily disabled for login/register"
echo "   - Improved error handling middleware"
echo ""
echo "🔍 Test the fixes:"
echo "   - Try logging in from the frontend"
echo "   - Check browser console for CORS errors"
echo "   - Monitor server logs for detailed error information"
