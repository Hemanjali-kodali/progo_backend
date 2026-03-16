const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const performancePredictor = require('../ml/performancePredictor');
const intentClassifier = require('../ml/intentClassifier');

// Admin authentication middleware (simple version)
const adminAuth = (req, res, next) => {
  // In production, implement proper admin authentication
  const adminKey = req.headers['x-admin-key'];
  if (adminKey === process.env.ADMIN_KEY || adminKey === 'admin-secret-key') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Unauthorized access'
    });
  }
};

// Train ML models
router.post('/ml/train', adminAuth, async (req, res) => {
  try {
    const { model } = req.body; // 'intent', 'performance', or 'all'

    let result = {};

    if (model === 'intent' || model === 'all') {
      await intentClassifier.train();
      result.intentClassifier = 'trained';
    }

    if (model === 'performance' || model === 'all') {
      await performancePredictor.initialize();
      const trainingData = performancePredictor.generateSampleTrainingData(500);
      await performancePredictor.train(trainingData);
      result.performancePredictor = 'trained';
    }

    res.json({
      success: true,
      message: 'ML models trained successfully',
      data: result
    });

  } catch (error) {
    console.error('Error training ML models:', error);
    res.status(500).json({
      success: false,
      message: 'Error training ML models',
      error: error.message
    });
  }
});

// Get at-risk students
router.get('/students/at-risk', adminAuth, async (req, res) => {
  try {
    const students = await Student.find()
      .populate('parentId')
      .select('registrationNumber firstName lastName currentCGPA');

    const studentsData = await Promise.all(students.map(async (student) => {
      const Attendance = require('../models/Attendance');
      const Backlog = require('../models/Backlog');

      const attendance = await Attendance.find({ studentId: student._id });
      const backlogs = await Backlog.find({ studentId: student._id });

      const totalClasses = attendance.reduce((sum, a) => sum + a.totalClasses, 0);
      const attendedClasses = attendance.reduce((sum, a) => sum + a.attendedClasses, 0);
      const attendancePercent = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 100;

      return {
        registrationNumber: student.registrationNumber,
        name: `${student.firstName} ${student.lastName}`,
        attendance: attendancePercent,
        previousCGPA: student.currentCGPA || 0,
        backlogs: backlogs.length,
        assignmentScore: 75, // Mock data
        midtermScore: 75,     // Mock data
        participationScore: 5, // Mock data
        studyHours: 15,        // Mock data
        semester: 1            // Mock data
      };
    }));

    const atRiskStudents = performancePredictor.identifyAtRiskStudents(studentsData);

    res.json({
      success: true,
      data: {
        totalStudents: students.length,
        atRiskCount: atRiskStudents.length,
        atRiskStudents: atRiskStudents.sort((a, b) => b.riskScore - a.riskScore)
      }
    });

  } catch (error) {
    console.error('Error fetching at-risk students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching at-risk students'
    });
  }
});

// Get analytics dashboard data
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalParents = await Parent.countDocuments();

    const Attendance = require('../models/Attendance');
    const Backlog = require('../models/Backlog');

    const averageAttendance = await Attendance.aggregate([
      {
        $group: {
          _id: null,
          avgAttendance: {
            $avg: {
              $multiply: [
                { $divide: ['$attendedClasses', '$totalClasses'] },
                100
              ]
            }
          }
        }
      }
    ]);

    const averageCGPA = await Student.aggregate([
      {
        $group: {
          _id: null,
          avgCGPA: { $avg: '$currentCGPA' }
        }
      }
    ]);

    const totalBacklogs = await Backlog.countDocuments();

    res.json({
      success: true,
      data: {
        totalStudents,
        totalParents,
        averageAttendance: averageAttendance[0]?.avgAttendance?.toFixed(2) || 0,
        averageCGPA: averageCGPA[0]?.avgCGPA?.toFixed(2) || 0,
        totalBacklogs
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
});

module.exports = router;
