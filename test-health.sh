#!/bin/bash

echo "🔍 Testing Health Check Endpoint..."

# Test local health check
echo "📡 Testing local health check..."
curl -s http://localhost:8000/api/health | jq . || echo "❌ Local health check failed"

echo ""
echo "🌐 Testing production health check..."
curl -s https://sentience-xq1s.onrender.com/api/health | jq . || echo "❌ Production health check failed"

echo ""
echo "🔍 MongoDB Connection Test..."
node -e "
const mongoose = require('mongoose');
const uri = 'mongodb+srv://uday:uday@cluster0.n2vzkur.mongodb.net/student-sentience?retryWrites=true&w=majority&appName=Cluster0';

console.log('🔄 Testing MongoDB connection...');
mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 10000
}).then(() => {
  console.log('✅ MongoDB connection successful');
  console.log('📊 Connection state:', mongoose.connection.readyState);
  console.log('🏠 Host:', mongoose.connection.host);
  console.log('📚 Database:', mongoose.connection.name);
  process.exit(0);
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});
"

echo ""
echo "📋 Health Check Status Summary:"
echo "   - Local endpoint: Check above"
echo "   - Production endpoint: Check above" 
echo "   - MongoDB connection: Check above"
