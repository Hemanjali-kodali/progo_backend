const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Student = require('./models/Student');
const Parent = require('./models/Parent');
const Attendance = require('./models/Attendance');
const Marks = require('./models/Marks');
const Backlog = require('./models/Backlog');
const Fee = require('./models/Fee');
const Exam = require('./models/Exam');
const Notification = require('./models/Notification');
const Faculty = require('./models/Faculty');
const Subject = require('./models/Subject');
const Course = require('./models/Course');

// Sample data
const sampleData = {
  courses: [
  {
    courseCode: 'BTCS',
    courseName: 'B.Tech Computer Science',
    department: 'Computer Science',
    totalSemesters: 8,
    duration: 4
  },
  {
    courseCode: 'BTEC',
    courseName: 'B.Tech Electronics',
    department: 'Electronics',
    totalSemesters: 8,
    duration: 4
  },
  {
    courseCode: 'MBA',
    courseName: 'Master of Business Administration',
    department: 'Management',
    totalSemesters: 4,
    duration: 2
  }
],

  subjects: [
  {
    subjectCode: 'CS201',
    subjectName: 'Data Structures and Algorithms',
    department: 'Computer Science',
    semester: 4,
    credits: 4
  },
  {
    subjectCode: 'CS202',
    subjectName: 'Operating Systems',
    department: 'Computer Science',
    semester: 4,
    credits: 4
  },
  {
    subjectCode: 'CS203',
    subjectName: 'Database Management Systems',
    department: 'Computer Science',
    semester: 4,
    credits: 4
  },
  {
    subjectCode: 'CS204',
    subjectName: 'Computer Networks',
    department: 'Computer Science',
    semester: 4,
    credits: 3
  },
  {
    subjectCode: 'CS205',
    subjectName: 'Software Engineering',
    department: 'Computer Science',
    semester: 4,
    credits: 3
  },
  {
    subjectCode: 'MA101',
    subjectName: 'Engineering Mathematics',
    department: 'Computer Science',
    semester: 4,
    credits: 4
  }
],

  faculty: [
  {
    employeeId: 'FAC001',
    firstName: 'Dr. Ramesh',
    lastName: 'Kumar',
    email: 'ramesh.kumar@college.edu',
    phone: '9876543210',
    department: 'Computer Science',
    designation: 'Professor',
    specialization: 'Data Structures'
  },
  {
    employeeId: 'FAC002',
    firstName: 'Dr. Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@college.edu',
    phone: '9876543211',
    department: 'Computer Science',
    designation: 'Associate Professor',
    specialization: 'Database Systems'
  },
  {
    employeeId: 'FAC003',
    firstName: 'Prof. Amit',
    lastName: 'Patel',
    email: 'amit.patel@college.edu',
    phone: '9876543212',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    specialization: 'Operating Systems'
  }
],

  parents: [
    {
      firstName: 'Srinivas',
      lastName: 'Geddam',
      email: 'srinivas.geddam@email.com',
      phone: '9876544201',
      alternatePhone: '9876544202',
      relationship: 'father',
      occupation: 'Engineer',
      address: {
        street: '11 Green Avenue',
        city: 'Hyderabad',
        state: 'Telangana',
        zipCode: '500001',
        country: 'India'
      }
    },
    {
      firstName: 'Lakshmi',
      lastName: 'Thota',
      email: 'lakshmi.thota@email.com',
      phone: '9876544211',
      alternatePhone: '9876544212',
      relationship: 'mother',
      occupation: 'Teacher',
      address: {
        street: '22 Lake Road',
        city: 'Vijayawada',
        state: 'Andhra Pradesh',
        zipCode: '520001',
        country: 'India'
      }
    },
    {
      firstName: 'Murali',
      lastName: 'Kodali',
      email: 'hemanjalikodali@gmail.com',
      phone: '9876544221',
      alternatePhone: '9876544222',
      relationship: 'father',
      occupation: 'Bank Manager',
      address: {
        street: '7 Temple Street',
        city: 'Guntur',
        state: 'Andhra Pradesh',
        zipCode: '522001',
        country: 'India'
      }
    },
    {
      firstName: 'Suresh',
      lastName: 'Kandulla',
      email: 'suresh.kandulla@email.com',
      phone: '9876544231',
      alternatePhone: '9876544232',
      relationship: 'father',
      occupation: 'Government Employee',
      address: {
        street: '88 River View',
        city: 'Warangal',
        state: 'Telangana',
        zipCode: '506001',
        country: 'India'
      }
    },
    {
      firstName: 'Madhavi',
      lastName: 'Lahari',
      email: 'madhavi.lahari@email.com',
      phone: '9876544241',
      alternatePhone: '9876544242',
      relationship: 'mother',
      occupation: 'Nurse',
      address: {
        street: '42 Rose Colony',
        city: 'Nellore',
        state: 'Andhra Pradesh',
        zipCode: '524001',
        country: 'India'
      }
    },
    {
      firstName: 'Ramesh',
      lastName: 'Y',
      email: 'ramesh.y@email.com',
      phone: '9876544251',
      alternatePhone: '9876544252',
      relationship: 'father',
      occupation: 'Contractor',
      address: {
        street: '16 Hill Lane',
        city: 'Tirupati',
        state: 'Andhra Pradesh',
        zipCode: '517501',
        country: 'India'
      }
    },
    {
      firstName: 'Saroja',
      lastName: 'M',
      email: 'saroja.m@email.com',
      phone: '9876544261',
      alternatePhone: '9876544262',
      relationship: 'mother',
      occupation: 'Homemaker',
      address: {
        street: '3 Sunrise Nagar',
        city: 'Kakinada',
        state: 'Andhra Pradesh',
        zipCode: '533001',
        country: 'India'
      }
    }
  ],

  students: [
    {
      registrationNumber: '231FA04826',
      firstName: 'Varshitha',
      lastName: 'Geddam',
      email: 'varshitha.geddam@student.edu',
      phone: '9876545201',
      department: 'Computer Science',
      year: 2,
      semester: 4,
      currentCGPA: 8.2
    },
    {
      registrationNumber: '231FA04827',
      firstName: 'Monika',
      lastName: 'Thota',
      email: 'monika.thota@student.edu',
      phone: '9876545202',
      department: 'Computer Science',
      year: 2,
      semester: 4,
      currentCGPA: 8.7
    },
    {
      registrationNumber: '231FA04833',
      firstName: 'Hemanjali',
      lastName: 'Kodali',
      email: 'hemanjali.kodali@student.edu',
      phone: '9876545203',
      department: 'Computer Science',
      year: 2,
      semester: 4,
      currentCGPA: 8.1
    },
    {
      registrationNumber: '231FA04869',
      firstName: 'Jahnavi',
      lastName: 'Kandulla',
      email: 'jahnavi.kandulla@student.edu',
      phone: '9876545204',
      department: 'Computer Science',
      year: 2,
      semester: 4,
      currentCGPA: 8.5
    },
    {
      registrationNumber: '231FA04914',
      firstName: 'Lahari',
      lastName: 'L',
      email: 'lahari.l@student.edu',
      phone: '9876545205',
      department: 'Computer Science',
      year: 2,
      semester: 4,
      currentCGPA: 7.9
    },
    {
      registrationNumber: '231FA04199',
      firstName: 'Deepika',
      lastName: 'Y',
      email: 'deepika.y@student.edu',
      phone: '9876545206',
      department: 'Computer Science',
      year: 2,
      semester: 4,
      currentCGPA: 8.0
    },
    {
      registrationNumber: '231FA04980',
      firstName: 'Kavitha',
      lastName: 'M',
      email: 'kavitha.m@student.edu',
      phone: '9876545207',
      department: 'Computer Science',
      year: 3,
      semester: 6,
      currentCGPA: 7.5
    }
  ],

  notifications: [
  {
    title: 'Holiday Announcement',
    message: 'College will remain closed on March 15, 2026 due to national holiday.',
    type: 'general',
    priority: 'medium',
    targetAudience: 'all',
    isActive: true
  },
  {
    title: 'Exam Schedule Released',
    message: 'End semester examination schedule has been released. Check your portal for details.',
    type: 'exam',
    priority: 'high',
    targetAudience: 'students',
    isActive: true
  },
  {
    title: 'Technical Workshop',
    message: 'Workshop on Machine Learning will be conducted on March 20, 2026. Register now!',
    type: 'event',
    priority: 'medium',
    targetAudience: 'students',
    isActive: true
  },
  {
    title: 'Fee Payment Reminder',
    message: 'Semester fee payment last date is March 31, 2026. Please clear dues.',
    type: 'fee',
    priority: 'high',
    targetAudience: 'all',
    isActive: true
  }
]};

