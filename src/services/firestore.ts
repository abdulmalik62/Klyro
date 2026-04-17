import { mockStorage } from './mockStorage';
import { Student, Class, AttendanceRecord, Teacher, Subject, Grade } from '../types';
import type { Session as ConfigSession } from '../types';

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
  add: async (session: Omit<ConfigSession, 'id'>) => mockStorage.addItem('sessions', session),
  subscribe: (callback: (sessions: ConfigSession[]) => void) => {
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

// Teachers
import { Teacher } from '../types';

export const teacherService = {
  getAll: async () => mockStorage.getCollection('teachers'),
  add: async (teacher: Omit<Teacher, 'id'>) => mockStorage.addItem('teachers', teacher),
  update: async (id: string, teacher: Partial<Teacher>) => mockStorage.updateItem('teachers', id, teacher),
  delete: async (id: string) => mockStorage.deleteItem('teachers', id),
  subscribe: (callback: (teachers: Teacher[]) => void) => {
    const interval = setInterval(() => {
      callback(mockStorage.getCollection('teachers'));
    }, 1000);
    callback(mockStorage.getCollection('teachers'));
    return () => clearInterval(interval);
  }
};


// Academic Config Services
import { Subject, Session, Grade } from '../types';

export const subjectService = {
  getAll: async () => mockStorage.getCollection('subjects'),
  add: async (subject: Omit<Subject, 'id'>) => mockStorage.addItem('subjects', subject),
  update: async (id: string, subject: Partial<Subject>) => mockStorage.updateItem('subjects', id, subject),
  delete: async (id: string) => mockStorage.deleteItem('subjects', id),
  subscribe: (callback: (subjects: Subject[]) => void) => {
    const interval = setInterval(() => {
      callback(mockStorage.getCollection('subjects'));
    }, 1000);
    callback(mockStorage.getCollection('subjects'));
    return () => clearInterval(interval);
  }
};

export const sessionConfigService = {
  getAll: async () => mockStorage.getCollection('config_sessions'),
  add: async (session: Omit<Session, 'id'>) => mockStorage.addItem('config_sessions', session),
  update: async (id: string, session: Partial<Session>) => mockStorage.updateItem('config_sessions', id, session),
  delete: async (id: string) => mockStorage.deleteItem('config_sessions', id),
  subscribe: (callback: (sessions: Session[]) => void) => {
    const interval = setInterval(() => {
      callback(mockStorage.getCollection('config_sessions'));
    }, 1000);
    callback(mockStorage.getCollection('config_sessions'));
    return () => clearInterval(interval);
  }
};

export const gradeService = {
  getAll: async () => mockStorage.getCollection('grades'),
  add: async (grade: Omit<Grade, 'id'>) => mockStorage.addItem('grades', grade),
  update: async (id: string, grade: Partial<Grade>) => mockStorage.updateItem('grades', id, grade),
  delete: async (id: string) => mockStorage.deleteItem('grades', id),
  subscribe: (callback: (grades: Grade[]) => void) => {
    const interval = setInterval(() => {
      callback(mockStorage.getCollection('grades'));
    }, 1000);
    callback(mockStorage.getCollection('grades'));
    return () => clearInterval(interval);
  }
};



