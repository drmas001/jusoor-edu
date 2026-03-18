const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      enum: ['in-person', 'online'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'admin_review'],
      default: 'pending',
    },
    lastActionBy: {
      type: String,
      enum: ['student', 'teacher'],
      required: true,
    },
    isFeePaid: {
      type: Boolean,
      default: false,
    },
    // Payment holding: student money blocked until session complete
    isPaymentHeld: {
      type: Boolean,
      default: false,
    },
    isPaymentReleased: {
      type: Boolean,
      default: false,
    },
    priceHistory: {
      type: [Number],
      default: [],
    },
    // Review tracking
    isReviewed: {
      type: Boolean,
      default: false,
    },
    // Online meeting (video call)
    meeting: {
      link: { type: String, default: null },
      roomName: { type: String, default: null },
      startedAt: { type: Date, default: null },
      duration: { type: Number, default: 45 }, // minutes
    },
    // Attendance tracking (for in-person sessions)
    attendance: {
      // Teacher signals they arrived at student location
      teacherArrived: { type: Boolean, default: false },
      teacherArrivedAt: { type: Date, default: null },
      // Student confirms the teacher is present
      studentConfirmed: { type: Boolean, default: false },
      studentConfirmedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', offerSchema);
