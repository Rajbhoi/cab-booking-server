const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const http = require('http');
const server = http.createServer(app);

// Routers
const authRouter = require('./routes/auth'); // <-- NEW
const adminRouter = require('./routes/admin');
const bookingsRouter = require('./routes/bookings');

// Middleware
const authMiddleware = require('./middleware/authMiddleware');

// CORS setup
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'https://cab-booking-web.netlify.app',
  'https://cab-booking-admin.netlify.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Mongo connection error:', err));

// Public routes
app.use('/api/auth', authRouter); // <-- NEW
app.use('/api/bookings', bookingsRouter);

// Protected routes
app.use('/api/admin', authMiddleware, adminRouter);

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`🚕 Server running on port ${PORT}`));
