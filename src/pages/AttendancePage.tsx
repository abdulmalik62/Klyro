import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { 
  Calendar, 
  Check, 
  X, 
  MessageSquare, 
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { 
  studentService, 
  classService, 
  sessionService, 
  attendanceService 
} from '../services/firestore';
import { whatsappService } from '../services/whatsapp';
import { Student, Class, Session, AttendanceRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { appToasts } from '../lib/appToasts';

export const AttendancePage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    studentService.subscribe(setStudents);
    classService.subscribe(setClasses);
  }, []);

  const filteredStudents = students.filter(s => s.classId === selectedClassId);
  const selectedClass = classes.find(c => c.id === selectedClassId);

  const handleMark = (studentId: string, status: 'present' | 'absent') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!selectedClassId || !selectedSubject) {
      appToasts.selectClassAndSubject();
      return;
    }
    if (filteredStudents.length === 0) {
      appToasts.noStudentsInClass();
      return;
    }

    setIsSubmitting(true);
    try {
      const sessionData: Omit<Session, 'id'> = {
        classId: selectedClassId,
        subject: selectedSubject,
        teacherId: 'current-user-id', // Replace with actual user ID
        date: Date.now(),
        startTime: format(new Date(), 'HH:mm'),
        endTime: format(new Date(), 'HH:mm'),
      };

      const sessionDoc = await sessionService.add(sessionData);
      
      const promises = filteredStudents.map(student => {
        const status = attendance[student.id] || 'absent';
        return attendanceService.mark({
          sessionId: sessionDoc.id,
          studentId: student.id,
          status,
          remarks: remarks[student.id] || '',
          timestamp: Date.now()
        });
      });

      await Promise.all(promises);
      appToasts.attendanceSaved();

      // Reset
      setAttendance({});
      setRemarks({});
    } catch (error) {
      console.error(error);
      appToasts.attendanceFailed();
    } finally {
      setIsSubmitting(false);
    }
  };

  const phoneForPreferred = (s: Student): string | undefined => {
    switch (s.preferredContact) {
      case 'father':
        return s.fatherPhone;
      case 'mother':
        return s.motherPhone;
      case 'guardian':
        return s.guardianPhone;
      default:
        return s.guardianPhone || s.fatherPhone || s.motherPhone;
    }
  };

  const sendWhatsApp = (student: Student) => {
    const phone = phoneForPreferred(student);
    if (!phone?.trim()) {
      appToasts.whatsappNoPhone();
      return;
    }
    const status = attendance[student.id] || 'absent';
    const date = format(new Date(), 'PPP');
    appToasts.whatsappOpening();
    whatsappService.sendAttendanceNotification(student.name, status, date, phone);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-title">
          <h1 className="text-2xl font-bold text-[#1f2937]">Mark Attendance</h1>
          <p className="text-[#6b7280] text-[14px]">
            Current Session: {selectedSubject || '...'} ({format(new Date(), 'hh:mm a')})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Select Class</label>
          <select 
            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
            value={selectedClassId}
            onChange={e => {
              setSelectedClassId(e.target.value);
              setSelectedSubject('');
            }}
          >
            <option value="">Choose a class...</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Select Subject</label>
          <select 
            disabled={!selectedClassId}
            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 disabled:bg-gray-50"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
          >
            <option value="">Choose a subject...</option>
            {selectedClass?.subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedClassId && selectedSubject && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden"
        >
          <div className="p-4 border-b border-[#e5e7eb] bg-[#fafafa] flex items-center justify-between">
            <input 
              type="text" 
              className="w-[280px] px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-[13px]" 
              placeholder="Search student by name or ID..." 
            />
            <div className="flex gap-3">
              <button 
                onClick={() => filteredStudents.forEach(s => handleMark(s.id, 'present'))}
                className="px-3 py-1.5 border border-[#e5e7eb] bg-white text-[#1f2937] rounded-lg text-[12px] font-medium hover:bg-gray-50"
              >
                Bulk Mark Present
              </button>
              <button className="px-3 py-1.5 bg-[#25D366] text-white rounded-lg text-[12px] font-bold hover:opacity-90">
                Send Batch Update
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-[#fafafa] text-[#6b7280] text-[11px] uppercase tracking-wider font-bold border-b border-[#e5e7eb]">
                  <th className="px-6 py-3 w-[80px]">ID</th>
                  <th className="px-6 py-3 w-[200px]">Student Name</th>
                  <th className="px-6 py-3 w-[120px]">Last Status</th>
                  <th className="px-6 py-3 w-[180px]">Mark Attendance</th>
                  <th className="px-6 py-3">Remarks</th>
                  <th className="px-6 py-3 w-[100px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 font-mono text-[11px] text-[#6b7280]">#{1000 + idx}</td>
                    <td className="px-6 py-3 font-bold text-[13px] text-[#1f2937] truncate">{student.name}</td>
                    <td className="px-6 py-3">
                      <span className={cn(
                        "status-pill",
                        attendance[student.id] === 'present' ? "status-present" : "status-absent"
                      )}>
                        {attendance[student.id] === 'present' ? 'Present' : 'Absent'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex bg-[#f3f4f6] p-0.5 rounded-lg w-fit">
                        <button 
                          onClick={() => handleMark(student.id, 'present')}
                          className={cn(
                            "px-3 py-1 rounded-md text-[11px] font-bold transition-all",
                            attendance[student.id] === 'present' ? "bg-[#10b981] text-white" : "text-[#6b7280]"
                          )}
                        >
                          P
                        </button>
                        <button 
                          onClick={() => handleMark(student.id, 'absent')}
                          className={cn(
                            "px-3 py-1 rounded-md text-[11px] font-bold transition-all",
                            attendance[student.id] === 'absent' ? "bg-[#ef4444] text-white" : "text-[#6b7280]"
                          )}
                        >
                          A
                        </button>
                        <button className="px-3 py-1 rounded-md text-[11px] font-bold text-[#6b7280]">L</button>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <input 
                        type="text" 
                        placeholder="Add note..." 
                        className="w-full bg-transparent border-none text-[12px] focus:outline-none"
                        value={remarks[student.id] || ''}
                        onChange={e => setRemarks(prev => ({ ...prev, [student.id]: e.target.value }))}
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button 
                        onClick={() => sendWhatsApp(student)}
                        className="px-3 py-1.5 bg-[#25D366] text-white rounded-lg text-[11px] font-bold hover:opacity-90"
                      >
                        WA
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-[#fafafa] border-t border-[#e5e7eb] flex justify-end gap-3">
            <button className="px-4 py-2 text-[#6b7280] text-[12px] font-bold hover:text-[#1f2937]">
              Cancel Changes
            </button>
            <button 
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-6 py-2 bg-[#3b82f6] text-white rounded-lg text-[12px] font-bold hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Submit Attendance'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );

};

