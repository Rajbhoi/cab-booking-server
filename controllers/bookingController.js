// controllers/bookingController.js
const Booking = require('../models/Booking')
const { sendBookingConfirmationEmail } = require('../utils/mailer')
const PDFDocument = require('pdfkit')

exports.createBooking = async (req, res) => {
  try {
    const data = req.body
    const booking = await Booking.create(data)

    // Generate PDF
    const doc = new PDFDocument()
    let buffers = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers)
      await sendBookingConfirmationEmail(data, pdfData)
      res.json({ message: 'Booking confirmed. Email sent.', booking })
    })

    doc.fontSize(20).text('Cab Booking Receipt', { align: 'center' })
    doc.moveDown()
    doc.fontSize(12)
    doc.text(`Name: ${data.firstName} ${data.lastName}`)
    doc.text(`Email: ${data.email}`)
    doc.text(`City: ${data.city}`)
    doc.text(`Pickup: ${data.pickupPoint}`)
    doc.text(`Drop: ${data.dropPoint}`)
    doc.text(`Pickup Date: ${data.pickupDate}`)
    doc.text(`Passenger Count: ${data.passengerCount}`)
    doc.text(`Agent: ${data.agent}`)
    doc.end()
  } catch (err) {
    console.error('POST /api/bookings error:', err)
    res.status(500).json({ error: err.message })
  }
}

exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 })
    res.json(bookings)
  } catch (err) {
    console.error('GET /api/bookings error:', err)
    res.status(500).json({ error: err.message })
  }
}

exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await Booking.findByIdAndDelete(id)
    if (!deleted) return res.status(404).json({ error: 'Booking not found' })
    res.json({ message: 'Booking deleted successfully' })
  } catch (err) {
    console.error('DELETE /api/bookings/:id error:', err)
    res.status(500).json({ error: err.message })
  }
}

exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params
    const updatedBooking = await Booking.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!updatedBooking) return res.status(404).json({ error: 'Booking not found' })
    res.json(updatedBooking)
  } catch (err) {
    console.error('PUT /api/bookings/:id error:', err)
    res.status(500).json({ error: err.message })
  }
}
