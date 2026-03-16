const fs = require('fs');
const path = require('path');

const FIRST_NAMES = [
  'Aadhya', 'Aarav', 'Aarohi', 'Abhinav', 'Aditya', 'Akanksha', 'Akhil', 'Akshara', 'Ananya', 'Anish',
  'Anjali', 'Ankita', 'Arjun', 'Bhavya', 'Charan', 'Deepika', 'Divya', 'Gautham', 'Harini', 'Harsha',
  'Hema', 'Ishaan', 'Jahnavi', 'Karthik', 'Kavitha', 'Keerthi', 'Krishna', 'Lahari', 'Madhuri', 'Manasa',
  'Monika', 'Navya', 'Neha', 'Nikhil', 'Nithin', 'Pavani', 'Pranavi', 'Rahul', 'Rohit', 'Sai',
  'Sanjana', 'Sharvani', 'Sneha', 'Sowmya', 'Sreeja', 'Tejas', 'Varshitha', 'Vikram', 'Yash', 'Yamini'
];

const LAST_NAMES = [
  'Acharya', 'Babu', 'Chandra', 'Chowdary', 'Dasari', 'Geddam', 'Gowda', 'Gupta', 'Iyer', 'Jain',
  'Kandulla', 'Kapoor', 'Kodali', 'Kumar', 'Lanka', 'M', 'Maheshwari', 'Mehta', 'Mishra', 'Nair',
  'Naidu', 'Patel', 'Pillai', 'Prasad', 'Rao', 'Reddy', 'Roy', 'S', 'Sarma', 'Shah',
  'Sharma', 'Singh', 'Srinivas', 'Thota', 'Tripathi', 'V', 'Varma', 'Verma', 'Y', 'Yadav'
];

const REG_SERIES = ['4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];

const COURSES = [
  'B.Tech Computer Science',
  'B.Tech AI & Data Science',
  'B.Tech Information Technology'
];

const ROSTER_PATHS = [
  path.join(__dirname, 'data', 'student_roster.tsv'),
  path.join(__dirname, 'data', 'student_roster.csv')
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function deterministicNumber(seedText, min, max, decimals = 0) {
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = ((hash << 5) - hash) + seedText.charCodeAt(i);
    hash |= 0;
  }

  const normalized = Math.abs(hash % 100000) / 100000;
  const value = min + normalized * (max - min);
  return Number(value.toFixed(decimals));
}

function findRosterPath() {
  return ROSTER_PATHS.find((candidate) => fs.existsSync(candidate));
}

function splitRosterLine(line) {
  if (line.includes('\t')) {
    return line.split('\t').map((value) => value.trim());
  }

  return line.split(',').map((value) => value.trim());
}

function parseRosterRows(rawText) {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\d+\s/.test(line) || /^\d+\t/.test(line) || /^\d+,/.test(line))
    .map((line) => splitRosterLine(line))
    .filter((cols) => cols.length >= 10)
    .map((cols) => ({
      sl_no: cols[0],
      registration_number: String(cols[1] || '').toUpperCase(),
      name: String(cols[2] || '').replace(/\s+/g, ' ').trim(),
      branch: String(cols[3] || 'cse').trim(),
      current_year: parseInt(cols[4] || '3', 10),
      semester_in_year: parseInt(cols[5] || '2', 10),
      section: String(cols[6] || '').trim(),
      gender: String(cols[7] || '').trim().toUpperCase(),
      student_mobile: String(cols[8] || '').trim(),
      father_mobile: String(cols[9] || '').trim(),
      land_line: String(cols[10] || '').trim()
    }))
    .filter((row) => row.registration_number && row.name);
}

function deriveRowFromRoster(rosterRow) {
  const seed = `${rosterRow.registration_number}|${rosterRow.name}|${rosterRow.section}|${rosterRow.gender}`;
  const effectiveSemester = Math.max(1, Math.min(8, ((rosterRow.current_year - 1) * 2) + rosterRow.semester_in_year));
  const attendancePercentage = deterministicNumber(`${seed}|attendance`, 58, 98, 2);
  const previousCgpa = deterministicNumber(`${seed}|cgpa`, 5.2, 9.6, 2);
  const studyHoursPerDay = deterministicNumber(`${seed}|study`, 1.5, 8.5, 1);
  const assignmentsCompleted = deterministicNumber(`${seed}|assignments`, 48, 100, 0);
  const extracurricularActivities = deterministicNumber(`${seed}|extra`, 0, 6, 0);

  const riskScore =
    (attendancePercentage < 75 ? 1 : 0) +
    (previousCgpa < 6.5 ? 1 : 0) +
    (studyHoursPerDay < 3 ? 1 : 0) +
    (assignmentsCompleted < 65 ? 1 : 0);

  const hasBacklogs = riskScore >= 2 ? 'Yes' : 'No';

  let performanceCategory = 'Average';
  if (previousCgpa >= 8.6 && attendancePercentage >= 88 && assignmentsCompleted >= 80) performanceCategory = 'Excellent';
  else if (previousCgpa >= 7.3 && attendancePercentage >= 78) performanceCategory = 'Good';
  else if (previousCgpa < 6.0 || attendancePercentage < 70) performanceCategory = 'Needs Improvement';

  return {
    student_id: `STU${String(rosterRow.sl_no).padStart(4, '0')}`,
    registration_number: rosterRow.registration_number,
    name: rosterRow.name,
    semester: effectiveSemester,
    course: rosterRow.branch.toLowerCase() === 'cse' ? 'B.Tech Computer Science' : 'B.Tech Information Technology',
    attendance_percentage: attendancePercentage,
    previous_cgpa: previousCgpa,
    study_hours_per_day: studyHoursPerDay,
    assignments_completed: assignmentsCompleted,
    extracurricular_activities: extracurricularActivities,
    performance_category: performanceCategory,
    'Do I have any backlogs?': hasBacklogs
  };
}

