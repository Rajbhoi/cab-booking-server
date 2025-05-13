// utils/mailer.js
const nodemailer = require('nodemailer')

exports.sendBookingConfirmationEmail = async (data, pdfBuffer) => {
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
      <p>Attached is your receipt.</p>
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
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  })
}
