const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Backlog = require('../models/Backlog');

// Get student details
router.get('/details', async (req, res) => {
  try {
    const { studentId } = req.session;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const student = await Student.findById(studentId)
      .populate('courseId')
      .populate('parentId');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: {
        student: {
          registrationNumber: student.registrationNumber,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          phone: student.phone,
          department: student.department,
          year: student.year,
          semester: student.semester,
          cgpa: student.currentCGPA,
          course: student.courseId?.name
        }
      }
    });

  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student details'
    });
  }
});

module.exports = router;
