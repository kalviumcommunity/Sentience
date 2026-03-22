import express from 'express';
const router = express.Router();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { blacklistToken } from '../utils/tokenManager.js';
import catchAsync from '../utils/catchAsync.js';

// @route   POST api/users/logout
// @desc    Logout user (blacklist token)
// @access  Private
router.post('/logout', auth, catchAsync(async (req, res, next) => {
  try {
    const token = req.cookies.authToken || req.header('x-auth-token');
    if (token) {
      blacklistToken(token);
    }

    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}));

// @route   GET api/users/validate
// @desc    Validate JWT token
// @access  Private
router.get('/validate', auth, catchAsync(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('User validation error:', err.message);
    res.status(500).json({ 
      message: 'Internal server error occurred while validating user',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
    });
  }
}));

// @route   POST api/users/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', catchAsync(async (req, res, next) => {
  const { email } = req.body;

  try {
    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // In a real app, send email here
    // For now, we'll return the token in development
    if (process.env.NODE_ENV === 'development') {
      res.json({ 
        message: 'Password reset email sent',
        resetToken: resetToken // Only in development
      });
    } else {
      res.json({ message: 'Password reset email sent' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
}));

// @route   POST api/users/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', catchAsync(async (req, res, next) => {
  const { token, newPassword } = req.body;

  try {
    // Validate required fields
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Password reset error:', err.message);
    res.status(500).json({ 
      message: 'Internal server error occurred during password reset',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
    });
  }
}));

// @route   POST api/users/register
// @desc    Register a user
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'),
  body('university').optional().trim().isLength({ max: 100 }),
  body('major').optional().trim().isLength({ max: 100 }),
  body('year').optional().trim().isLength({ max: 20 }),
  body('gender').optional().isIn(['male', 'female', 'neutral']).withMessage('Gender must be male, female, or neutral'),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL')
], catchAsync(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, email, password, university, major, year, gender, avatar } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      gender: gender || 'neutral',
      university: university || '',
      major: major || '',
      year: year || ''
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user
    await user.save();

    // Create JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        
        res.cookie('authToken', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        }).json({ 
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            gender: user.gender,
            university: user.university,
            major: user.major,
            year: user.year,
            bio: user.bio
          }
        });
      }
    );
  } catch (err) {
    console.error('User registration error:', err.message);
    console.error('Error details:', err);
    
    // Check if it's a MongoDB connection error
    if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
      return res.status(500).json({ 
        message: 'Database connection error. Please try again later.',
        error: 'MongoDB connection failed'
      });
    }
    
    // Check if it's a validation error
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        error: err.message
      });
    }
    
    // Check if it's a duplicate key error (username index issue)
    if (err.code === 11000) {
      console.log('Duplicate key error detected:', err.message);
      return res.status(400).json({ 
        message: 'User with this email already exists',
        error: 'Duplicate email'
      });
    }
    
    res.status(500).json({ 
      message: 'Server error',
      error: err.message
    });
  }
}));

// @route   POST api/users/login
// @desc    Login user & get token
// @access  Public
router.post('/login', catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  try {
    console.log('Login attempt for:', email);
    
    // Validate required fields
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) {
          console.error('JWT signing error:', err);
          return res.status(500).json({ message: 'Token generation failed' });
        }
        console.log('Login successful for:', email);
        
        res.cookie('authToken', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        }).json({ 
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            gender: user.gender,
            university: user.university,
            major: user.major,
            year: user.year,
            bio: user.bio
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
}));

// @route   GET api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, catchAsync(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}));

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please include a valid email'),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  body('gender').optional().isIn(['male', 'female', 'other', 'neutral']).withMessage('Invalid gender'),
  body('university').optional().trim().isLength({ max: 100 }),
  body('major').optional().trim().isLength({ max: 100 }),
  body('year').optional().trim().isLength({ max: 20 }),
  body('bio').optional().trim().isLength({ max: 500 })
], catchAsync(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, email, avatar, gender, university, major, year, bio } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (avatar) user.avatar = avatar;
    if (gender) user.gender = gender;
    if (university !== undefined) user.university = university;
    if (major !== undefined) user.major = major;
    if (year !== undefined) user.year = year;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      gender: user.gender,
      university: user.university,
      major: user.major,
      year: user.year,
      bio: user.bio
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
}));

export default router;