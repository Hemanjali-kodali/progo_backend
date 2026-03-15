const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  feeType: {
    type: String,
    enum: ['tuition', 'library', 'lab', 'sports', 'transport', 'hostel', 'exam', 'misc'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  paidDate: Date,
  status: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'overdue'],
    default: 'pending'
  },
  semester: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  transactionId: String,
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'net_banking', 'cheque']
  },
  remarks: String
}, {
  timestamps: true
});

// Update status based on payment
feeSchema.pre('save', function(next) {
  if (this.paidAmount >= this.amount) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else if (this.dueDate < new Date()) {
    this.status = 'overdue';
  }
  next();
});

feeSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.model('Fee', feeSchema);
