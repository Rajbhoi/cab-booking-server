const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const nodemailer = require('nodemailer')
const PDFDocument = require('pdfkit')
require('dotenv').config()

const app = express()

// ✅ CORS CONFIGURATION
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))
app.use(express.json())

const http = require('http')
const server = http.createServer(app)

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
  agentEmail: String,
  createdAt: { type: Date, default: Date.now }
})

const Booking = mongoose.model('Booking', bookingSchema)

// ✅ ROUTES
app.post('/api/bookings', async (req, res) => {
  try {
    const data = req.body

    // 1. Save to MongoDB
    const booking = await Booking.create(data)

    // 2. Create PDF receipt
    const doc = new PDFDocument()
    let buffers = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers)

      // 3. Setup email transport
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      })

      const recipients = [data.email, data.agentEmail].filter(Boolean)

      const html = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #e27209;">Your Cab Booking is Confirmed</h2>
          <p>Hi ${data.firstName},</p>
          <p>Thank you for booking with us. Here are your ride details:</p>
          <ul style="line-height: 1.6;">
            <li><strong>City:</strong> ${data.city}</li>
            <li><strong>Pickup:</strong> ${data.pickupPoint}</li>
            <li><strong>Drop:</strong> ${data.dropPoint}</li>
            <li><strong>Date:</strong> ${data.pickupDate}</li>
            <li><strong>Passengers:</strong> ${data.passengerCount}</li>
          </ul>
          <p style="margin-top: 20px;">Attached is your booking receipt (PDF).</p>
          <p>Thank you,<br/>Cab Booking Team</p>
        </div>
      `

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: recipients,
        subject: 'Cab Booking Confirmation',
        html,
        attachments: [
          {
            filename: 'booking-receipt.pdf',
            content: pdfData,
            contentType: 'application/pdf'
          }
        ]
      })

      res.json({ message: 'Booking confirmed. Email sent.', booking })
    })

    // Write the PDF content
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
})

// ✅ GET route for viewing all bookings
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
const PORT = process.env.PORT || 8000
server.listen(PORT, () => console.log(`🚕 Server running on port ${PORT}`))
