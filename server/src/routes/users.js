const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// PUT /api/users/profile — Only allow profilePicture, certifications, and cvFile updates
router.put('/profile', auth, async (req, res) => {
  try {
    const allowedFields = ['profilePicture', 'certifications', 'cvFile'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // If teacher updates profile content, reset approval
    if (req.user.role === 'teacher' && (updates.certifications || updates.cvFile)) {
      updates.isProfileApproved = false;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/teachers — Only show approved teachers, auto-filter by gender & level
router.get('/teachers', auth, async (req, res) => {
  try {
    const filters = { role: 'teacher', isProfileApproved: true };

    // Auto-filter by requester's gender (male students see male teachers, etc.)
    if (req.user.gender) {
      filters.gender = req.user.gender;
    }

    if (req.query.subject) {
      filters.subjects = { $in: [req.query.subject] };
    }

    // Filter by student's level if student has one set
    if (req.user.role === 'student' && req.user.level) {
      filters.targetLevels = { $in: [req.user.level] };
    }

    const teachers = await User.find(filters)
      .select('name subjects rating completedSessions gender location targetLevels profilePicture')
      .sort({ rating: -1, completedSessions: -1 });

    res.json(teachers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
