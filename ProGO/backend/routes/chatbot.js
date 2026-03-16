const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Middleware to check session
const checkSession = (req, res, next) => {

  // Check authentication
  if (!req.session.authenticated) {
    return res.status(401).json({
      success: false,
      message: 'Session expired. Please authenticate again.'
    });
  }

  // If student login
  if (req.session.role === 'student') {
    if (!req.session.studentId) {
      req.session.studentId = req.session.userId;
    }
  }

  // If parent login
  if (req.session.parentId && req.session.studentId) {
    return next();
  }

  // If student login
  if (req.session.studentId) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid session'
  });
};

// Process chatbot message
router.post('/message', checkSession, chatbotController.processMessage.bind(chatbotController));

// Get menu options
router.get('/menu', checkSession, (req, res) => {
  const menu = chatbotController.getMenuOptions();
  res.json({
    success: true,
    data: { menu }
  });
});

// Initialize chat session
router.post('/init', checkSession, async (req, res) => {
  try {
    const Student = require('../models/Student');
    const student = await Student.findById(req.session.studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const welcomeMessage = `Welcome to the Student Academic Information System!\n\nHello! I'm your academic assistant for ${student.firstName} ${student.lastName} (${student.registrationNumber}).\n\nI can help you with:\n• Attendance information\n• Academic performance and grades\n• Exam schedules\n• Fee status\n• Notifications and announcements\n• Faculty contact details\n• ML-powered performance predictions\n\nHow can I assist you today?`;

    res.json({
      success: true,
      data: {
        message: welcomeMessage,
        student: {
          name: `${student.firstName} ${student.lastName}`,
          registrationNumber: student.registrationNumber,
          department: student.department,
          year: student.year,
          semester: student.semester
        },
        menu: chatbotController.getMenuOptions()
      }
    });
  } catch (error) {
    console.error('Error initializing chatbot:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing chatbot'
    });
  }
});

module.exports = router;
