import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateCustomId } from '../lib/idGenerator';
import {
  Student,
  Class,
  AttendanceRecord,
  Teacher,
  Subject,
  Grade,
  ClassSchedule,
} from '../types';
import type { Session as ConfigSession } from '../types';

// Generic create service generator
function createService<T extends { id: string }>(collectionName: string, prefix: string) {
  const colRef = collection(db, collectionName);

  return {
    getAll: async (): Promise<T[]> => {
      const snap = await getDocs(colRef);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
    },
    add: async (data: Omit<T, 'id'>): Promise<string> => {
      const id = await generateCustomId(prefix);
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef as any, { ...data, id });
      return id;
    },
    update: async (id: string, data: Partial<T>): Promise<void> => {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef as any, data as any);
    },
    delete: async (id: string): Promise<void> => {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    },
    subscribe: (callback: (data: T[]) => void) => {
      return onSnapshot(colRef, (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
        callback(items);
      });
    }
  };
}

export const studentService = createService<Student>('students', 'ANST');
export const classService = createService<Class>('classes', 'ANCL');
export const classScheduleService = createService<ClassSchedule>('class_schedules', 'ANCS');
export const sessionConfigService = createService<ConfigSession>('config_sessions', 'ANSE');
export const teacherService = createService<Teacher>('teachers', 'ANTE');
export const subjectService = createService<Subject>('subjects', 'ANSU');
export const gradeService = createService<Grade>('grades', 'ANGR');

// SessionService alias to sessionConfigService for compatibility if needed
export const sessionService = sessionConfigService;

// Attendance Service (Custom implementation since it has upsert and composite keys)
export const attendanceService = {
  subscribe: (callback: (records: AttendanceRecord[]) => void) => {
    const colRef = collection(db, 'attendance');
    return onSnapshot(colRef, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
      callback(items);
    });
  },
  upsert: async (record: Omit<AttendanceRecord, 'id' | 'timestamp'> & { timestamp?: number }) => {
    const colRef = collection(db, 'attendance');
    const q = query(
      colRef,
      where('studentId', '==', record.studentId),
      where('classId', '==', record.classId),
      where('date', '==', record.date)
    );
    const snap = await getDocs(q);
    
    const payload = {
      ...record,
      timestamp: record.timestamp ?? Date.now(),
    };

    if (!snap.empty) {
      // Update existing
      const existingDoc = snap.docs[0];
      await updateDoc(existingDoc.ref, payload);
    } else {
      // Create new
      const newRef = doc(colRef); // Auto-generate ID for attendance
      await setDoc(newRef, { ...payload, id: newRef.id });
    }
  },
  getSessionAttendance: (sessionId: string, callback: (records: AttendanceRecord[]) => void) => {
    const colRef = collection(db, 'attendance');
    const q = query(colRef, where('sessionId', '==', sessionId));
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
      callback(items);
    });
  },
};
