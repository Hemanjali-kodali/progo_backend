const mongoose = require('mongoose');

const backlogSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
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
  marksObtained: {
    type: Number,
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'cleared', 'repeated'],
    default: 'pending'
  },
  clearedDate: Date,
  attempts: {
    type: Number,
    default: 1
  },
  remarks: String
}, {
  timestamps: true
});

backlogSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.model('Backlog', backlogSchema);
