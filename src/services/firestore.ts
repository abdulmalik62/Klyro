import { mockStorage } from './mockStorage';
import { Student, Class, Session, AttendanceRecord } from '../types';

// Students
export const studentService = {
  getAll: async () => mockStorage.getCollection('students'),
  add: async (student: Omit<Student, 'id'>) => mockStorage.addItem('students', student),
  update: async (id: string, student: Partial<Student>) => mockStorage.updateItem('students', id, student),
  delete: async (id: string) => mockStorage.deleteItem('students', id),
  subscribe: (callback: (students: Student[]) => void) => {
    const interval = setInterval(() => {
      callback(mockStorage.getCollection('students'));
    }, 1000);
    callback(mockStorage.getCollection('students'));
    return () => clearInterval(interval);
  }
};

// Classes
export const classService = {
  getAll: async () => mockStorage.getCollection('classes'),
  add: async (cls: Omit<Class, 'id'>) => mockStorage.addItem('classes', cls),
  subscribe: (callback: (classes: Class[]) => void) => {
    const interval = setInterval(() => {
      callback(mockStorage.getCollection('classes'));
    }, 1000);
    callback(mockStorage.getCollection('classes'));
    return () => clearInterval(interval);
  }
};

// Sessions
export const sessionService = {
  add: async (session: Omit<Session, 'id'>) => mockStorage.addItem('sessions', session),
  subscribe: (callback: (sessions: Session[]) => void) => {
    const interval = setInterval(() => {
      callback(mockStorage.getCollection('sessions'));
    }, 1000);
    callback(mockStorage.getCollection('sessions'));
    return () => clearInterval(interval);
  }
};

// Attendance
export const attendanceService = {
  mark: async (record: Omit<AttendanceRecord, 'id'>) => {
    const attendance = mockStorage.getCollection('attendance');
    const existing = attendance.find((a: any) => 
      a.sessionId === record.sessionId && a.studentId === record.studentId
    );
    
    if (existing) {
      mockStorage.updateItem('attendance', existing.id, record);
    } else {
      mockStorage.addItem('attendance', record);
    }
  },
  getSessionAttendance: (sessionId: string, callback: (records: AttendanceRecord[]) => void) => {
    const interval = setInterval(() => {
      const all = mockStorage.getCollection('attendance');
      callback(all.filter((a: any) => a.sessionId === sessionId));
    }, 1000);
    return () => clearInterval(interval);
  }
};

