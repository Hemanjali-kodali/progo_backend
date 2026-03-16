const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');
const router = express.Router();
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Course = require('../models/Course');

const execFileAsync = promisify(execFile);

function createOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  if (!name) return `***@${domain}`;
  return `${name[0]}***@${domain}`;
}

function getMailTransporter() {
  let nodemailer;
  try {
    // Lazy require so backend can still run even if nodemailer is not installed.
    nodemailer = require('nodemailer');
  } catch (error) {
    return null;
  }

  const user = process.env.EMAIL_USER;
  const passRaw = process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD || process.env.API_KEY;
  const pass = passRaw ? String(passRaw).replace(/\s+/g, '') : '';

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user,
      pass
    }
  });
}

async function sendMailWithPython({ user, pass, from, to, subject, text }) {
  const pythonCode = [
    'import smtplib, ssl, sys',
    'from email.message import EmailMessage',
    'user, password, sender, recipient, subject, body = sys.argv[1:7]',
    'msg = EmailMessage()',
    "msg['From'] = sender",
    "msg['To'] = recipient",
    "msg['Subject'] = subject",
    'msg.set_content(body)',
    "with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=ssl.create_default_context()) as server:",
    '    server.login(user, password)',
    '    server.send_message(msg)'
  ].join('\n');

  const password = String(pass || '').replace(/\s+/g, '');
  const args = ['-c', pythonCode, user, password, from, to, subject, text];

  try {
    await execFileAsync('python', args, { timeout: 30000 });
    return true;
  } catch (pythonError) {
    await execFileAsync('py', ['-3', ...args], { timeout: 30000 });
    return true;
  }
}

async function sendOtpEmail({ to, subject, text }) {
  const user = process.env.EMAIL_USER;
  const passRaw = process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD || process.env.API_KEY;
  const pass = passRaw ? String(passRaw).replace(/\s+/g, '') : '';
  const from = process.env.EMAIL_FROM || user;

  if (!user || !pass || !from) {
    const configError = new Error('Email API is not configured. Set EMAIL_USER and EMAIL_PASS (or API_KEY) in backend/.env');
    configError.code = 'EMAIL_CONFIG_MISSING';
    throw configError;
  }

  const transporter = getMailTransporter();
  if (transporter) {
    await transporter.sendMail({ from, to, subject, text });
    return;
  }

  await sendMailWithPython({ user, pass, from, to, subject, text });
}

