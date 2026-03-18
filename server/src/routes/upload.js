const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');

const router = express.Router();

// Certification uploads
const certStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/certifications'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}_${Date.now()}${ext}`);
  },
});

// CV uploads
const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/cv'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}_${Date.now()}${ext}`);
  },
});

// Profile picture uploads
const profilePicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/profile-pictures'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}_${Date.now()}${ext}`);
  },
});

const imageFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم. الأنواع المسموحة: JPG, PNG, WEBP'));
  }
};

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم. الأنواع المسموحة: PDF, JPG, PNG, DOC, DOCX'));
  }
};

const uploadCerts = multer({
  storage: certStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).array('certifications', 5);

const uploadCV = multer({
  storage: cvStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('cv');

// POST /api/upload/certifications
router.post('/certifications', auth, (req, res) => {
  uploadCerts(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'خطأ في رفع الملف' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'لم يتم اختيار ملفات' });
    }
    const paths = req.files.map((f) => `/uploads/certifications/${f.filename}`);
    res.json({ files: paths });
  });
});

// POST /api/upload/cv
router.post('/cv', auth, (req, res) => {
  uploadCV(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'خطأ في رفع الملف' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم اختيار ملف' });
    }
    res.json({ file: `/uploads/cv/${req.file.filename}` });
  });
});

// POST /api/upload/profile-picture
const uploadProfilePic = multer({
  storage: profilePicStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('profilePicture');

router.post('/profile-picture', auth, (req, res) => {
  uploadProfilePic(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'خطأ في رفع الصورة' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم اختيار صورة' });
    }
    res.json({ file: `/uploads/profile-pictures/${req.file.filename}` });
  });
});

module.exports = router;