// Seed database
async function seedDatabase() {
  try {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║  DATABASE SEEDER                      ║');
    console.log('║  Parent-Student Chatbot               ║');
    console.log('╚═══════════════════════════════════════╝\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parent_student_chatbot', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      Student.deleteMany({}),
      Parent.deleteMany({}),
      Attendance.deleteMany({}),
      Marks.deleteMany({}),
      Backlog.deleteMany({}),
      Fee.deleteMany({}),
      Exam.deleteMany({}),
      Notification.deleteMany({}),
      Faculty.deleteMany({}),
      Subject.deleteMany({}),
      Course.deleteMany({})
    ]);
    console.log('✓ Cleared existing data\n');

    // Seed Courses
    console.log('📚 Seeding Courses...');
    const courses = await Course.insertMany(sampleData.courses);
    console.log(`✓ Created ${courses.length} courses\n`);

    // Seed Subjects
    console.log('📖 Seeding Subjects...');
    const subjects = await Subject.insertMany(sampleData.subjects);
    console.log(`✓ Created ${subjects.length} subjects\n`);

    // Seed Faculty
    console.log('👨‍🏫 Seeding Faculty...');
    const faculty = await Faculty.insertMany(sampleData.faculty);
    console.log(`✓ Created ${faculty.length} faculty members\n`);

    // Seed Parents
    console.log('👨‍👩‍👧 Seeding Parents...');
    const parents = await Parent.insertMany(sampleData.parents);
    console.log(`✓ Created ${parents.length} parents\n`);

    // Seed Students
    console.log('🎓 Seeding Students...');
    const studentsWithRefs = sampleData.students.map((student, index) => ({
      ...student,
      registrationNumber: student.registrationNumber.toUpperCase(),
      courseId: courses[0]._id,  // Assign to first course
      parentId: parents[index]._id
    }));
    const students = await Student.insertMany(studentsWithRefs);
    console.log(`✓ Created ${students.length} students\n`);

    // Seed Attendance
    console.log('📊 Seeding Attendance Records...');
    const attendanceRecords = [];
    students.forEach(student => {
  subjects.slice(0, 5).forEach(subject => {
    const totalClasses = Math.floor(40 + Math.random() * 20);
    const attendedClasses = Math.floor(totalClasses * (0.7 + Math.random() * 0.3));

    attendanceRecords.push({
  studentId: student._id,
  subjectId: subject._id,
  semester: student.semester,
  academicYear: "2025-2026",
  date: new Date(),
  status: Math.random() > 0.2 ? "present" : "absent"
});
  });
}); attendance = await Attendance.insertMany(attendanceRecords);
    console.log(`✓ Created ${attendance.length} attendance records\n`);

    // Seed Marks
    // Seed Marks
console.log('📝 Seeding Marks Records...');
const marksRecords = [];

students.forEach(student => {

  // create marks for all semesters up to current semester
  for (let sem = 1; sem <= student.semester; sem++) {

    subjects.slice(0, 5).forEach(subject => {

      ['midterm', 'assignment', 'final'].forEach(examType => {

        const totalMarks = examType === 'assignment' ? 20 : 100;
        const marksObtained = Math.floor(totalMarks * (0.6 + Math.random() * 0.4));

        marksRecords.push({
          studentId: student._id,
          subjectId: subject._id,
          examType,
          marksObtained,
          totalMarks,
          semester: sem,
          academicYear: "2025-2026"
        });

      });

    });

  }

});
    const marks = await Marks.insertMany(marksRecords);
    console.log(`✓ Created ${marks.length} marks records\n`);

    // Seed Backlogs (some students)
    console.log('📉 Seeding Backlog Records...');
    const backlogRecords = [
  {
    studentId: students[2]._id,   // third student has backlog
    subjectId: subjects[1]._id,
    semester: 5,
    year: 3,
    marksObtained: 28,
    totalMarks: 100,
    academicYear: "2025-2026"
  }
];
    const backlogs = await Backlog.insertMany(backlogRecords);
    console.log(`✓ Created ${backlogs.length} backlog records\n`);

    // Seed Fees
    console.log('💰 Seeding Fee Records...');
    const feeRecords = [];

students.forEach((student, index) => {

  feeRecords.push({
    studentId: student._id,
    feeType: 'tuition',
    amount: 50000,
    paidAmount: index === 0 ? 50000 : 25000,
    dueDate: new Date('2026-03-31'),
    status: index === 0 ? 'paid' : 'partial',
    semester: student.semester,
    academicYear: "2025-2026"
  });

  feeRecords.push({
    studentId: student._id,
    feeType: 'library',
    amount: 5000,
    paidAmount: index !== 2 ? 5000 : 0,
    dueDate: new Date('2026-03-31'),
    status: index !== 2 ? 'paid' : 'pending',
    semester: student.semester,
    academicYear: "2025-2026"
  });

});
    const fees = await Fee.insertMany(feeRecords);
    console.log(`✓ Created ${fees.length} fee records\n`);

    // Seed Exams
    console.log('📅 Seeding Exam Schedule...');
    const examRecords = subjects.slice(0, 5).map((subject, index) => ({
  courseId: courses[0]._id,
  subjectId: subject._id,
  examName: `${subject.subjectName} Final Exam`,
  examType: 'final',            // must match enum values in your schema
  department: 'Computer Science',
  academicYear: '2025-2026',
  examDate: new Date(2026, 3, 15 + index), // April 15–19
  startTime: '09:00',
  endTime: '12:00',
  totalMarks: 100,
  semester: 4
}));
    const exams = await Exam.insertMany(examRecords);
    console.log(`✓ Created ${exams.length} exam records\n`);

    // Seed Notifications
    console.log('🔔 Seeding Notifications...');
    const notifications = await Notification.insertMany(sampleData.notifications);
    console.log(`✓ Created ${notifications.length} notifications\n`);

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('  SEEDING SUMMARY');
    console.log('═══════════════════════════════════════\n');
    console.log(`Courses: ${courses.length}`);
    console.log(`Subjects: ${subjects.length}`);
    console.log(`Faculty: ${faculty.length}`);
    console.log(`Parents: ${parents.length}`);
    console.log(`Students: ${students.length}`);
    console.log(`Attendance Records: ${attendance.length}`);
    console.log(`Marks Records: ${marks.length}`);
    console.log(`Backlogs: ${backlogs.length}`);
    console.log(`Fee Records: ${fees.length}`);
    console.log(`Exams: ${exams.length}`);
    console.log(`Notifications: ${notifications.length}`);
    console.log('\n✓ Database seeded successfully!\n');

    // Print login credentials
    console.log('═══════════════════════════════════════');
    console.log('  TEST LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════\n');
    students.forEach((student, index) => {
      console.log(`Student ${index + 1}:`);
      console.log(`  Registration: ${student.registrationNumber}`);
      console.log(`  Name: ${student.firstName} ${student.lastName}`);
      console.log(`  Parent Phone: ${parents[index].phone}`);
      console.log('');
    });

    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
    process.exit(0);

  } catch (error) {
    console.error('\n✗ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeder
seedDatabase();
