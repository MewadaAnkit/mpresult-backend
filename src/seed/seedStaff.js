const mongoose = require('mongoose');
require('dotenv').config();
const Staff = require('../models/Staff');

const staffSeedData = [
  // 1. PRIMARY WING (Classes 1 - 5 / PRT)
  {
    employeeId: 'EMP-0101',
    fullName: 'Sunita Sharma',
    phone: '9826100101',
    email: 'sunita.sharma@mpschool.edu.in',
    gender: 'FEMALE',
    designation: 'PRT Primary Teacher',
    cadre: 'PRT',
    teachingWings: ['PRIMARY'],
    primarySubject: 'Hindi',
    department: 'ACADEMIC',
    qualification: 'M.A. Hindi, B.Ed',
    experienceYears: 7,
    salary: 32000
  },
  {
    employeeId: 'EMP-0102',
    fullName: 'Anil Malviya',
    phone: '9826100102',
    email: 'anil.malviya@mpschool.edu.in',
    gender: 'MALE',
    designation: 'PRT Mathematics & EVS',
    cadre: 'PRT',
    teachingWings: ['PRIMARY'],
    primarySubject: 'Mathematics',
    department: 'ACADEMIC',
    qualification: 'B.Sc, D.El.Ed',
    experienceYears: 5,
    salary: 30000
  },
  {
    employeeId: 'EMP-0103',
    fullName: 'Meenakshi Joshi',
    phone: '9826100103',
    email: 'meenakshi.joshi@mpschool.edu.in',
    gender: 'FEMALE',
    designation: 'PRT English & Arts',
    cadre: 'PRT',
    teachingWings: ['PRIMARY'],
    primarySubject: 'English',
    department: 'ACADEMIC',
    qualification: 'B.A. English, B.Ed',
    experienceYears: 6,
    salary: 31000
  },

  // 2. MIDDLE & SECONDARY WING (Classes 6 - 10 / TGT)
  {
    employeeId: 'EMP-0201',
    fullName: 'Pooja Verma',
    phone: '9826045678',
    email: 'teacher@mpschool.edu.in',
    gender: 'FEMALE',
    designation: 'TGT Mathematics',
    cadre: 'TGT',
    teachingWings: ['MIDDLE', 'SECONDARY'],
    primarySubject: 'Mathematics',
    department: 'ACADEMIC',
    qualification: 'M.Sc Mathematics, B.Ed',
    experienceYears: 8,
    salary: 42000
  },
  {
    employeeId: 'EMP-0202',
    fullName: 'Rajesh Sharma',
    phone: '9826100202',
    email: 'rajesh.sharma@mpschool.edu.in',
    gender: 'MALE',
    designation: 'TGT Hindi (विशिष्ट व सामान्य हिन्दी)',
    cadre: 'TGT',
    teachingWings: ['MIDDLE', 'SECONDARY'],
    primarySubject: 'Hindi',
    department: 'ACADEMIC',
    qualification: 'M.A. Hindi Literature, B.Ed',
    experienceYears: 11,
    salary: 44000
  },
  {
    employeeId: 'EMP-0203',
    fullName: 'Anita Dixit',
    phone: '9826100203',
    email: 'anita.dixit@mpschool.edu.in',
    gender: 'FEMALE',
    designation: 'TGT English Literature & Grammar',
    cadre: 'TGT',
    teachingWings: ['MIDDLE', 'SECONDARY'],
    primarySubject: 'English',
    department: 'ACADEMIC',
    qualification: 'M.A. English, B.Ed',
    experienceYears: 9,
    salary: 43000
  },
  {
    employeeId: 'EMP-0204',
    fullName: 'Pt. Rameshwar Shastri',
    phone: '9826100204',
    email: 'rameshwar.shastri@mpschool.edu.in',
    gender: 'MALE',
    designation: 'TGT Sanskrit (तृतीय भाषा)',
    cadre: 'TGT',
    teachingWings: ['MIDDLE', 'SECONDARY'],
    primarySubject: 'Sanskrit',
    department: 'ACADEMIC',
    qualification: 'Acharya, M.A. Sanskrit, B.Ed',
    experienceYears: 14,
    salary: 46000
  },
  {
    employeeId: 'EMP-0205',
    fullName: 'Kailash Chandra Patidar',
    phone: '9826100205',
    email: 'kailash.patidar@mpschool.edu.in',
    gender: 'MALE',
    designation: 'TGT General Science & Physics',
    cadre: 'TGT',
    teachingWings: ['MIDDLE', 'SECONDARY'],
    primarySubject: 'Science',
    department: 'ACADEMIC',
    qualification: 'M.Sc Physics, B.Ed',
    experienceYears: 10,
    salary: 44000
  },
  {
    employeeId: 'EMP-0206',
    fullName: 'Sunita Chouhan',
    phone: '9826100206',
    email: 'sunita.chouhan@mpschool.edu.in',
    gender: 'FEMALE',
    designation: 'TGT Social Science (सामाजिक विज्ञान)',
    cadre: 'TGT',
    teachingWings: ['MIDDLE', 'SECONDARY'],
    primarySubject: 'Social Science',
    department: 'ACADEMIC',
    qualification: 'M.A. History, B.Ed',
    experienceYears: 8,
    salary: 41000
  },

  // 3. SENIOR SECONDARY WING (Classes 11 - 12 / PGT)
  {
    employeeId: 'EMP-0301',
    fullName: 'Dr. Suresh Chandra Malviya',
    phone: '9826034567',
    email: 'exam123@mpschool.edu.in',
    gender: 'MALE',
    designation: 'PGT Chemistry & Exam In-Charge',
    cadre: 'PGT',
    teachingWings: ['SENIOR_SECONDARY'],
    primarySubject: 'Chemistry',
    department: 'ACADEMIC',
    qualification: 'Ph.D Chemistry, M.Sc, B.Ed',
    experienceYears: 16,
    salary: 56000
  },
  {
    employeeId: 'EMP-0302',
    fullName: 'Dr. Manoj Rathore',
    phone: '9826100302',
    email: 'manoj.rathore@mpschool.edu.in',
    gender: 'MALE',
    designation: 'PGT Physics',
    cadre: 'PGT',
    teachingWings: ['SENIOR_SECONDARY'],
    primarySubject: 'Physics',
    department: 'ACADEMIC',
    qualification: 'M.Sc Physics, B.Ed, NET',
    experienceYears: 12,
    salary: 52000
  },
  {
    employeeId: 'EMP-0303',
    fullName: 'Deepak Kumar Verma',
    phone: '9826100303',
    email: 'deepak.verma@mpschool.edu.in',
    gender: 'MALE',
    designation: 'PGT Mathematics',
    cadre: 'PGT',
    teachingWings: ['SENIOR_SECONDARY'],
    primarySubject: 'Mathematics',
    department: 'ACADEMIC',
    qualification: 'M.Sc Mathematics, B.Ed',
    experienceYears: 13,
    salary: 53000
  },
  {
    employeeId: 'EMP-0304',
    fullName: 'Smt. Radha Tiwari',
    phone: '9826100304',
    email: 'radha.tiwari@mpschool.edu.in',
    gender: 'FEMALE',
    designation: 'PGT Biology & Botany',
    cadre: 'PGT',
    teachingWings: ['SENIOR_SECONDARY'],
    primarySubject: 'Biology',
    department: 'ACADEMIC',
    qualification: 'M.Sc Zoology, B.Ed',
    experienceYears: 11,
    salary: 50000
  },
  {
    employeeId: 'EMP-0305',
    fullName: 'Alok Saxena',
    phone: '9826100305',
    email: 'alok.saxena@mpschool.edu.in',
    gender: 'MALE',
    designation: 'PGT Commerce & Accountancy',
    cadre: 'PGT',
    teachingWings: ['SENIOR_SECONDARY'],
    primarySubject: 'Commerce',
    department: 'ACADEMIC',
    qualification: 'M.Com, B.Ed, M.Phil',
    experienceYears: 15,
    salary: 54000
  },

  // 4. SPECIALISTS & CO-CURRICULAR (All Classes)
  {
    employeeId: 'EMP-0401',
    fullName: 'Amit Patel',
    phone: '9826100401',
    email: 'amit.patel@mpschool.edu.in',
    gender: 'MALE',
    designation: 'Specialist IT & Computer Science',
    cadre: 'SPECIALIST',
    teachingWings: ['ALL'],
    primarySubject: 'Computer',
    department: 'ACADEMIC',
    qualification: 'MCA, B.Sc Computer Science',
    experienceYears: 8,
    salary: 40000
  },
  {
    employeeId: 'EMP-0402',
    fullName: 'Vikram Singh Tomar',
    phone: '9826100402',
    email: 'vikram.tomar@mpschool.edu.in',
    gender: 'MALE',
    designation: 'Sports Officer & Physical Education (PE)',
    cadre: 'SPECIALIST',
    teachingWings: ['ALL'],
    primarySubject: 'Sports',
    department: 'SPORTS',
    qualification: 'M.P.Ed, B.P.Ed, NIS Coach',
    experienceYears: 10,
    salary: 42000
  },
  {
    employeeId: 'EMP-0403',
    fullName: 'Sangeeta Rao',
    phone: '9826100403',
    email: 'sangeeta.rao@mpschool.edu.in',
    gender: 'FEMALE',
    designation: 'Specialist Fine Arts & Craft',
    cadre: 'SPECIALIST',
    teachingWings: ['ALL'],
    primarySubject: 'Art',
    department: 'ACADEMIC',
    qualification: 'BFA, MFA Painting',
    experienceYears: 7,
    salary: 36000
  }
];

async function seedStaff() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mp-result-management';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for Staff Seeding...');

    for (const item of staffSeedData) {
      await Staff.findOneAndUpdate(
        {
          $or: [
            { employeeId: item.employeeId },
            { fullName: item.fullName },
            { phone: item.phone }
          ]
        },
        { $set: item },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✓ Seeded/Updated staff: ${item.fullName} (${item.cadre} • ${item.primarySubject})`);
    }

    console.log(`\n🎉 Successfully seeded ${staffSeedData.length} faculty members across PRT, TGT, PGT, and Specialists!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding staff:', err);
    process.exit(1);
  }
}

seedStaff();
