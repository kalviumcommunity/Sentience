#!/bin/bash

echo "🚀 Deploying Authentication Fixes..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Commit changes
echo "💾 Committing changes..."
git add .
git commit -m "Fix authentication issues for production deployment

- Fix CSRF token header case sensitivity (x-csrf-token vs X-CSRF-Token)
- Fix token storage consistency between localStorage and httpOnly cookies
- Add proper token expiration handling
- Update CORS configuration for authentication headers
- Set JWT_SECRET in render.yaml for production
- Improve error handling in authentication flow"

# Push to trigger deployment
echo "🚀 Pushing to trigger deployment..."
git push origin main

echo "✅ Deployment initiated! Check your Render and Netlify dashboards for deployment status."
echo ""
echo "🔧 Key fixes applied:"
echo "   - CSRF token header case sensitivity fixed"
echo "   - Token storage consistency improved"
echo "   - CORS headers updated for authentication"
echo "   - JWT_SECRET configured for production"
echo "   - Token expiration handling added"
echo ""
echo "📋 Next steps:"
echo "   1. Monitor deployment logs in Render dashboard"
echo "   2. Test login/registration on deployed site"
echo "   3. Check browser console for any remaining errors"
echo "   4. Verify CORS headers in Network tab"
