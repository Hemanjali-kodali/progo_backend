const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  examName: {
    type: String,
    required: true,
    trim: true
  },
  examType: {
    type: String,
    enum: ['internal', 'midterm', 'semester', 'final'],
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  department: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  examDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number // in minutes
  },
  totalMarks: {
    type: Number,
    required: true
  },
  venue: {
    type: String
  },
  instructions: {
    type: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  }
}, {
  timestamps: true
});

examSchema.index({ examDate: 1, semester: 1 });
examSchema.index({ department: 1, semester: 1 });

module.exports = mongoose.model('Exam', examSchema);
