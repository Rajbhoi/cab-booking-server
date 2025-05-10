const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

const app = express()

// ✅ CORS CONFIGURATION
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
}
app.use(cors(corsOptions))

app.use(express.json())

// ✅ MONGOOSE CONNECTION
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Mongo connection error:', err))

// ✅ SCHEMA
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
  createdAt: { type: Date, default: Date.now }
})

const Booking = mongoose.model('Booking', bookingSchema)

// ✅ ROUTES
app.post('/api/bookings', async (req, res) => {
  try {
    const data = req.body
    const booking = await Booking.create(data)
    res.json({ message: 'Booking added!', booking })
  } catch (err) {
    console.error('POST /api/bookings error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 })
    res.json(bookings)
  } catch (err) {
    console.error('GET /api/bookings error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ✅ START SERVER
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