function buildRegistrationPool(size) {
  const pool = [];

  for (const series of REG_SERIES) {
    const maxSuffix = series === 'G' ? 62 : 999;

    for (let i = 1; i <= maxSuffix; i++) {
      // Keep early series in 04001 style and end series in 0G62 style.
      const suffix = series === 'G' ? String(i) : String(i).padStart(3, '0');
      pool.push(`231FA0${series}${suffix}`);

      if (pool.length === size) {
        return pool;
      }
    }
  }

  if (pool.length < size) {
    throw new Error(`Not enough registration numbers to generate ${size} rows.`);
  }

  return pool;
}

function buildUniqueNames(size) {
  const names = [];
  const used = new Set();
  const firstLen = FIRST_NAMES.length;
  const lastLen = LAST_NAMES.length;

  for (let i = 0; i < size; i++) {
    const first = FIRST_NAMES[i % firstLen];
    const last = LAST_NAMES[Math.floor(i / firstLen) % lastLen];
    let candidate = `${first} ${last}`;

    if (used.has(candidate)) {
      candidate = `${candidate} ${Math.floor(i / (firstLen * lastLen)) + 1}`;
    }

    used.add(candidate);
    names.push(candidate);
  }

  return names;
}

function generateRow(index, registrationNumber, fullName) {
  const semester = randomInt(1, 8);
  const attendancePercentage = randomFloat(55, 99, 2);
  const previousCgpa = randomFloat(4.8, 9.9, 2);
  const studyHoursPerDay = randomFloat(1.0, 9.0, 1);
  const assignmentsCompleted = randomInt(35, 100);
  const extracurricularActivities = randomInt(0, 8);

  const riskScore =
    (attendancePercentage < 75 ? 1 : 0) +
    (previousCgpa < 6.5 ? 1 : 0) +
    (studyHoursPerDay < 3 ? 1 : 0) +
    (assignmentsCompleted < 65 ? 1 : 0);

  const hasBacklogs = riskScore >= 2 || (previousCgpa < 6.0 && Math.random() < 0.5) ? 'Yes' : 'No';

  let performanceCategory = 'Average';
  if (previousCgpa >= 8.7 && attendancePercentage >= 88 && assignmentsCompleted >= 80) performanceCategory = 'Excellent';
  else if (previousCgpa >= 7.4 && attendancePercentage >= 78) performanceCategory = 'Good';
  else if (previousCgpa < 6.0 || attendancePercentage < 70) performanceCategory = 'Needs Improvement';

  return {
    student_id: `STU${String(index + 1).padStart(4, '0')}`,
    registration_number: registrationNumber,
    name: fullName,
    semester,
    course: COURSES[randomInt(0, COURSES.length - 1)],
    attendance_percentage: attendancePercentage,
    previous_cgpa: previousCgpa,
    study_hours_per_day: studyHoursPerDay,
    assignments_completed: assignmentsCompleted,
    extracurricular_activities: extracurricularActivities,
    performance_category: performanceCategory,
    'Do I have any backlogs?': hasBacklogs
  };
}

function writeDataset(outputPath, size = 1000) {
  const headers = [
    'student_id',
    'registration_number',
    'name',
    'semester',
    'course',
    'attendance_percentage',
    'previous_cgpa',
    'study_hours_per_day',
    'assignments_completed',
    'extracurricular_activities',
    'performance_category',
    'Do I have any backlogs?'
  ];

  const rows = [headers.join(',')];
  const rosterPath = findRosterPath();
  let sourceRows;

  if (rosterPath) {
    const rosterText = fs.readFileSync(rosterPath, 'utf8');
    const rosterRows = parseRosterRows(rosterText);
    sourceRows = rosterRows.map(deriveRowFromRoster);
    console.log(`Using roster source: ${rosterPath}`);
    console.log(`Parsed ${sourceRows.length} roster rows`);
  } else {
    const registrations = buildRegistrationPool(size);
    const names = buildUniqueNames(size);
    sourceRows = registrations.map((registration, index) => generateRow(index, registration, names[index]));
  }

  for (const row of sourceRows) {
    const values = headers.map((header) => {
      const value = row[header];
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    });
    rows.push(values.join(','));
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, rows.join('\n'));
  console.log(`Generated ${size} records at ${outputPath}`);
}

if (require.main === module) {
  const outputPath = path.join(__dirname, 'data', 'dataset.csv');
  writeDataset(outputPath, 1000);
}

module.exports = {
  writeDataset
};
