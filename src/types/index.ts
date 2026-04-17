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
  name: string;
  rollNumber: string;
  parentEmail: string;
  parentPhone: string;
  classId: string;
  createdAt: number;
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  subjects: string[];
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

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: 'present' | 'absent';
  remarks?: string;
  timestamp: number;
}

export interface Teacher {
  id: string;
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
