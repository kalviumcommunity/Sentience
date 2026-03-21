import express from 'express';
const router = express.Router();
import { body, validationResult } from 'express-validator';
import FocusSession from '../models/FocusSession.js';
import auth from '../middleware/auth.js';

// @route   GET api/focus-sessions
// @desc    Get all focus sessions for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const focusSessions = await FocusSession.find({ user: req.user.id }).sort({ date: -1 });
    res.json(focusSessions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/focus-sessions
// @desc    Create a new focus session
// @access  Private
router.post('/', [
  auth,
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer (minutes)'),
  body('type').isIn(['work', 'break']).withMessage('Type must be work or break'),
  body('date').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { date, duration, type } = req.body;

  try {
    const newFocusSession = new FocusSession({
      user: req.user.id,
      date: date ? new Date(date) : new Date(),
      duration,
      type
    });

    const focusSession = await newFocusSession.save();
    res.json(focusSession);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/focus-sessions/:id
// @desc    Delete a focus session
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const focusSession = await FocusSession.findById(req.params.id);
    
    if (!focusSession) {
      return res.status(404).json({ message: 'Focus session not found' });
    }
    
    // Check if user owns the focus session
    if (focusSession.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    await FocusSession.findByIdAndDelete(req.params.id);
    res.json({ message: 'Focus session removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Focus session not found' });
    }
    res.status(500).send('Server error');
  }
});

export default router; 