const express = require('express');
const Review = require('../models/Review');
const Offer = require('../models/Offer');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews — Student submits a review for a completed offer
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'فقط الطلاب يمكنهم تقييم المعلمين' });
    }

    const { offerId, rating, comment } = req.body;

    if (!offerId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'يرجى إدخال تقييم صالح (1-5)' });
    }

    // Verify the offer exists, belongs to this student, and is completed
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: 'العرض غير موجود' });
    }
    if (offer.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'غير مصرح لك' });
    }
    if (offer.status !== 'completed') {
      return res.status(400).json({ message: 'يمكن التقييم فقط بعد اكتمال الجلسة' });
    }

    // Check if already reviewed
    const existing = await Review.findOne({ offerId });
    if (existing) {
      return res.status(400).json({ message: 'تم تقييم هذه الجلسة مسبقاً' });
    }

    const review = new Review({
      studentId: req.user._id,
      teacherId: offer.teacherId,
      offerId,
      rating,
      comment: comment || '',
    });
    await review.save();

    // Mark offer as reviewed
    offer.isReviewed = true;
    await offer.save();

    // Update teacher's average rating
    const allReviews = await Review.find({ teacherId: offer.teacherId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await User.findByIdAndUpdate(offer.teacherId, {
      rating: Math.round(avgRating * 10) / 10, // round to 1 decimal
    });

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'تم تقييم هذه الجلسة مسبقاً' });
    }
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
});

// GET /api/reviews/teacher/:teacherId — Get all reviews for a teacher
router.get('/teacher/:teacherId', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ teacherId: req.params.teacherId })
      .populate('studentId', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
});

// GET /api/reviews/offer/:offerId — Check if an offer has been reviewed
router.get('/offer/:offerId', auth, async (req, res) => {
  try {
    const review = await Review.findOne({ offerId: req.params.offerId });
    res.json({ reviewed: !!review, review });
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
});

module.exports = router;
