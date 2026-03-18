const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    age: {
      type: Number,
      default: null,
    },
    location: {
      type: String,
      default: '',
    },
    locationCoords: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    gender: {
      type: String,
      enum: ['male', 'female', ''],
      default: '',
    },
    balance: {
      type: Number,
      default: 0,
    },
    // Student specific
    school: {
      type: String,
      default: '',
    },
    level: {
      type: String,
      default: '',
    },
    // Profile picture
    profilePicture: {
      type: String,
      default: '',
    },
    // Teacher specific
    isProfileApproved: {
      type: Boolean,
      default: false,
    },
    targetLevels: {
      type: [String],
      enum: ['ابتدائي', 'متوسط', 'ثانوي', 'جامعي'],
      default: [],
    },
    certifications: {
      type: [String],
      default: [],
    },
    cvFile: {
      type: String,
      default: '',
    },
    subjects: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
    },
    completedSessions: {
      type: Number,
      default: 0,
    },
    bankAccount: {
      bankName: { type: String, default: '' },
      iban: { type: String, default: '' },
      accountHolder: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
