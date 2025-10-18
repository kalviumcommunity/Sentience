#!/bin/bash

echo "🔧 Deploying Health Check Fixes..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Commit changes
echo "💾 Committing health check fixes..."
git add .
git commit -m "Fix health check endpoint issues

- Implement proper MongoDB connection status checking
- Add graceful MongoDB connection failure handling
- Add simple /api/ping endpoint for basic health checks
- Update render.yaml to use /api/ping for health checks
- Improve MongoDB connection configuration with better timeouts
- Add connection event handlers for better monitoring
- Prevent server exit on MongoDB connection failure"

# Push to trigger deployment
echo "🚀 Pushing to trigger deployment..."
git push origin main

echo "✅ Health check fixes deployed!"
echo ""
echo "🔧 Key fixes applied:"
echo "   - Real MongoDB connection status checking in /api/health"
echo "   - Simple /api/ping endpoint for basic health checks"
echo "   - Graceful MongoDB connection failure handling"
echo "   - Updated render.yaml to use /api/ping for health checks"
echo "   - Improved MongoDB connection timeouts and error handling"
echo ""
echo "📋 Health check endpoints:"
echo "   - /api/ping - Simple health check (used by Render)"
echo "   - /api/health - Detailed health check with MongoDB status"
echo ""
echo "🔍 Test the fixes:"
echo "   - Run: ./test-health.sh"
echo "   - Check Render dashboard for deployment status"
echo "   - Monitor logs for MongoDB connection status"
