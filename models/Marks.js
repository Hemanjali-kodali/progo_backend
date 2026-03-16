const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
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
  examType: {
    type: String,
    enum: ['internal', 'midterm', 'semester', 'final', 'assignment'],
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
  percentage: {
    type: Number
  },
  grade: {
    type: String
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
    type: Date
  },
  remarks: String
}, {
  timestamps: true
});

// Calculate percentage before saving
marksSchema.pre('save', function(next) {
  if (this.marksObtained && this.totalMarks) {
    this.percentage = (this.marksObtained / this.totalMarks) * 100;
    
    // Calculate grade
    if (this.percentage >= 90) this.grade = 'A+';
    else if (this.percentage >= 80) this.grade = 'A';
    else if (this.percentage >= 70) this.grade = 'B+';
    else if (this.percentage >= 60) this.grade = 'B';
    else if (this.percentage >= 50) this.grade = 'C';
    else if (this.percentage >= 40) this.grade = 'D';
    else this.grade = 'F';
  }
  next();
});

marksSchema.index({ studentId: 1, semester: 1 });

module.exports = mongoose.model('Marks', marksSchema);