// Simple Login for Student/Parent (matches frontend)
router.post('/login', async (req, res) => {
  try {
    const { registrationNumber, password, role } = req.body;

    if (!registrationNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Registration number and password are required'
      });
    }

    // Mock data for demo (when MongoDB is not available)
    if (role === 'student') {

  const regNum = registrationNumber.trim().toUpperCase();
  const regNumRegex = new RegExp(`^${regNum}$`, 'i');

  const student = await Student.findOne({
    registrationNumber: regNumRegex
  }).populate('courseId');

  if (!student) {
    return res.status(401).json({
      success: false,
      message: 'Student not found'
    });
  }

  let passwordMatches = false;
  if (student.passwordHash) {
    passwordMatches = await bcrypt.compare(password, student.passwordHash);
  } else {
    // Backward compatible default for old seeded records that do not have passwordHash.
    passwordMatches = password === 'password123';
  }

  if (!passwordMatches) {
    return res.status(401).json({
      success: false,
      message: "Invalid password"
    });
  }

  req.session.authenticated = true;
  req.session.role = 'student';
  req.session.userId = student._id;
  req.session.registrationNumber = student.registrationNumber;

  return res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      registrationNumber: student.registrationNumber,
      email: student.email,
      role: 'student',
      semester: student.semester,
      cgpa: student.currentCGPA
    }
  });
}

    if (role === 'student') {
      const regNum = registrationNumber.trim().toUpperCase();
      
      // Try database first, fallback to mock data
      let student;
      try {
        student = await Student.findOne({ 
          registrationNumber: regNum 
        }).populate('courseId');
      } catch (dbError) {
        // Database not available, use mock data
        const mockStudent = mockStudents[regNum];
        if (mockStudent) {
          student = mockStudent;
        }
      }

      if (!student) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Try REG001, REG002, or REG003'
        });
      }

      // Create session
      req.session.authenticated = true;
      req.session.role = 'student';
      req.session.userId = student._id || student.id;
      req.session.registrationNumber = student.registrationNumber || regNum;

      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: student._id || student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          registrationNumber: student.registrationNumber || regNum,
          email: student.email,
          role: 'student',
          courseId: student.courseId,
          semester: student.semester,
          cgpa: student.cgpa
        }
      });

    } else if (role === 'parent') {
      // Parent login with mock data
      let parent;
      try {
        parent = await Parent.findOne({ email: registrationNumber });
      } catch (dbError) {
        // Mock parent data
        if (registrationNumber === 'parent1@example.com') {
          parent = { _id: 'p1', firstName: 'John', lastName: 'Johnson', email: 'parent1@example.com' };
        }
      }

      if (!parent) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Create session
      req.session.authenticated = true;
      req.session.role = 'parent';
      req.session.userId = parent._id;

      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: parent._id,
          firstName: parent.firstName,
          lastName: parent.lastName,
          email: parent.email,
          role: 'parent'
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// Check session status
router.get('/session', async (req, res) => {
  try {
    if (!req.session.authenticated) {
      return res.status(401).json({
        success: false,
        authenticated: false
      });
    }

    // Mock data for when database is not available
    const mockStudents = {
      '1': { id: '1', firstName: 'Alice', lastName: 'Johnson', registrationNumber: 'REG001', email: 'alice@example.com', semester: 3, cgpa: 8.5 },
      '2': { id: '2', firstName: 'Bob', lastName: 'Smith', registrationNumber: 'REG002', email: 'bob@example.com', semester: 5, cgpa: 7.2 },
      '3': { id: '3', firstName: 'Charlie', lastName: 'Brown', registrationNumber: 'REG003', email: 'charlie@example.com', semester: 4, cgpa: 6.8 }
    };

    if (req.session.role === 'student') {
      if (!req.session.userId) {
        return res.status(401).json({ success: false, authenticated: false });
      }

      let student;
      try {
        student = await Student.findById(req.session.userId);
      } catch (dbError) {
        // Use mock data
        student = mockStudents[req.session.userId];
      }

      if (!student) {
        return res.status(401).json({ success: false, authenticated: false });
      }

      return res.json({
        success: true,
        authenticated: true,
        user: {
          id: student._id || student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          registrationNumber: student.registrationNumber,
          email: student.email,
          role: 'student',
          semester: student.semester,
          cgpa: student.cgpa
        }
      });
    } else if (req.session.role === 'parent') {
      const parentId = req.session.parentId || req.session.userId;
      if (!parentId || !req.session.studentId) {
        return res.status(401).json({ success: false, authenticated: false });
      }

      let parent;
      let student;
      try {
        parent = await Parent.findById(parentId);
        student = await Student.findById(req.session.studentId);
      } catch (dbError) {
        parent = { _id: 'p1', firstName: 'John', lastName: 'Johnson', email: 'parent1@example.com' };
      }

      if (!parent) {
        return res.status(401).json({ success: false, authenticated: false });
      }

      return res.json({
        success: true,
        authenticated: true,
        user: {
          id: parent._id,
          firstName: parent.firstName,
          lastName: parent.lastName,
          email: parent.email,
          phone: parent.phone,
          alternatePhone: parent.alternatePhone,
          relationship: parent.relationship,
          occupation: parent.occupation,
          address: parent.address,
          role: 'parent',
          linkedStudent: student ? {
            id: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            registrationNumber: student.registrationNumber,
            department: student.department,
            year: student.year,
            semester: student.semester
          } : null
        }
      });
    }

  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking session'
    });
  }
});

