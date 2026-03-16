const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    trim: true,
    default: null
  },
  phone: {
    type: String,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  department: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  currentCGPA: {
    type: Number,
    default: 0
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  },
  classAdvisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'suspended'],
    default: 'active'
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
studentSchema.index({ registrationNumber: 1 });
studentSchema.index({ parentId: 1 });

module.exports = mongoose.model('Student', studentSchema);
