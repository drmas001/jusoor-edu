const express = require('express');
const Offer = require('../models/Offer');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

const PLATFORM_FEE = 15;

// POST /api/offers — Student requests a teacher
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can create offers' });
    }

    const { teacherId, subject, mode, price } = req.body;

    // Check student wallet balance
    if (req.user.balance < price) {
      return res.status(400).json({ message: 'رصيدك غير كافٍ. يرجى شحن المحفظة أولاً' });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Block duplicate: check for existing pending/admin_review offer to same teacher
    const existingOffer = await Offer.findOne({
      studentId: req.user._id,
      teacherId,
      status: { $in: ['pending', 'admin_review'] },
    });
    if (existingOffer) {
      return res.status(400).json({ message: 'لديك عرض قائم مع هذا المعلم بالفعل. انتظر حتى يتم قبوله أو رفضه' });
    }

    const offer = new Offer({
      studentId: req.user._id,
      teacherId,
      subject,
      mode,
      price,
      lastActionBy: 'student',
      priceHistory: [price],
    });

    await offer.save();

    const populated = await Offer.findById(offer._id)
      .populate('studentId', 'name gender level')
      .populate('teacherId', 'name subjects rating completedSessions gender');

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/offers — Get offers for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const query =
      req.user.role === 'student'
        ? { studentId: req.user._id }
        : { teacherId: req.user._id };

    const offers = await Offer.find(query)
      .populate('studentId', 'name gender level phone location locationCoords')
      .populate('teacherId', 'name subjects rating completedSessions gender')
      .sort({ updatedAt: -1 });

    // Hide student phone/location from teacher unless fee is paid and offer is accepted
    const sanitized = offers.map((offer) => {
      const obj = offer.toObject();
      if (
        req.user.role === 'teacher' &&
        !(obj.status === 'accepted' && obj.isFeePaid === true)
      ) {
        if (obj.studentId) {
          obj.studentId.phone = undefined;
          obj.studentId.location = undefined;
          obj.studentId.locationCoords = undefined;
        }
      }
      return obj;
    });

    res.json(sanitized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/offers/:id/negotiate — Update price
router.put('/:id/negotiate', auth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Verify the user is part of this offer
    const isStudent = offer.studentId.toString() === req.user._id.toString();
    const isTeacher = offer.teacherId.toString() === req.user._id.toString();
    if (!isStudent && !isTeacher) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Cannot negotiate if not pending
    if (offer.status !== 'pending') {
      return res.status(400).json({ message: 'Can only negotiate pending offers' });
    }

    // Cannot negotiate twice in a row
    const currentRole = req.user.role;
    if (offer.lastActionBy === currentRole) {
      return res.status(400).json({ message: 'Wait for the other party to respond' });
    }

    const { price } = req.body;
    if (!price || price <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }

    offer.price = price;
    offer.lastActionBy = currentRole;
    offer.priceHistory.push(price);
    await offer.save();

    const populated = await Offer.findById(offer._id)
      .populate('studentId', 'name gender level')
      .populate('teacherId', 'name subjects rating completedSessions gender');

    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/offers/:id/accept — Accept the offer
// Teacher accept: must have paid fee → goes to admin_review
// Student accept: goes to admin_review (teacher still needs to pay fee before admin can approve)
router.put('/:id/accept', auth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const isStudent = offer.studentId.toString() === req.user._id.toString();
    const isTeacher = offer.teacherId.toString() === req.user._id.toString();
    if (!isStudent && !isTeacher) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({ message: 'Can only accept pending offers' });
    }

    // The accepting party must be the one who did NOT last act
    if (offer.lastActionBy === req.user.role) {
      return res.status(400).json({ message: 'Cannot accept your own proposal. Wait for the other party.' });
    }

    // If teacher accepts, fee must be paid first
    if (isTeacher && !offer.isFeePaid) {
      return res.status(400).json({ message: 'يجب دفع رسوم المنصة أولاً قبل القبول' });
    }

    // Move to admin review instead of direct acceptance
    offer.status = 'admin_review';
    await offer.save();

    const populated = await Offer.findById(offer._id)
      .populate('studentId', 'name gender level')
      .populate('teacherId', 'name subjects rating completedSessions gender');

    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/offers/:id/reject — Reject the offer
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const isStudent = offer.studentId.toString() === req.user._id.toString();
    const isTeacher = offer.teacherId.toString() === req.user._id.toString();
    if (!isStudent && !isTeacher) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({ message: 'Can only reject pending offers' });
    }

    offer.status = 'rejected';
    await offer.save();

    res.json(offer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/offers/:id/pay-fee — Teacher pays 15 SAR platform fee
// Fee is charged through payment gateway (create-charge), this route just verifies
router.post('/:id/pay-fee', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can pay the platform fee' });
    }

    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!['pending', 'accepted', 'admin_review'].includes(offer.status)) {
      return res.status(400).json({ message: 'Cannot pay fee for this offer status' });
    }

    if (offer.isFeePaid) {
      return res.status(400).json({ message: 'Fee already paid' });
    }

    // Fee is collected via payment gateway (Apple Pay / Google Pay / Credit Card)
    // No wallet balance deduction — the 15 SAR is paid externally per offer
    offer.isFeePaid = true;
    await offer.save();

    // Record transaction for bookkeeping
    await new Transaction({
      userId: req.user._id,
      amount: -PLATFORM_FEE,
      type: 'platform_fee',
    }).save();

    const populated = await Offer.findById(offer._id)
      .populate('studentId', 'name gender level phone location')
      .populate('teacherId', 'name subjects rating completedSessions gender balance');

    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/offers/:id/complete — Mark offer as completed (teacher or student can do this)
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const isStudent = offer.studentId.toString() === req.user._id.toString();
    const isTeacher = offer.teacherId.toString() === req.user._id.toString();
    if (!isStudent && !isTeacher) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (offer.status !== 'accepted') {
      return res.status(400).json({ message: 'Offer must be accepted before completing' });
    }

    offer.status = 'completed';
    await offer.save();

    // Increment teacher's completed sessions
    await User.findByIdAndUpdate(offer.teacherId, {
      $inc: { completedSessions: 1 },
    });

    const populated = await Offer.findById(offer._id)
      .populate('studentId', 'name gender level')
      .populate('teacherId', 'name subjects rating completedSessions gender');

    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/offers/:id/start-meeting — Start the online meeting timer
router.put('/:id/start-meeting', auth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const isStudent = offer.studentId.toString() === req.user._id.toString();
    const isTeacher = offer.teacherId.toString() === req.user._id.toString();
    if (!isStudent && !isTeacher) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (offer.status !== 'accepted' || offer.mode !== 'online') {
      return res.status(400).json({ message: 'Invalid offer state' });
    }

    if (!offer.meeting?.link) {
      return res.status(400).json({ message: 'لا يوجد رابط اجتماع لهذا العرض' });
    }

    // Only start if not already started
    if (!offer.meeting.startedAt) {
      offer.meeting.startedAt = new Date();
      await offer.save();
    }

    res.json({ message: 'تم بدء الجلسة', offer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/offers/:id/teacher-arrived — Teacher signals arrival at student location
router.put('/:id/teacher-arrived', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can signal arrival' });
    }

    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    if (offer.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (offer.status !== 'accepted' || !offer.isFeePaid) {
      return res.status(400).json({ message: 'Offer must be accepted and fee paid' });
    }
    if (offer.mode !== 'in-person') {
      return res.status(400).json({ message: 'Attendance only for in-person sessions' });
    }

    offer.attendance.teacherArrived = true;
    offer.attendance.teacherArrivedAt = new Date();
    await offer.save();

    res.json({ message: 'تم تسجيل وصولك بنجاح', offer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/offers/:id/student-confirm — Student confirms teacher attendance
router.put('/:id/student-confirm', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can confirm attendance' });
    }

    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    if (offer.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!offer.attendance.teacherArrived) {
      return res.status(400).json({ message: 'Teacher has not arrived yet' });
    }

    offer.attendance.studentConfirmed = true;
    offer.attendance.studentConfirmedAt = new Date();
    await offer.save();

    res.json({ message: 'تم تأكيد الحضور بنجاح', offer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
