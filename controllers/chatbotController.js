const mlInterface = require('../ml/mlInterface');
const nlpProcessor = require('../ml/nlpProcessor');
const conversationLearner = require('../ml/conversationLearner');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Backlog = require('../models/Backlog');
const Fee = require('../models/Fee');
const Exam = require('../models/Exam');
const Notification = require('../models/Notification');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');

const normalizePhoneNumber = (value) => {
  if (!value) {
    return '';
  }

  return String(value).replace(/\D/g, '');
};

class ChatbotController {
  constructor() {
    this.initialized = false;
    this.sessions = new Map(); // Track active sessions
    this.initializeML();
  }

  // Initialize ML models
  async initializeML() {
    try {
      console.log('🤖 Initializing Chatbot ML System...');
      
      // Initialize ML interface (auto-detects Python or Brain.js)
      const mlInfo = await mlInterface.initialize();
      
      this.initialized = true;
      console.log('✓ Chatbot ML models initialized successfully');
      console.log(`  - ML Backend: ${mlInfo.activeBackend || 'Brain.js'}`);
      console.log('  - Intent Classifier: Ready');
      console.log('  - Performance Predictor: Ready');
      console.log('  - NLP Processor: Ready');
      console.log('  - Conversation Learner: Ready');
    } catch (error) {
      console.error('✗ Error initializing chatbot ML:', error);
    }
  }