// Parent Authentication - Step 1: Registration Number Verification
router.post('/verify-registration', async (req, res) => {
  try {
    const { registrationNumber } = req.body;

    if (!registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Registration number is required'
      });
    }

    const regNum = registrationNumber.trim().toUpperCase();
    const regNumRegex = new RegExp(`^${regNum}$`, 'i');

    const student = await Student.findOne({ 
      registrationNumber: regNumRegex
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Registration Number'
      });
    }

    // Store registration number in session for next step
    req.session.registrationNumber = registrationNumber;
    req.session.studentId = student._id;

    res.json({
      success: true,
      message: 'Registration number verified. Please enter parent phone number.',
      data: {
        step: 'phone_verification',
        studentName: `${student.firstName} ${student.lastName}`
      }
    });

  } catch (error) {
    console.error('Error verifying registration:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying registration number'
    });
  }
});

// Parent Authentication - Step 2: Phone Number Verification
router.post('/verify-phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const { studentId } = req.session;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Please verify registration number first'
      });
    }

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const student = await Student.findById(studentId).populate('parentId');

    if (!student || !student.parentId) {
      return res.status(404).json({
        success: false,
        message: 'Student or parent information not found'
      });
    }

    // Verify phone number matches parent record
    if (student.parentId.phone !== phoneNumber && student.parentId.alternatePhone !== phoneNumber) {
      return res.status(401).json({
        success: false,
        message: 'Phone number does not match registered parent contact'
      });
    }

    // Authentication successful - create session
    req.session.authenticated = true;
    req.session.role = 'parent';
    req.session.userId = student.parentId._id;
    req.session.parentId = student.parentId._id;
    req.session.studentId = student._id;

    res.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: student.parentId._id,
        firstName: student.parentId.firstName,
        lastName: student.parentId.lastName,
        email: student.parentId.email,
        phone: student.parentId.phone,
        alternatePhone: student.parentId.alternatePhone,
        relationship: student.parentId.relationship,
        occupation: student.parentId.occupation,
        address: student.parentId.address,
        role: 'parent',
        linkedStudent: {
          id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          registrationNumber: student.registrationNumber,
          department: student.department,
          year: student.year,
          semester: student.semester
        }
      },
      data: {
        student: {
          name: `${student.firstName} ${student.lastName}`,
          registrationNumber: student.registrationNumber,
          department: student.department,
          year: student.year
        },
        parent: {
          name: `${student.parentId.firstName} ${student.parentId.lastName}`,
          relationship: student.parentId.relationship,
          phone: student.parentId.phone,
          alternatePhone: student.parentId.alternatePhone,
          occupation: student.parentId.occupation,
          address: student.parentId.address
        }
      }
    });

  } catch (error) {
    console.error('Error verifying phone:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying phone number'
    });
  }
});

// Forgot Password - Send OTP using registration number and role-linked email
router.post('/forgot-password', async (req, res) => {
  try {
    const { registrationNumber, role } = req.body;

    if (!registrationNumber || !role) {
      return res.status(400).json({
        success: false,
        message: 'Registration number and role are required'
      });
    }

    const regNum = String(registrationNumber).trim().toUpperCase();
    const regNumRegex = new RegExp(`^${regNum}$`, 'i');

    const student = await Student.findOne({ registrationNumber: regNumRegex }).populate('parentId');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Invalid registration number'
      });
    }

    let targetEmail = '';

    if (role === 'student') {
      targetEmail = student.email;
    } else if (role === 'parent') {
      targetEmail = student.parentId?.email;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    if (!targetEmail) {
      return res.status(422).json({
        success: false,
        message: `No registered email found in database for ${regNum}`
      });
    }

    const otp = createOtpCode();
    const ttlMinutes = Number(process.env.OTP_TTL_MINUTES || 5);
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;

    req.session.forgotPasswordOtp = {
      registrationNumber: student.registrationNumber,
      role,
      otpHash: hashOtp(otp),
      expiresAt,
      attempts: 0
    };

    await sendOtpEmail({
      to: targetEmail,
      subject: 'ProGO Password Reset OTP',
      text: `Your ProGO OTP is ${otp}. It expires in ${ttlMinutes} minutes. Registration: ${student.registrationNumber}`
    });

    return res.json({
      success: true,
      message: `OTP sent to ${maskEmail(targetEmail)}`,
      data: {
        registrationNumber: student.registrationNumber,
        expiresInMinutes: ttlMinutes
      }
    });
  } catch (error) {
    console.error('Error sending forgot-password OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to send OTP. Please try again.'
    });
  }
});

