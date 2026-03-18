const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// In-memory store for support tickets (replace with a model if needed)
const tickets = [];

// POST /api/support — Submit a support ticket
router.post('/', auth, async (req, res) => {
  try {
    const { category, subject, message } = req.body;

    if (!category || !subject || !message) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }

    const ticket = {
      _id: Date.now().toString(),
      userId: req.user._id,
      userName: req.user.name,
      userPhone: req.user.phone,
      userRole: req.user.role,
      category,
      subject,
      message,
      status: 'open',
      createdAt: new Date(),
    };

    tickets.push(ticket);

    // Log for admin visibility
    console.log(`[SUPPORT] New ticket from ${req.user.name} (${req.user.phone}): ${subject}`);

    res.status(201).json({ message: 'تم إرسال رسالتك بنجاح', ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/support — Admin: list all tickets
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    res.json(tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