  async processMessage(req, res) {
  try {

    const { message } = req.body;
    const { studentId } = req.session;
    const sessionId = req.sessionID || req.session.id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please authenticate again."
      });
    }

    // Fetch student
    let student = await Student.findById(studentId).populate("courseId");

    if (!student) {
      return res.json({
        success: false,
        message: "Student not found"
      });
    }

    const data = await this.processMessageForStudent({
      message,
      student,
      sessionId
    });

    return res.json({
      success: true,
      data
    });

  } catch (error) {

    console.error("Error processing message:", error);

    res.status(500).json({
      success: false,
      message: "Error processing your request. Please try again."
    });

  }
}

  async processMessageForStudent({ message, student, sessionId }) {
    const lower = message.toLowerCase().trim();

    // MENU NUMBER SELECTION
    const menuMap = {
      "1": "overall_attendance",
      "2": "subject_attendance",
      "3": "academic_status",
      "4": "academic_performance",
      "5": "upcoming_exams",
      "6": "fee_status",
      "7": "notifications",
      "8": "faculty_contact",
      "9": "performance_insights",
      "10": "logout"
    };

    if (menuMap[lower]) {

      const response = await this.handleIntent(menuMap[lower], student, {});

      return {
        message: response.message,
        intent: menuMap[lower],
        action: response.action,
        ...response.additionalData
      };

    }

    // HELP COMMAND
    if (lower === "help") {

      const response = this.getHelpMenu();

      return {
        message: response.message,
        intent: "help"
      };

    }

    // NLP PROCESSING
    const nlpResult = nlpProcessor.processMessage(message);

    const intentResult = await mlInterface.predictIntent(message);

    // FALLBACK KEYWORD DETECTION
    if (intentResult.confidence < 0.6) {

      if (lower.includes("attendance"))
        intentResult.intent = "overall_attendance";

      else if (
        lower.includes("performance") ||
        lower.includes("marks") ||
        lower.includes("cgpa")
      )
        intentResult.intent = "academic_performance";

      else if (lower.includes("exam"))
        intentResult.intent = "upcoming_exams";

      else if (lower.includes("fee"))
        intentResult.intent = "fee_status";

      else if (lower.includes("notification"))
        intentResult.intent = "notifications";

      else if (lower.includes("faculty"))
        intentResult.intent = "faculty_contact";

    }

    console.log(`User: ${message}`);
    console.log(`Intent: ${intentResult.intent}`);

    const response = await this.handleIntent(
      intentResult.intent,
      student,
      nlpResult
    );

    const finalResponse = nlpProcessor.getResponseVariation(
      response.message,
      nlpResult.sentiment.label
    );

    // Save conversation
    conversationLearner.recordConversation(
      sessionId,
      message,
      finalResponse,
      intentResult.intent,
      intentResult.confidence,
      {
        studentId: student._id,
        studentName: student.firstName
      }
    );

    mlInterface.saveConversationForTraining(
      message,
      intentResult.intent,
      true
    );

    return {
      message: finalResponse,
      intent: intentResult.intent,
      action: response.action,
      ...response.additionalData
    };
  }

  async getStudentFromPhoneNumber(phoneNumber) {
    const normalizedInput = normalizePhoneNumber(phoneNumber);
    if (!normalizedInput) {
      return null;
    }

    const students = await Student.find({}).populate('courseId').lean(false);
    const directStudent = students.find((student) => {
      const studentPhone = normalizePhoneNumber(student.phone);
      return studentPhone && (
        studentPhone === normalizedInput ||
        studentPhone.endsWith(normalizedInput) ||
        normalizedInput.endsWith(studentPhone)
      );
    });

    if (directStudent) {
      return directStudent;
    }

    const parents = await Parent.find({}).lean();
    const matchedParent = parents.find((parent) => {
      const parentPhones = [parent.phone, parent.alternatePhone]
        .map(normalizePhoneNumber)
        .filter(Boolean);

      return parentPhones.some((parentPhone) => (
        parentPhone === normalizedInput ||
        parentPhone.endsWith(normalizedInput) ||
        normalizedInput.endsWith(parentPhone)
      ));
    });

    if (!matchedParent) {
      return null;
    }

    return Student.findOne({ parentId: matchedParent._id }).populate('courseId');
  }

  // Get human-readable intent description
  getIntentDescription(intent) {
    const descriptions = {
      'overall_attendance': 'Check overall attendance',
      'subject_attendance': 'View subject-wise attendance',
      'academic_status': 'Check academic status and backlogs',
      'academic_performance': 'View academic performance and CGPA',
      'upcoming_exams': 'See upcoming exams',
      'fee_status': 'Check fee payment status',
      'notifications': 'View notifications and announcements',
      'faculty_contact': 'Get faculty contact information',
      'performance_insights': 'Get performance insights and predictions',
      'help': 'Show help menu',
      'greeting': 'General greeting',
      'logout': 'Logout from system'
    };

    return descriptions[intent] || intent;
  }

  // Handle different intents
  async handleIntent(intent, student, nlpResult) {
    switch (intent) {
      case 'overall_attendance':
        return await this.getOverallAttendance(student);
      
      case 'subject_attendance':
        return await this.getSubjectAttendance(student);
      
      case 'academic_status':
        return await this.getAcademicStatus(student);
      
      case 'academic_performance':
        return await this.getAcademicPerformance(student);
      
      case 'upcoming_exams':
        return await this.getUpcomingExams(student);
      
      case 'fee_status':
        return await this.getFeeStatus(student);
      
      case 'notifications':
        return await this.getNotifications(student);
      
      case 'faculty_contact':
        return await this.getFacultyContact(student);
      
      case 'performance_insights':
        return await this.getPerformanceInsights(student);
      
      case 'logout':
        return {
          message: 'Thank you for using the Parent Academic Chatbot. Goodbye!',
          action: 'logout'
        };
      
      case 'help':
        return this.getHelpMenu();
      
      case 'greeting':
        return {
          message: `Hello! I'm here to help you with ${student.firstName}'s academic information. What would you like to know?`,
          additionalData: { menu: this.getMenuOptions() }
        };
      
      default:
        return {
          message: "I'm not sure I understand. Could you please rephrase or select an option from the menu?",
          additionalData: { menu: this.getMenuOptions() }
        };
    }
  }

  // Get overall attendance
  async getOverallAttendance(student) {
  try {

    const attendance = await Attendance.find({
      studentId: student._id
    }).populate("subjectId");

    if (!attendance || attendance.length === 0) {
      return {
        message: "No attendance records found."
      };
    }

    const totalClasses = attendance.length;

    const attendedClasses = attendance.filter(
      r => r.status === "present"
    ).length;

    const percentage = ((attendedClasses / totalClasses) * 100).toFixed(2);

    // Group subject attendance
    const subjectMap = {};

    attendance.forEach(record => {

      const subject = record.subjectId?.subjectName || "Unknown";

      if (!subjectMap[subject]) {
        subjectMap[subject] = { total: 0, present: 0 };
      }

      subjectMap[subject].total += 1;

      if (record.status === "present") {
        subjectMap[subject].present += 1;
      }

    });

    let message = `📊 Overall Attendance: ${percentage}%\n\n`;

    if (percentage >= 85) {
      message += "Excellent attendance! Keep it up!\n\n";
    } else if (percentage >= 75) {
      message += "Good attendance.\n\n";
    } else {
      message += "⚠ Attendance is below recommended level.\n\n";
    }

    message += "📚 Subject-wise Attendance:\n\n";

    Object.keys(subjectMap).forEach(subject => {

      const total = subjectMap[subject].total;
      const present = subjectMap[subject].present;

      const percent = ((present / total) * 100).toFixed(2);

      message += `${subject}: ${percent}% (${present}/${total})\n`;

    });

    return {
      message
    };

  } catch (error) {
    console.error(error);

    return {
      message: "Error fetching attendance data."
    };
  }
}

  // Get subject-wise attendance
