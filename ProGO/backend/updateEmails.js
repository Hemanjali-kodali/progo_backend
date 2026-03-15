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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const registrationNumber = String(args.registration || '').trim().toUpperCase();
  const studentEmail = args['student-email'] ? String(args['student-email']).trim().toLowerCase() : '';
  const parentEmail = args['parent-email'] ? String(args['parent-email']).trim().toLowerCase() : '';

  if (!registrationNumber) {
    throw new Error('Missing --registration <REGISTRATION_NUMBER>');
  }

  if (!studentEmail && !parentEmail) {
    throw new Error('Provide at least one of --student-email <email> or --parent-email <email>');
  }

  if (studentEmail && !isValidEmail(studentEmail)) {
    throw new Error('Invalid --student-email value');
  }

  if (parentEmail && !isValidEmail(parentEmail)) {
    throw new Error('Invalid --parent-email value');
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
      await student.save();
    }

    if (parentEmail) {
      if (!student.parentId) {
        throw new Error(`No linked parent found for registration ${registrationNumber}`);
      }

      const parent = await Parent.findById(student.parentId._id);
      parent.email = parentEmail;
      await parent.save();
    }

    const refreshedStudent = await Student.findOne({ registrationNumber }).populate('parentId');

    console.log(JSON.stringify({
      success: true,
      registrationNumber,
      studentEmail: refreshedStudent.email,
      parentEmail: refreshedStudent.parentId?.email || null
    }, null, 2));
  } finally {
    await mongoose.connection.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});