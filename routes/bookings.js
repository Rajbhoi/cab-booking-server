// routes/bookings.js
const express = require('express')
const router = express.Router()
const controller = require('../controllers/bookingController')
const { verifyToken } = require('../middleware/authMiddleware')

router.post('/', controller.createBooking) // Public route for customer
router.get('/', controller.getBookings) // Admin only
router.delete('/:id', controller.deleteBooking)
router.put('/:id', controller.updateBooking)
// router.put('/:id', verifyToken, controller.updateBooking)

module.exports = router
