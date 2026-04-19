import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Table2, Grid, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import {
  classService,
  classScheduleService,
  studentService,
  teacherService,
  subjectService,
  sessionConfigService,
  gradeService,
  attendanceService,
} from '../services/firestore';
import type {
  Class,
  Student,
  Teacher,
  Subject,
  Session,
  Grade,
  ClassSchedule,
  AttendanceRecord,
} from '../types';
import { formatLocalYmd, activeClassIdsForDate } from '../lib/attendanceScheduleUtils';
import { appToasts } from '../lib/appToasts';
import { cn } from '../lib/utils';

type AttendanceRow = {
  rowKey: string;
  student: Student;
  cls: Class;
  subjectName: string;
  teacherName: string;
  sessionName: string;
  sessionTime: string;
  gradeName: string;
};

function sessionTimeLabel(sess: Session | undefined): string {
  if (!sess) return '—';
  return `${sess.startTime} – ${sess.endTime}`;
}

export const Attendance: React.FC = () => {
  const todayYmd = formatLocalYmd(new Date());

  const [classes, setClasses] = useState<Class[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);

  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  const [filterGradeId, setFilterGradeId] = useState('');
  const [filterSessionId, setFilterSessionId] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState('');

  useEffect(() => {
    const u1 = classService.subscribe(setClasses);
    const u2 = classScheduleService.subscribe(setSchedules);
    const u3 = studentService.subscribe(setStudents);
    const u4 = teacherService.subscribe(setTeachers);
    const u5 = subjectService.subscribe(setSubjects);
    const u6 = sessionConfigService.subscribe(setSessions);
    const u7 = gradeService.subscribe(setGrades);
    const u8 = attendanceService.subscribe(setAttendanceList);
    return () => {
      u1();
      u2();
      u3();
      u4();
      u5();
      u6();
      u7();
      u8();
    };
  }, []);

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s.name])), [subjects]);
  const gradeMap = useMemo(() => new Map(grades.map((g) => [g.id, g.name])), [grades]);
  const sessionMap = useMemo(() => new Map(sessions.map((s) => [s.id, s.name])), [sessions]);
  const teacherMap = useMemo(
    () => new Map(teachers.map((t) => [t.id, `${t.pronoun ?? 'Mr'}. ${t.name}`])),
    [teachers]
  );
  const sessionById = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);

  const activeClassIds = useMemo(
    () => activeClassIdsForDate(schedules, todayYmd),
    [schedules, todayYmd]
  );

  const todaysClasses = useMemo(
    () => classes.filter((c) => activeClassIds.has(c.id)),
    [classes, activeClassIds]
  );

  const baseRows: AttendanceRow[] = useMemo(() => {
    const rows: AttendanceRow[] = [];
    for (const cls of todaysClasses) {
      const subjectName = subjectMap.get(cls.subjectId) ?? '—';
      const teacherName = teacherMap.get(cls.teacherId) ?? '—';
      const sess = sessionById.get(cls.sessionId);
      const sessionName = sessionMap.get(cls.sessionId) ?? '—';
      const sessionTime = sessionTimeLabel(sess);
      const gradeName = gradeMap.get(cls.gradeId) ?? '—';
      for (const sid of cls.studentIds || []) {
        const student = students.find((s) => s.id === sid);
        if (!student) continue;
        rows.push({
          rowKey: `${sid}_${cls.id}`,
          student,
          cls,
          subjectName,
          teacherName,
          sessionName,
          sessionTime,
          gradeName,
        });
      }
    }
    return rows;
  }, [todaysClasses, students, subjectMap, teacherMap, sessionMap, gradeMap, sessionById]);

  const filteredRows = useMemo(() => {
    let list = baseRows;
    if (filterSubjectId) list = list.filter((r) => r.cls.subjectId === filterSubjectId);
    if (filterClassId) list = list.filter((r) => r.cls.id === filterClassId);
    if (filterGradeId) list = list.filter((r) => r.cls.gradeId === filterGradeId);
    if (filterSessionId) list = list.filter((r) => r.cls.sessionId === filterSessionId);
    if (filterTeacherId) list = list.filter((r) => r.cls.teacherId === filterTeacherId);
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter((r) => r.student.name.toLowerCase().includes(q));
    }
    return list;
  }, [
    baseRows,
    filterSubjectId,
    filterClassId,
    filterGradeId,
    filterSessionId,
    filterTeacherId,
    searchTerm,
  ]);

  const recordFor = useCallback(
    (studentId: string, classId: string) =>
      attendanceList.find((a) => a.studentId === studentId && a.classId === classId && a.date === todayYmd),
    [attendanceList, todayYmd]
  );

  const setStatus = async (cls: Class, student: Student, status: 'present' | 'absent') => {
    try {
      await attendanceService.upsert({
        classId: cls.id,
        studentId: student.id,
        date: todayYmd,
        sessionId: cls.sessionId,
        status,
        timestamp: Date.now(),
      });
    } catch {
      appToasts.attendanceFailed();
    }
  };

  const filterSelectClass =
    'h-9 w-full rounded-lg border border-[#e5e7eb] bg-white px-2.5 text-[13px] text-[#1f2937] shadow-sm outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 sm:min-w-[140px]';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="page-title">
          <h1 className="text-2xl font-bold text-[#1f2937]">Attendance</h1>
          <p className="text-[14px] text-[#6b7280]">
            Today ({todayYmd}) — only classes with an active schedule. Mark each student present or absent.
          </p>
        </div>
        <div className="flex bg-white border border-[#e5e7eb] rounded-lg p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={cn(
              'flex items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors',
              viewMode === 'table' ? 'bg-[#3b82f6] text-white shadow-sm' : 'text-[#6b7280] hover:text-[#1f2937]'
            )}
          >
            <Table2 size={14} /> Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode('card')}
            className={cn(
              'flex items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors',
              viewMode === 'card' ? 'bg-[#3b82f6] text-white shadow-sm' : 'text-[#6b7280] hover:text-[#1f2937]'
            )}
          >
            <Grid size={14} /> Cards
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-[#1f2937]">
          <Filter size={18} className="text-[#6b7280]" />
          <span className="text-sm font-bold">Filters</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">Subject</label>
            <select
              className={filterSelectClass}
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
            >
              <option value="">All</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">Class</label>
            <select
              className={filterSelectClass}
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
            >
              <option value="">All</option>
              {todaysClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {subjectMap.get(c.subjectId) ?? c.id}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">Grade</label>
            <select
              className={filterSelectClass}
              value={filterGradeId}
              onChange={(e) => setFilterGradeId(e.target.value)}
            >
              <option value="">All</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">Session</label>
            <select
              className={filterSelectClass}
              value={filterSessionId}
              onChange={(e) => setFilterSessionId(e.target.value)}
            >
              <option value="">All</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">Teacher</label>
            <select
              className={filterSelectClass}
              value={filterTeacherId}
              onChange={(e) => setFilterTeacherId(e.target.value)}
            >
              <option value="">All</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {(t.pronoun ?? 'Mr')}. {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2 lg:col-span-1 xl:col-span-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">Search student</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
              <input
                type="search"
                placeholder="Name…"
                className="h-9 w-full rounded-lg border border-[#e5e7eb] bg-white py-2 pl-9 pr-3 text-[13px] shadow-sm outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {todaysClasses.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-gray-50 py-12 text-center text-sm text-[#6b7280]">
          No classes are scheduled for today. Add or extend class schedules in{' '}
          <span className="font-semibold text-[#1f2937]">Class Management</span>.
        </div>
      )}

      {todaysClasses.length > 0 && filteredRows.length === 0 && (
        <div className="rounded-xl border border-[#e5e7eb] bg-white py-12 text-center text-sm text-[#6b7280] shadow-sm">
          No students match your filters or search.
        </div>
      )}

      {viewMode === 'table' && filteredRows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#fafafa] text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {filteredRows.map((r) => {
                  const rec = recordFor(r.student.id, r.cls.id);
                  const status = rec?.status;
                  return (
                    <tr key={r.rowKey} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3 font-semibold text-[13px] text-[#1f2937]">{r.student.name}</td>
                      <td className="px-4 py-3 text-[13px] text-[#6b7280]">{r.gradeName}</td>
                      <td className="px-4 py-3 text-[13px] text-[#1f2937]">{r.subjectName}</td>
                      <td className="px-4 py-3 text-[13px] text-[#6b7280]">{r.teacherName}</td>
                      <td className="px-4 py-3 text-[12px] text-[#6b7280]">
                        <div className="font-medium text-[#1f2937]">{r.sessionName}</div>
                        <div className="text-[11px]">{r.sessionTime}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1 rounded-lg bg-[#f3f4f6] p-0.5">
                          <button
                            type="button"
                            onClick={() => setStatus(r.cls, r.student, 'present')}
                            className={cn(
                              'rounded-md px-3 py-1.5 text-[12px] font-bold transition-colors',
                              status === 'present' ? 'bg-emerald-500 text-white shadow-sm' : 'text-[#6b7280] hover:bg-white'
                            )}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatus(r.cls, r.student, 'absent')}
                            className={cn(
                              'rounded-md px-3 py-1.5 text-[12px] font-bold transition-colors',
                              status === 'absent' ? 'bg-red-500 text-white shadow-sm' : 'text-[#6b7280] hover:bg-white'
                            )}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'card' && filteredRows.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredRows.map((r) => {
            const rec = recordFor(r.student.id, r.cls.id);
            const status = rec?.status;
            return (
              <motion.div
                key={r.rowKey}
                layout
                className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm"
              >
                <h3 className="truncate text-lg font-bold text-[#1f2937]">{r.student.name}</h3>
                <p className="mt-1 text-sm text-[#6b7280]">
                  {r.gradeName} · {r.subjectName}
                </p>
                <p className="mt-2 text-[13px] text-[#374151]">{r.teacherName}</p>
                <p className="mt-1 text-[12px] text-[#6b7280]">
                  {r.sessionName} · {r.sessionTime}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus(r.cls, r.student, 'present')}
                    className={cn(
                      'flex-1 rounded-lg py-2 text-[13px] font-bold transition-colors',
                      status === 'present' ? 'bg-emerald-500 text-white shadow-sm' : 'border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-emerald-50'
                    )}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(r.cls, r.student, 'absent')}
                    className={cn(
                      'flex-1 rounded-lg py-2 text-[13px] font-bold transition-colors',
                      status === 'absent' ? 'bg-red-500 text-white shadow-sm' : 'border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-red-50'
                    )}
                  >
                    Absent
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
