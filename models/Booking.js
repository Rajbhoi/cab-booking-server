// models/Booking.js
const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
  city: String,
  pickupPoint: String,
  dropPoint: String,
  pickupDate: String,
  passengerCount: Number,
  firstName: String,
  lastName: String,
  email: String,
  agent: String,
  agentEmail: String,
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Booking', bookingSchema)
