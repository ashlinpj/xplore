import express from 'express';
import Bug from '../models/Bug.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @desc    Report a new bug
// @route   POST /api/bugs
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { title, description, category, priority, reporterEmail, reporterName, page, browser } = req.body;

    if (!title || !description || !reporterEmail || !reporterName) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    const bug = await Bug.create({
      title,
      description,
      category: category || 'Other',
      priority: priority || 'Medium',
      reporterEmail,
      reporterName,
      page,
      browser,
      reportedBy: req.user?._id || null
    });

    res.status(201).json({
      message: 'Bug report submitted successfully. Thank you for your feedback!',
      bug: {
        _id: bug._id,
        title: bug.title,
        status: bug.status
      }
    });
  } catch (error) {
    console.error('Bug report error:', error);
    res.status(500).json({ message: 'Failed to submit bug report', error: error.message });
  }
});

// @desc    Get all bugs (Admin only)
// @route   GET /api/bugs
// @access  Private (Admin)
router.get('/', protect, admin, async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const bugs = await Bug.find(filter)
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'username email');

    const stats = {
      total: await Bug.countDocuments(),
      open: await Bug.countDocuments({ status: 'Open' }),
      inProgress: await Bug.countDocuments({ status: 'In Progress' }),
      resolved: await Bug.countDocuments({ status: 'Resolved' }),
      closed: await Bug.countDocuments({ status: 'Closed' })
    };

    res.json({ bugs, stats });
  } catch (error) {
    console.error('Get bugs error:', error);
    res.status(500).json({ message: 'Failed to fetch bug reports', error: error.message });
  }
});

// @desc    Get single bug (Admin only)
// @route   GET /api/bugs/:id
// @access  Private (Admin)
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id).populate('reportedBy', 'username email');
    
    if (!bug) {
      return res.status(404).json({ message: 'Bug report not found' });
    }

    res.json(bug);
  } catch (error) {
    console.error('Get bug error:', error);
    res.status(500).json({ message: 'Failed to fetch bug report', error: error.message });
  }
});

// @desc    Update bug status (Admin only)
// @route   PUT /api/bugs/:id
// @access  Private (Admin)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { status, priority, adminNotes } = req.body;

    const bug = await Bug.findById(req.params.id);
    
    if (!bug) {
      return res.status(404).json({ message: 'Bug report not found' });
    }

    if (status) bug.status = status;
    if (priority) bug.priority = priority;
    if (adminNotes !== undefined) bug.adminNotes = adminNotes;

    await bug.save();

    res.json({ message: 'Bug report updated', bug });
  } catch (error) {
    console.error('Update bug error:', error);
    res.status(500).json({ message: 'Failed to update bug report', error: error.message });
  }
});

// @desc    Delete bug (Admin only)
// @route   DELETE /api/bugs/:id
// @access  Private (Admin)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const bug = await Bug.findByIdAndDelete(req.params.id);
    
    if (!bug) {
      return res.status(404).json({ message: 'Bug report not found' });
    }

    res.json({ message: 'Bug report deleted' });
  } catch (error) {
    console.error('Delete bug error:', error);
    res.status(500).json({ message: 'Failed to delete bug report', error: error.message });
  }
});

export default router;
