import express from 'express';
const router = express.Router();
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import Note from '../models/Note.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

// IMPORTANT: Static routes (/global, /my-notes, /like/:id) MUST be defined
// before the dynamic /:id route, otherwise Express matches them as IDs first.

// @route   GET api/notes/global
// @desc    Get all global notes
// @access  Public
router.get('/global', catchAsync(async (req, res, next) => {
  try {
    const notes = await Note.find({ privacy: 'global' }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
}));

// @route   GET api/notes/my-notes
// @desc    Get current user's notes
// @access  Private
router.get('/my-notes', auth, catchAsync(async (req, res, next) => {
  try {
    const notes = await Note.find({ 'author.id': req.user.id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
}));

// @route   GET api/notes
// @desc    Get global notes + authenticated user's private notes
// @access  Public/Private
router.get('/', catchAsync(async (req, res, next) => {
  try {
    const globalNotes = await Note.find({ privacy: 'global' }).sort({ createdAt: -1 });

    if (req.header('x-auth-token')) {
      try {
        const decoded = jwt.verify(req.header('x-auth-token'), process.env.JWT_SECRET);
        const privateNotes = await Note.find({
          privacy: 'private',
          'author.id': decoded.user.id
        }).sort({ createdAt: -1 });
        return res.json([...globalNotes, ...privateNotes]);
      } catch {
        // Invalid token — fall through to return only global notes
      }
    }

    res.json(globalNotes);
  } catch (err) {
    console.error('Note retrieval error:', err.message);
    res.status(500).json({
      message: 'Internal server error occurred while retrieving notes',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
    });
  }
}));

// @route   POST api/notes
// @desc    Create a new note
// @access  Private
router.post('/', [
  auth,
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('content').trim().isLength({ min: 1, max: 10000 }).withMessage('Content must be between 1 and 10,000 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('category').optional().trim().isLength({ max: 100 }),
  body('privacy').optional().isIn(['private', 'global']),
  body('tags').optional()
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { title, description, content, category, tags, privacy } = req.body;

  try {
    const user = await User.findById(req.user.id).select('-password');

    // tags may arrive as a comma-separated string or an array
    const parsedTags = Array.isArray(tags)
      ? tags.map(t => t.trim()).filter(Boolean)
      : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);

    const newNote = new Note({
      title,
      description,
      content,
      category,
      privacy: privacy || 'private',
      tags: parsedTags,
      author: {
        id: req.user.id,
        name: user.name,
        avatar: user.avatar
      }
    });

    const note = await newNote.save();
    res.json(note);
  } catch (err) {
    console.error('Note creation error:', err.message);
    res.status(500).json({
      message: 'Internal server error occurred while creating note',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
    });
  }
}));

// @route   PUT api/notes/like/:id
// @desc    Like a note
// @access  Private
router.put('/like/:id', auth, catchAsync(async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    note.likes += 1;
    await note.save();
    res.json(note);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'CastError') return res.status(404).json({ message: 'Note not found' });
    res.status(500).json({ message: 'Server error' });
  }
}));

// @route   GET api/notes/:id
// @desc    Get a note by ID
// @access  Public
router.get('/:id', catchAsync(async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'CastError') return res.status(404).json({ message: 'Note not found' });
    res.status(500).json({ message: 'Server error' });
  }
}));

// @route   PUT api/notes/:id
// @desc    Update a note
// @access  Private
router.put('/:id', auth, catchAsync(async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (note.author.id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized' });
    }

    const { title, description, content, category, tags, privacy } = req.body;

    if (title !== undefined) note.title = title;
    if (description !== undefined) note.description = description;
    if (content !== undefined) note.content = content;
    if (category !== undefined) note.category = category;
    if (privacy !== undefined) note.privacy = privacy;
    if (tags !== undefined) {
      note.tags = Array.isArray(tags)
        ? tags.map(t => t.trim()).filter(Boolean)
        : tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    note.updatedAt = Date.now();

    await note.save();
    res.json(note);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'CastError') return res.status(404).json({ message: 'Note not found' });
    res.status(500).json({ message: 'Server error' });
  }
}));

// @route   DELETE api/notes/:id
// @desc    Delete a note
// @access  Private
router.delete('/:id', auth, catchAsync(async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (note.author.id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized' });
    }

    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note removed' });
  } catch (err) {
    console.error(err.message);
    if (err.name === 'CastError') return res.status(404).json({ message: 'Note not found' });
    res.status(500).json({ message: 'Server error' });
  }
}));

export default router;
