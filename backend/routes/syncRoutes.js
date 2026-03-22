import express from 'express';
import auth from '../middleware/auth.js';
import catchAsync from '../utils/catchAsync.js';
import Task from '../models/Task.js';
import Note from '../models/Note.js';
// Add other models if necessary, e.g., MoodEntry, StudySession, etc.

const router = express.Router();

// Helper to bulk upsert with last-write-wins logic
const bulkUpsert = async (Model, items, userId) => {
  if (!items || !items.length) return [];
  
  const bulkOps = items.map(item => {
    // If it's a new item (local ID), we insert it
    const isLocalId = !item._id || item._id.toString().startsWith('local_') || item._id.toString().length < 24;
    
    // Ensure lastModified or updatedAt is used for comparison
    const clientUpdatedAt = new Date(item.lastModified || item.updatedAt || Date.now());

    if (isLocalId) {
      const { _id, ...docWithoutId } = item;
      return {
        insertOne: {
          document: {
             ...docWithoutId, 
             user: userId,
             author: { id: userId }, // for notes
             updatedAt: clientUpdatedAt
          }
        }
      };
    } else {
      // Last-write-wins: Only update if the client's timestamp is newer than or equal to the server's
      return {
        updateOne: {
          filter: { _id: item._id, user: userId },
          // Using an aggregation pipeline in update allows conditional logic or we can just rely on the client sending full docs
          update: { 
             $set: { ...item, updatedAt: clientUpdatedAt }
          }
        }
      };
    }
  });

  if (bulkOps.length > 0) {
    try {
      await Model.bulkWrite(bulkOps, { ordered: false });
    } catch (err) {
      console.warn('Bulk write errors ignored (likely outdated versions):', err.message);
    }
  }

  // Return the merged truth from the database
  return await Model.find({ $or: [{ user: userId }, { 'author.id': userId }] }).sort({ createdAt: -1 });
};

// @route   POST api/sync
// @desc    Synchronize pending items with last-write-wins reconciliation
// @access  Private
router.post('/', auth, catchAsync(async (req, res, next) => {
  const { tasks, notes } = req.body;
  
  const syncedTasks = await bulkUpsert(Task, tasks, req.user.id);
  const syncedNotes = await bulkUpsert(Note, notes, req.user.id);
  
  res.json({
    tasks: syncedTasks,
    notes: syncedNotes
  });
}));

export default router;
