const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('./models/Student');
const Parent = require('./models/Parent');

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];
    parsed[key] = value;
    index += 1;
  }

  return parsed;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function normalizePhone(phone) {
  return String(phone || '').trim();
}

function isValidPhone(phone) {
  return /^[+\d][\d\s()-]{6,19}$/.test(normalizePhone(phone));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const registrationNumber = String(args.registration || '').trim().toUpperCase();
  const studentEmail = args['student-email'] ? String(args['student-email']).trim().toLowerCase() : '';
  const parentEmail = args['parent-email'] ? String(args['parent-email']).trim().toLowerCase() : '';
  const studentPhone = args['student-phone'] ? normalizePhone(args['student-phone']) : '';
  const parentPhone = args['parent-phone'] ? normalizePhone(args['parent-phone']) : '';
  const parentAlternatePhone = args['parent-alternate-phone'] ? normalizePhone(args['parent-alternate-phone']) : '';

  if (!registrationNumber) {
    throw new Error('Missing --registration <REGISTRATION_NUMBER>');
  }

  if (!studentEmail && !parentEmail && !studentPhone && !parentPhone && !parentAlternatePhone) {
    throw new Error('Provide at least one contact field such as --student-email, --parent-email, --student-phone, --parent-phone, or --parent-alternate-phone');
  }

  if (studentEmail && !isValidEmail(studentEmail)) {
    throw new Error('Invalid --student-email value');
  }

  if (parentEmail && !isValidEmail(parentEmail)) {
    throw new Error('Invalid --parent-email value');
  }

  if (studentPhone && !isValidPhone(studentPhone)) {
    throw new Error('Invalid --student-phone value');
  }

  if (parentPhone && !isValidPhone(parentPhone)) {
    throw new Error('Invalid --parent-phone value');
  }

  if (parentAlternatePhone && !isValidPhone(parentAlternatePhone)) {
    throw new Error('Invalid --parent-alternate-phone value');
  }

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parent_student_chatbot', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  try {
    const student = await Student.findOne({ registrationNumber }).populate('parentId');

    if (!student) {
      throw new Error(`Student not found for registration ${registrationNumber}`);
    }

    if (studentEmail) {
      student.email = studentEmail;
    }

    if (studentPhone) {
      student.phone = studentPhone;
    }

    if (studentEmail || studentPhone) {
      await student.save();
    }

    if (parentEmail || parentPhone || parentAlternatePhone) {
      if (!student.parentId) {
        throw new Error(`No linked parent found for registration ${registrationNumber}`);
      }

      const parent = await Parent.findById(student.parentId._id);

      if (parentEmail) {
        parent.email = parentEmail;
      }

      if (parentPhone) {
        parent.phone = parentPhone;
      }

      if (parentAlternatePhone) {
        parent.alternatePhone = parentAlternatePhone;
      }

      await parent.save();
    }

    const refreshedStudent = await Student.findOne({ registrationNumber }).populate('parentId');

    console.log(JSON.stringify({
      success: true,
      registrationNumber,
      studentEmail: refreshedStudent.email,
      studentPhone: refreshedStudent.phone || null,
      parentEmail: refreshedStudent.parentId?.email || null,
      parentPhone: refreshedStudent.parentId?.phone || null,
      parentAlternatePhone: refreshedStudent.parentId?.alternatePhone || null
    }, null, 2));
  } finally {
    await mongoose.connection.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});