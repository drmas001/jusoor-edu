const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/wallet/deposit — Simulate adding funds
router.post('/deposit', auth, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    req.user.balance += amount;
    await req.user.save();

    await new Transaction({
      userId: req.user._id,
      amount,
      type: 'deposit',
    }).save();

    res.json({ balance: req.user.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/wallet/transactions — Get user's transaction history
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/wallet/bank-account — Update teacher bank account info
router.put('/bank-account', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can update bank account' });
    }

    const { bankName, iban, accountHolder } = req.body;

    if (!bankName || !iban || !accountHolder) {
      return res.status(400).json({ message: 'جميع حقول الحساب البنكي مطلوبة' });
    }

    // Basic IBAN validation for Saudi Arabia (SA + 22 chars)
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    if (!/^SA\d{22}$/.test(cleanIban)) {
      return res.status(400).json({ message: 'رقم IBAN غير صالح. يجب أن يبدأ بـ SA ويتكون من 24 حرف' });
    }

    req.user.bankAccount = {
      bankName: bankName.trim(),
      iban: cleanIban,
      accountHolder: accountHolder.trim(),
    };
    await req.user.save();

    res.json({ bankAccount: req.user.bankAccount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/wallet/withdraw — Withdraw balance to bank account (min 100 SAR)
router.post('/withdraw', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can withdraw' });
    }

    const { amount } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ message: 'الحد الأدنى للسحب 100 ر.س' });
    }

    if (req.user.balance < amount) {
      return res.status(400).json({ message: `رصيدك غير كافٍ. الرصيد الحالي: ${req.user.balance} ر.س` });
    }

    if (!req.user.bankAccount?.iban || !req.user.bankAccount?.bankName) {
      return res.status(400).json({ message: 'يجب إضافة حساب بنكي أولاً' });
    }

    // Deduct from balance
    req.user.balance -= amount;
    await req.user.save();

    // Record withdrawal transaction
    await new Transaction({
      userId: req.user._id,
      amount: -amount,
      type: 'withdrawal',
    }).save();

    res.json({
      balance: req.user.balance,
      message: `تم تحويل ${amount} ر.س إلى حسابك البنكي ${req.user.bankAccount.bankName} بنجاح`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
