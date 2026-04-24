export type UserRole = 'owner' | 'teacher' | 'parent';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: number;
}

export interface Student {
  id: string;

  // Basic Details
  name: string;
  rollNumber?: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;

  fatherPhone?: string;
  motherPhone?: string;
  guardianPhone?: string;

  parentEmail?: string;
  preferredContact: 'father' | 'mother' | 'guardian';

  age?: number;
  sex?: 'male' | 'female' | 'other';
  address?: string;

  // Academic Details
  externalGradeId?: string;
  school?: string;
  hscGroup?: string;

  // Enrollment
  gradeId: string;
  subjectIds: string[];
  sessionIds: string[];
  enrolledClassIds: string[];

  // Metadata
  createdAt: string;
}

export interface Class {
  id: string;
  gradeId: string;
  subjectId: string;
  teacherId: string;
  sessionId: string;
  studentIds: string[];
  createdAt: string;
}

export interface ClassSchedule {
  id: string;
  classId: string;
  startDate: string;
  endDate: string;
  daysOfWeek: string[]; // e.g. ["Mon", "Wed", "Fri"]
  createdAt: string;
}

export interface Session {
  id: string;
  classId: string;
  subject: string;
  teacherId: string;
  date: number;
  startTime: string;
  endTime: string;
}

/** Daily attendance per student per class (config session id for filtering/reporting). */
export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  /** Local calendar date YYYY-MM-DD */
  date: string;
  /** Config session template id (same as Class.sessionId). */
  sessionId: string;
  status: 'present' | 'absent';
  remarks?: string;
  timestamp: number;
}

export type TeacherPronoun = 'Mr' | 'Mrs' | 'Dr';

export interface Teacher {
  id: string;
  /** Honorific / title shown before the name (e.g. Mr, Mrs, Dr). */
  pronoun?: TeacherPronoun;
  name: string;
  phone: string;
  qualification: string;
  experience: number;
  majorSubjectIds: string[];  // Subject IDs
  otherSubjectIds: string[];  // Subject IDs
  address?: string;
  createdAt: number;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  createdAt: number;
}

export interface Session {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  createdAt: number;
}

export interface Grade {
  id: string;
  name: string;
  section?: string;
  createdAt: number;
}