async getSubjectAttendance(student) {
  try {

    const attendance = await Attendance.find({
      studentId: student._id
    }).populate('subjectId');

    if (!attendance || attendance.length === 0) {
      return {
        message: 'No subject attendance records found.',
        additionalData: { subjects: [] }
      };
    }

    // Group attendance by subject
    const subjectMap = {};

    attendance.forEach(record => {

      const subjectName = record.subjectId?.subjectName || "Unknown Subject";

      if (!subjectMap[subjectName]) {
        subjectMap[subjectName] = {
          total: 0,
          present: 0
        };
      }

      subjectMap[subjectName].total += 1;

      if (record.status === "present") {
        subjectMap[subjectName].present += 1;
      }

    });

    // Convert grouped data to response format
    const subjectData = Object.keys(subjectMap).map(subject => {

      const total = subjectMap[subject].total;
      const present = subjectMap[subject].present;
      const percentage = ((present / total) * 100).toFixed(2);

      return {
        subject,
        percentage: parseFloat(percentage),
        attended: present,
        total
      };

    });

    // Create message
    let message = "📚 Subject-wise Attendance:\n\n";

    subjectData.forEach(subj => {
      message += `${subj.subject}: ${subj.percentage}% (${subj.attended}/${subj.total})\n`;
    });

    return {
      message,
      additionalData: { subjects: subjectData }
    };

  } catch (error) {

    console.error("Error fetching subject attendance:", error);

    return {
      message: "Unable to fetch subject-wise attendance right now.",
      additionalData: {}
    };
  }
}
  // Get academic status
  async getAcademicStatus(student) {
    try {
      const backlogs = await Backlog.find({ studentId: student._id }).populate('subjectId');
      
      const backlogCount = backlogs.length;
      const backlogSubjects = backlogs.map(b => b.subjectId?.name || 'Unknown').join(', ');

      let message = `Academic Status for ${student.firstName}:\n\n`;
      message += `Backlogs: ${backlogCount}\n`;
      
      if (backlogCount > 0) {
        message += `Subjects with Backlogs: ${backlogSubjects}\n`;
        message += '\n⚠ Please focus on clearing backlogs.';
      } else {
        message += 'No pending backlogs. Excellent!';
      }

      return {
        message,
        additionalData: {
          backlogCount,
          backlogs: backlogs.map(b => ({
            subject: b.subjectId?.name,
            semester: b.semester
          }))
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get academic performance
  async getAcademicPerformance(student) {
    try {
      const marks = await Marks.find({ studentId: student._id }).populate('subjectId');
      
      if (!marks || marks.length === 0) {
        return {
          message: 'No performance records found.',
          additionalData: { cgpa: 0 }
        };
      }

      const currentCGPA = student.currentCGPA || 0;

      let message = `Academic Performance:\n\n`;
      message += `Current CGPA: ${currentCGPA.toFixed(2)}\n`;
      message += `Semester: ${student.semester}\n`;
      message += `Year: ${student.year}\n`;

      // Group marks by semester
      const semesterGroups = {};
      marks.forEach(mark => {
        if (!semesterGroups[mark.semester]) {
          semesterGroups[mark.semester] = [];
        }
        semesterGroups[mark.semester].push(mark);
      });

      message += '\nSemester-wise Performance:\n';
      Object.keys(semesterGroups).sort().forEach(sem => {
        const semMarks = semesterGroups[sem];
        const avgMarks =
  semMarks.reduce((sum, m) => sum + (m.marksObtained || 0), 0) / semMarks.length;
        message += `Semester ${sem}: ${avgMarks.toFixed(2)}%\n`;
      });

      return {
        message,
        additionalData: {
          cgpa: currentCGPA,
          semester: student.semester,
          year: student.year,
          semesterWise: semesterGroups
        }
      };
    } catch (error) {
      // Mock data when database is not available
      const cgpa = student.cgpa || 8.5;
      return {
        message: `📈 Academic Performance (Demo data):\n\nCurrent CGPA: ${cgpa.toFixed(2)}\nSemester: ${student.semester || 3}\n\nSemester-wise Performance:\nSemester 1: 8.2\nSemester 2: 8.4\nSemester 3: 8.8\n\nGreat progress! Keep up the good work!`,
        additionalData: {
          cgpa: cgpa,
          semester: student.semester || 3,
          semesterWise: { 1: 8.2, 2: 8.4, 3: 8.8 }
        }
      };
    }
  }

  // Get upcoming exams
  async getUpcomingExams(student) {
    try {
      const currentDate = new Date();
      const exams = await Exam.find({
        courseId: student.courseId,
        date: { $gte: currentDate }
      }).populate('subjectId').sort({ date: 1 }).limit(10);

      if (!exams || exams.length === 0) {
        return {
          message: 'No upcoming exams scheduled.',
          additionalData: { exams: [] }
        };
      }

      let message = 'Upcoming Exams:\n\n';
      exams.forEach(exam => {
        const examDate = new Date(exam.date).toLocaleDateString();
        message += `${exam.subjectId?.name || 'Unknown'} - ${exam.examType}\n`;
        message += `Date: ${examDate}\n`;
        message += `Duration: ${exam.duration} minutes\n\n`;
      });

      return {
        message,
        additionalData: {
          exams: exams.map(e => ({
            subject: e.subjectId?.name,
            type: e.examType,
            date: e.date,
            duration: e.duration
          }))
        }
      };
    } catch (error) {
      // Mock data when database is not available
      const mockExams = [
        { subject: 'Data Structures', type: 'Midterm', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), duration: 120 },
        { subject: 'Algorithms', type: 'Quiz', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), duration: 60 },
        { subject: 'Database Systems', type: 'Final', date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), duration: 180 }
      ];
      
      let message = '📅 Upcoming Exams (Demo data):\n\n';
      mockExams.forEach(exam => {
        const examDate = exam.date.toLocaleDateString();
        message += `${exam.subject} - ${exam.type}\n`;
        message += `Date: ${examDate}\n`;
        message += `Duration: ${exam.duration} minutes\n\n`;
      });

      return {
        message,
        additionalData: { exams: mockExams }
      };
    }
  }

  // Get fee status
  async getFeeStatus(student) {
    try {
      const fees = await Fee.find({ studentId: student._id });

      if (!fees || fees.length === 0) {
        return {
          message: 'No fee records found.',
          additionalData: { fees: [] }
        };
      }

      const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
      const paidAmount = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);
      const pendingAmount = totalAmount - paidAmount;

      let message = 'Fee Payment Status:\n\n';
      message += `Total Fee: ₹${totalAmount}\n`;
      message += `Paid: ₹${paidAmount}\n`;
      message += `Pending: ₹${pendingAmount}\n\n`;

      fees.forEach(fee => {
        const status = fee.status === 'paid' ? '✓ Paid' : '✗ Pending';
        message += `${fee.feeType}: ${status} (₹${fee.amount})\n`;
      });

      if (pendingAmount > 0) {
        message += '\n⚠ Please clear pending fees.';
      }

      return {
        message,
        additionalData: {
          totalAmount,
          paidAmount,
          pendingAmount,
          fees: fees.map(f => ({
            type: f.feeType,
            amount: f.amount,
            paid: f.paidAmount,
            status: f.status
          }))
        }
      };
    } catch (error) {
      // Mock data when database is not available
      return {
        message: '💰 Fee Payment Status (Demo data):\n\nTotal Fee: ₹45,000\nPaid: ₹30,000\nPending: ₹15,000\n\nTuition Fee: ✓ Paid (₹25,000)\nExam Fee: ✓ Paid (₹5,000)\nLibrary Fee: ✗ Pending (₹5,000)\nLab Fee: ✗ Pending (₹10,000)\n\n⚠ Please clear pending fees.',
        additionalData: {
          totalAmount: 45000,
          paidAmount: 30000,
          pendingAmount: 15000,
          fees: [
            { type: 'Tuition Fee', amount: 25000, paid: 25000, status: 'paid' },
            { type: 'Exam Fee', amount: 5000, paid: 5000, status: 'paid' },
            { type: 'Library Fee', amount: 5000, paid: 0, status: 'pending' },
            { type: 'Lab Fee', amount: 10000, paid: 0, status: 'pending' }
          ]
        }
      };
    }
  }

  // Get notifications
  async getNotifications(student) {
    try {
      const notifications = await Notification.find({
        $or: [
          { targetAudience: 'all' },
          { targetAudience: 'students' },
          { courseId: student.courseId }
        ],
        isActive: true
      }).sort({ createdAt: -1 }).limit(5);

      if (!notifications || notifications.length === 0) {
        return {
          message: 'No new notifications.',
          additionalData: { notifications: [] }
        };
      }

      let message = 'Latest Notifications:\n\n';
      notifications.forEach((notif, index) => {
        message += `${index + 1}. ${notif.title}\n`;
        message += `   ${notif.message}\n`;
        message += `   Date: ${new Date(notif.createdAt).toLocaleDateString()}\n\n`;
      });

      return {
        message,
        additionalData: {
          notifications: notifications.map(n => ({
            title: n.title,
            message: n.message,
            date: n.createdAt,
            priority: n.priority
          }))
        }
      };
    } catch (error) {
      // Mock data when database is not available
      const mockNotifications = [
        { title: 'Exam Schedule Released', message: 'Midterm exam schedule is now available on the portal.', date: new Date(), priority: 'high' },
        { title: 'Fee Payment Reminder', message: 'Last date for fee payment is approaching. Please pay by end of month.', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), priority: 'medium' },
        { title: 'Library Books Due', message: 'Return your library books by next week to avoid fine.', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), priority: 'low' }
      ];
      
      let message = '🔔 Latest Notifications (Demo data):\n\n';
      mockNotifications.forEach((notif, index) => {
        message += `${index + 1}. ${notif.title}\n`;
        message += `   ${notif.message}\n`;
        message += `   Date: ${notif.date.toLocaleDateString()}\n\n`;
      });

      return {
        message,
        additionalData: { notifications: mockNotifications }
      };
    }
  }

  // Get faculty contact
  async getFacultyContact(student) {
    try {
      const faculties = await Faculty.find({
        department: student.department
      }).limit(5);

      if (!faculties || faculties.length === 0) {
        return {
          message: 'No faculty information found.',
          additionalData: { faculty: [] }
        };
      }

      let message = 'Faculty Contact Information:\n\n';
      faculties.forEach(faculty => {
        message += `${faculty.firstName} ${faculty.lastName}\n`;
        message += `Position: ${faculty.position || 'Faculty'}\n`;
        message += `Email: ${faculty.email}\n`;
        message += `Phone: ${faculty.phone}\n\n`;
      });

      return {
        message,
        additionalData: {
          faculty: faculties.map(f => ({
            name: `${f.firstName} ${f.lastName}`,
            position: f.position,
            email: f.email,
            phone: f.phone,
            department: f.department
          }))
        }
      };
    } catch (error) {
      // Mock data when database is not available
      const mockFaculty = [
        { name: 'Dr. Sarah Mitchell', position: 'Head of Department', email: 'sarah.mitchell@progo.edu', phone: '+91-9876543210' },
        { name: 'Prof. James Anderson', position: 'Senior Professor', email: 'james.anderson@progo.edu', phone: '+91-9876543211' },
        { name: 'Dr. Emily Chen', position: 'Assistant Professor', email: 'emily.chen@progo.edu', phone: '+91-9876543212' }
      ];
      
      let message = '👨‍🏫 Faculty Contact Information (Demo data):\n\n';
      mockFaculty.forEach(faculty => {
        message += `${faculty.name}\n`;
        message += `Position: ${faculty.position}\n`;
        message += `Email: ${faculty.email}\n`;
        message += `Phone: ${faculty.phone}\n\n`;
      });

      return {
        message,
        additionalData: { faculty: mockFaculty }
      };
    }
  }

  // Get ML-powered performance insights
  async getPerformanceInsights(student) {
    try {
      // Gather student data for ML analysis
      const attendance = await Attendance.find({ studentId: student._id });
      const marks = await Marks.find({ studentId: student._id }).populate('subjectId');
      const backlogs = await Backlog.find({ studentId: student._id });

      // Calculate metrics
      const totalClasses = attendance.reduce((sum, a) => sum + a.totalClasses, 0);
      const attendedClasses = attendance.reduce((sum, a) => sum + a.attendedClasses, 0);
      const attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

      // Calculate average scores (you would get these from actual data)
      const avgAssignmentScore = 85; // Mock data - would come from database
      const avgMidtermScore = 80;    // Mock data
      const participationScore = 7;   // Mock data
      const studyHours = 18;          // Mock data

      const studentData = {
        attendance: attendancePercentage,
        previousCGPA: student.currentCGPA || 7.0,
        assignmentScore: avgAssignmentScore,
        midtermScore: avgMidtermScore,
        participationScore: participationScore,
        backlogs: backlogs.length,
        studyHours: studyHours,
        semester: student.semester
      };

      console.log('📊 Analyzing student performance with ML...');

      // Get ML-powered insights (uses Python or Brain.js)
      const insights = await mlInterface.predictPerformance(studentData);

      // Analyze subject-wise performance
      const subjectPerformance = marks.map(m => ({
        name: m.subjectId?.name || 'Unknown',
        marks: m.marksObtained
      }));

      // Categorize subjects
      const strongSubjects = subjectPerformance
        .filter(s => s.marks >= 75)
        .sort((a, b) => b.marks - a.marks);
      
      const weakSubjects = subjectPerformance
        .filter(s => s.marks < 75)
        .sort((a, b) => a.marks - b.marks);

      let message = `🎓 Performance Insights for ${student.firstName}:\n\n`;
      
      message += `📊 Current Status:\n`;
      message += `  • Current CGPA: ${studentData.previousCGPA.toFixed(2)}\n`;
      message += `  • Attendance: ${attendancePercentage.toFixed(1)}%\n`;
      message += `  • Backlogs: ${backlogs.length}\n`;
      message += `  • Semester: ${student.semester}\n\n`;

      message += `🔮 AI Prediction:\n`;
      message += `  • Predicted Next Semester CGPA: ${insights.prediction.toFixed(2)}\n`;
      message += `  • Confidence: ${(insights.confidence * 100).toFixed(0)}%\n`;
      message += `  • Performance Level: ${insights.currentPerformance}\n`;
      message += `  • Trend: ${insights.trend.direction} (${insights.trend.change >= 0 ? '+' : ''}${insights.trend.change.toFixed(2)})\n\n`;

      // Contributing Factors
      if (insights.contributingFactors && insights.contributingFactors.length > 0) {
        message += `📈 Key Factors:\n`;
        insights.contributingFactors.forEach(factor => {
          const emoji = factor.impact === 'positive' ? '✅' : factor.impact === 'negative' ? '⚠️' : 'ℹ️';
          message += `  ${emoji} ${factor.factor}: ${factor.value}\n`;
        });
        message += '\n';
      }

      // Strong subjects
      if (strongSubjects.length > 0) {
        message += `💪 Strong Subjects:\n`;
        strongSubjects.slice(0, 3).forEach(s => {
          message += `  • ${s.name}: ${s.marks}%\n`;
        });
        message += '\n';
      }

      // Weak subjects
      if (weakSubjects.length > 0) {
        message += `📚 Needs Focus:\n`;
        weakSubjects.slice(0, 3).forEach(s => {
          message += `  • ${s.name}: ${s.marks}%\n`;
        });
        message += '\n';
      }

      // Recommendations
      if (insights.recommendations && insights.recommendations.length > 0) {
        message += `💡 Personalized Recommendations:\n`;
        insights.recommendations.forEach((rec, idx) => {
          if (idx < 3) { // Show top 3 recommendations
            const priorityBadge = rec.priority === 'critical' ? '🔴' : 
                                 rec.priority === 'high' ? '🟠' : '🟡';
            message += `  ${priorityBadge} ${rec.message}\n`;
            if (rec.potentialImpact) {
              message += `     Impact: ${rec.potentialImpact}\n`;
            }
          }
        });
      }

      return {
        message,
        additionalData: {
          prediction: insights.prediction,
          confidence: insights.confidence,
          trend: insights.trend,
          contributingFactors: insights.contributingFactors,
          recommendations: insights.recommendations,
          strongSubjects: strongSubjects,
          weakSubjects: weakSubjects,
          studentMetrics: studentData
        }
      };
    } catch (error) {
      console.error('Error getting performance insights:', error);
      
      // Fallback response
      return {
        message: 'I can provide basic performance insights:\n\n' +
                `Current CGPA: ${student.currentCGPA || 'N/A'}\n` +
                `Semester: ${student.semester}\n\n` +
                'For detailed AI-powered insights, please ensure the ML models are trained.',
        additionalData: {}
      };
    }
  }

  // Get help menu
  getHelpMenu() {
    const menu = this.getMenuOptions();
    let message = 'Available Options:\n\n';
    menu.forEach((option, index) => {
      message += `${index + 1}. ${option.label}\n`;
    });
    message += '\nYou can type your question or select an option number.';

    return {
      message,
      additionalData: { menu }
    };
  }

  // Get menu options
  getMenuOptions() {
    return [
      { id: 1, label: 'Overall Attendance', intent: 'overall_attendance' },
      { id: 2, label: 'Subject-wise Attendance', intent: 'subject_attendance' },
      { id: 3, label: 'Academic Status', intent: 'academic_status' },
      { id: 4, label: 'Academic Performance', intent: 'academic_performance' },
      { id: 5, label: 'Upcoming Exams', intent: 'upcoming_exams' },
      { id: 6, label: 'Fee Payment Status', intent: 'fee_status' },
      { id: 7, label: 'Notifications & Announcements', intent: 'notifications' },
      { id: 8, label: 'Faculty Contact Information', intent: 'faculty_contact' },
      { id: 9, label: 'Performance Insights (ML-Powered)', intent: 'performance_insights' },
      { id: 10, label: 'Logout', intent: 'logout' }
    ];
  }
}

module.exports = new ChatbotController();
