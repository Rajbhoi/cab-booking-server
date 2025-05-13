const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const User = require('../models/User')
const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

// ====== LOGIN ======
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' })

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' })

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 3600000,
    })

    res.json({ message: 'Login successful' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// ====== SIGNUP ======
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body
    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ message: 'Email already in use' })

    const hashed = await bcrypt.hash(password, 10)
    const user = new User({ email, password: hashed })
    await user.save()

    res.json({ message: 'Signup successful' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// ====== LOGOUT ======
router.post('/logout', (req, res) => {
  res.clearCookie('token')
  res.json({ message: 'Logged out' })
})

// ====== CURRENT USER ======
router.get('/me', (req, res) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ message: 'No token' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    res.json({ user: decoded })
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' })
  }
})

// ====== FORGOT PASSWORD ======
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const token = crypto.randomBytes(32).toString('hex')
    user.resetToken = token
    user.resetTokenExpire = Date.now() + 1000 * 60 * 15 // 15 minutes
    await user.save()

    const resetUrl = `http://localhost:3000/reset-password/${token}`

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    const mailOptions = {
      to: user.email,
      subject: 'Password Reset - Cab Booking Admin',
      html: `<p>You requested a password reset</p>
             <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    }

    await transporter.sendMail(mailOptions)
    res.json({ message: 'Reset email sent' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Email could not be sent' })
  }
})

// ====== RESET PASSWORD ======
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    })

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' })

    const hashed = await bcrypt.hash(password, 10)
    user.password = hashed
    user.resetToken = undefined
    user.resetTokenExpire = undefined
    await user.save()

    res.json({ message: 'Password has been reset' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
