const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: parseInt(process.env.SESSION_TIMEOUT) || 1800000 // 30 minutes default
  }
}));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parent_student_chatbot', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✓ MongoDB connected successfully'))
.catch(err => {
  console.warn('⚠ MongoDB connection failed:', err.message);
  console.warn('⚠ Server will run without database - using mock data');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/student', require('./routes/student'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  const missingWhatsAppKeys = [
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_VERIFY_TOKEN'
  ].filter((key) => !process.env[key]);

  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📚 Parent-Student Chatbot System`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}\n`);

  if (missingWhatsAppKeys.length > 0) {
    console.warn(`⚠ WhatsApp is not fully configured. Missing: ${missingWhatsAppKeys.join(', ')}`);
    console.warn('⚠ Configure these env vars before verifying the Meta webhook or sending messages.');
  }
});
