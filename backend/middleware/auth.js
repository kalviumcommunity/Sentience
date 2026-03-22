import jwt from 'jsonwebtoken';
import { isTokenBlacklisted } from '../utils/tokenManager.js';

const auth = async function(req, res, next) {
  // Get token from cookie first, fallback to header
  let token = req.cookies?.authToken || req.header('x-auth-token');

  // If not found, try Authorization header
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Check if token is expired
    if (Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ message: 'Token expired' });
    }
    // Check if token is blacklisted
    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({ message: 'Token is invalid' });
    }
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

export default auth;