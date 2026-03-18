const express = require('express');
const User = require('../models/User');
const Offer = require('../models/Offer');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// All admin routes require auth + admin role
router.use(auth, admin);

// GET /api/admin/stats — Dashboard overview stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      pendingTeacherProfiles,
      totalOffers,
      pendingOffers,
      acceptedOffers,
      rejectedOffers,
      completedOffers,
      adminReviewOffers,
      totalTransactions,
      feeRevenue,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'teacher', isProfileApproved: false }),
      Offer.countDocuments(),
      Offer.countDocuments({ status: 'pending' }),
      Offer.countDocuments({ status: 'accepted' }),
      Offer.countDocuments({ status: 'rejected' }),
      Offer.countDocuments({ status: 'completed' }),
      Offer.countDocuments({ status: 'admin_review' }),
      Transaction.countDocuments(),
      Transaction.aggregate([
        { $match: { type: 'platform_fee' } },
        { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } },
      ]),
    ]);

    res.json({
      users: {
        students: totalStudents,
        teachers: totalTeachers,
        total: totalStudents + totalTeachers,
        pendingTeacherProfiles,
      },
      offers: {
        total: totalOffers,
        pending: pendingOffers,
        accepted: acceptedOffers,
        rejected: rejectedOffers,
        completed: completedOffers,
        adminReview: adminReviewOffers,
      },
      transactions: {
        total: totalTransactions,
        platformRevenue: feeRevenue[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/users — List all users
router.get('/users', async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/users/:id — Delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete admin' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/teachers/pending — List teachers awaiting profile approval
router.get('/teachers/pending', async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', isProfileApproved: false })
      .select('name phone gender location subjects targetLevels certifications cvFile profilePicture createdAt')
      .sort({ createdAt: -1 });
    res.json(teachers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/teachers/:id/approve — Approve teacher profile
router.put('/teachers/:id/approve', async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    if (teacher.role !== 'teacher') return res.status(400).json({ message: 'User is not a teacher' });

    teacher.isProfileApproved = true;
    await teacher.save();
    res.json(teacher);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/teachers/:id/reject — Reject teacher profile (reset approval)
router.put('/teachers/:id/reject', async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    if (teacher.role !== 'teacher') return res.status(400).json({ message: 'User is not a teacher' });

    teacher.isProfileApproved = false;
    await teacher.save();
    res.json(teacher);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/offers — List all offers
router.get('/offers', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const offers = await Offer.find(filter)
      .populate('studentId', 'name phone balance')
      .populate('teacherId', 'name phone balance')
      .sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/offers/:id/approve — Admin approves an offer (admin_review → accepted)
// Blocks (holds) the student's payment until session is completed
router.put('/offers/:id/approve', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (offer.status !== 'admin_review') {
      return res.status(400).json({ message: 'Only offers in admin review can be approved' });
    }

    if (!offer.isFeePaid) {
      return res.status(400).json({ message: 'لم يتم دفع رسوم المنصة بعد. لا يمكن الموافقة.' });
    }

    // Check student has enough balance for the offer price
    const student = await User.findById(offer.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    if (student.balance < offer.price) {
      return res.status(400).json({
        message: `رصيد الطالب غير كافٍ. الرصيد: ${student.balance} ر.س — المطلوب: ${offer.price} ر.س`,
      });
    }

    // HOLD: Deduct from student but do NOT transfer to teacher yet
    student.balance -= offer.price;
    await student.save();

    // Record hold transaction for student
    await new Transaction({
      userId: student._id,
      amount: -offer.price,
      type: 'session_payment',
    }).save();

    offer.status = 'accepted';
    offer.isPaymentHeld = true;
    offer.isPaymentReleased = false;

    // For online sessions: generate video call meeting link
    if (offer.mode === 'online') {
      const roomName = `HKC-${offer._id.toString().slice(-8)}-${Date.now().toString(36)}`;
      offer.meeting = {
        link: `https://meet.jit.si/${roomName}`,
        roomName,
        startedAt: null,
        duration: 45,
      };
    }

    await offer.save();

    const populated = await Offer.findById(offer._id)
      .populate('studentId', 'name phone')
      .populate('teacherId', 'name phone');

    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/offers/:id/release-payment — Release held payment to teacher
// Only after session is completed + student confirmed attendance
router.put('/offers/:id/release-payment', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (offer.status !== 'completed') {
      return res.status(400).json({ message: 'يمكن تحرير الدفعة فقط بعد إكمال الجلسة' });
    }

    if (!offer.isPaymentHeld) {
      return res.status(400).json({ message: 'لا يوجد مبلغ محجوز لهذا العرض' });
    }

    if (offer.isPaymentReleased) {
      return res.status(400).json({ message: 'تم تحرير الدفعة مسبقاً' });
    }

    // Check student confirmed attendance (for in-person)
    if (offer.mode === 'in-person' && !offer.attendance?.studentConfirmed) {
      return res.status(400).json({ message: 'لم يتم تأكيد حضور الطالب بعد' });
    }

    // Release payment to teacher
    const teacher = await User.findById(offer.teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    teacher.balance += offer.price;
    await teacher.save();

    // Record teacher earning
    await new Transaction({
      userId: teacher._id,
      amount: offer.price,
      type: 'session_earning',
    }).save();

    offer.isPaymentReleased = true;
    await offer.save();

    const populated = await Offer.findById(offer._id)
      .populate('studentId', 'name phone')
      .populate('teacherId', 'name phone');

    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/offers/:id/reject — Admin rejects an offer (admin_review → rejected)
router.put('/offers/:id/reject', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (offer.status !== 'admin_review') {
      return res.status(400).json({ message: 'Only offers in admin review can be rejected' });
    }

    offer.status = 'rejected';
    await offer.save();

    // If fee was paid, refund the teacher
    if (offer.isFeePaid) {
      const Transaction = require('../models/Transaction');
      const teacher = await User.findById(offer.teacherId);
      if (teacher) {
        teacher.balance += 15;
        await teacher.save();
        await new Transaction({
          userId: teacher._id,
          amount: 15,
          type: 'refund',
        }).save();
      }
      offer.isFeePaid = false;
      await offer.save();
    }

    res.json(offer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/transactions — List all transactions
router.get('/transactions', async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;

    const transactions = await Transaction.find(filter)
      .populate('userId', 'name phone role')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
