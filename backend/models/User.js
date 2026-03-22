
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default'
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'neutral'],
    default: 'neutral'
  },
  university: {
    type: String,
    default: ''
  },
  major: {
    type: String,
    default: ''
  },
  year: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Enforce strict schema to prevent arbitrary field injection
  strict: true,
  timestamps: true // Adding timestamps is a good practice instead of manual createdAt
});

export default mongoose.model('User', userSchema);