// Forgot Password - Verify OTP against registration and session data
router.post('/verify-otp', async (req, res) => {
  try {
    const { registrationNumber, role, otp } = req.body;

    if (!registrationNumber || !role || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Registration number, role, and OTP are required'
      });
    }

    const otpSession = req.session.forgotPasswordOtp;
    if (!otpSession) {
      return res.status(400).json({
        success: false,
        message: 'No OTP request found. Please send OTP first.'
      });
    }

    const regNum = String(registrationNumber).trim().toUpperCase();
    const sessionReg = String(otpSession.registrationNumber || '').trim().toUpperCase();

    if (sessionReg !== regNum || otpSession.role !== role) {
      return res.status(400).json({
        success: false,
        message: 'OTP request does not match this registration number/role'
      });
    }

    if (Date.now() > Number(otpSession.expiresAt || 0)) {
      req.session.forgotPasswordOtp = null;
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new OTP.'
      });
    }

    const isValid = hashOtp(String(otp).trim()) === otpSession.otpHash;
    if (!isValid) {
      otpSession.attempts = Number(otpSession.attempts || 0) + 1;
      req.session.forgotPasswordOtp = otpSession;

      if (otpSession.attempts >= 5) {
        req.session.forgotPasswordOtp = null;
        return res.status(429).json({
          success: false,
          message: 'Too many invalid attempts. Please request a new OTP.'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    req.session.forgotPasswordVerified = {
      registrationNumber: regNum,
      role,
      verifiedAt: Date.now()
    };
    req.session.forgotPasswordOtp = null;

    return res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to verify OTP. Please try again.'
    });
  }
});

// Forgot Password - Set new password after OTP verification
router.post('/reset-password', async (req, res) => {
  try {
    const { registrationNumber, role, newPassword } = req.body;

    if (!registrationNumber || !role || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Registration number, role, and new password are required'
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const verification = req.session.forgotPasswordVerified;
    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'OTP verification required before password reset'
      });
    }

    const regNum = String(registrationNumber).trim().toUpperCase();
    if (verification.registrationNumber !== regNum || verification.role !== role) {
      return res.status(400).json({
        success: false,
        message: 'Verified OTP does not match this registration/role'
      });
    }

    if (role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Password reset is currently available for student login only'
      });
    }

    const student = await Student.findOne({ registrationNumber: regNum });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    student.passwordHash = await bcrypt.hash(String(newPassword), 10);
    await student.save();

    req.session.forgotPasswordVerified = null;

    return res.json({
      success: true,
      message: 'Password updated successfully. You can now sign in with the new password.'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to reset password. Please try again.'
    });
  }
});

// Admin utility: Check which registrations are missing student/parent email data
router.get('/registration-email-audit', async (req, res) => {
  try {
    const students = await Student.find({}).populate('parentId');

    const missing = students
      .filter((student) => !student.email || !student.parentId?.email)
      .map((student) => ({
        registrationNumber: student.registrationNumber,
        studentEmailPresent: Boolean(student.email),
        parentEmailPresent: Boolean(student.parentId?.email)
      }));

    return res.json({
      success: true,
      totalRegistrations: students.length,
      missingCount: missing.length,
      missing
    });
  } catch (error) {
    console.error('Error auditing registration emails:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to audit registration emails'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error logging out'
      });
    }
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

// Check authentication status
router.get('/status', (req, res) => {
  if (req.session.authenticated && req.session.studentId) {
    res.json({
      success: true,
      authenticated: true,
      data: {
        studentId: req.session.studentId,
        parentId: req.session.parentId
      }
    });
  } else {
    res.json({
      success: true,
      authenticated: false
    });
  }
});

module.exports = router;
