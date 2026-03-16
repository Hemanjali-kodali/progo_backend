const fs = require('fs');
const path = require('path');
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
  const inputFile = args.file || 'email-updates.json';
  const resolvedFile = path.resolve(process.cwd(), inputFile);

  if (!fs.existsSync(resolvedFile)) {
    throw new Error(`Input file not found: ${resolvedFile}`);
  }

  const raw = fs.readFileSync(resolvedFile, 'utf8');
  const updates = JSON.parse(raw);

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error('Input file must contain a non-empty JSON array');
  }

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parent_student_chatbot', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const results = [];

  try {
    for (const item of updates) {
      const registrationNumber = String(item.registrationNumber || '').trim().toUpperCase();
      const studentEmail = item.studentEmail ? String(item.studentEmail).trim().toLowerCase() : '';
      const parentEmail = item.parentEmail ? String(item.parentEmail).trim().toLowerCase() : '';
      const studentPhone = item.studentPhone ? normalizePhone(item.studentPhone) : '';
      const parentPhone = item.parentPhone ? normalizePhone(item.parentPhone) : '';
      const parentAlternatePhone = item.parentAlternatePhone ? normalizePhone(item.parentAlternatePhone) : '';

      if (!registrationNumber) {
        results.push({ success: false, registrationNumber: null, error: 'Missing registrationNumber' });
        continue;
      }

      if (studentEmail && !isValidEmail(studentEmail)) {
        results.push({ success: false, registrationNumber, error: 'Invalid studentEmail' });
        continue;
      }

      if (parentEmail && !isValidEmail(parentEmail)) {
        results.push({ success: false, registrationNumber, error: 'Invalid parentEmail' });
        continue;
      }

      if (studentPhone && !isValidPhone(studentPhone)) {
        results.push({ success: false, registrationNumber, error: 'Invalid studentPhone' });
        continue;
      }

      if (parentPhone && !isValidPhone(parentPhone)) {
        results.push({ success: false, registrationNumber, error: 'Invalid parentPhone' });
        continue;
      }

      if (parentAlternatePhone && !isValidPhone(parentAlternatePhone)) {
        results.push({ success: false, registrationNumber, error: 'Invalid parentAlternatePhone' });
        continue;
      }

      if (!studentEmail && !parentEmail && !studentPhone && !parentPhone && !parentAlternatePhone) {
        results.push({ success: false, registrationNumber, error: 'No contact fields provided' });
        continue;
      }

      const student = await Student.findOne({ registrationNumber }).populate('parentId');
      if (!student) {
        results.push({ success: false, registrationNumber, error: 'Student not found' });
        continue;
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
          results.push({ success: false, registrationNumber, error: 'Linked parent not found' });
          continue;
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
      results.push({
        success: true,
        registrationNumber,
        studentEmail: refreshedStudent.email,
        studentPhone: refreshedStudent.phone || null,
        parentEmail: refreshedStudent.parentId?.email || null,
        parentPhone: refreshedStudent.parentId?.phone || null,
        parentAlternatePhone: refreshedStudent.parentId?.alternatePhone || null
      });
    }

    console.log(JSON.stringify({ success: true, updated: results }, null, 2));
  } finally {
    await mongoose.connection.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});