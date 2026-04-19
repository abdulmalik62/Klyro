import React, { useCallback, useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { EventClickArg, EventInput, EventMountArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Calendar, Clock, Filter, Users, X } from 'lucide-react';
import {
  classService,
  classScheduleService,
  studentService,
  teacherService,
  subjectService,
  sessionConfigService,
  gradeService,
} from '../services/firestore';
import type {
  Class,
  ClassSchedule,
  Student,
  Teacher,
  Subject,
  Session,
  Grade,
} from '../types';
import { appToasts } from '../lib/appToasts';

const MAX_DAYS_PER_SCHEDULE = 800;

const DAY_KEY_TO_JS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

type ScheduleEventProps = {
  classId: string;
  subjectId: string;
  teacherId: string;
  gradeId: string;
  studentIds: string[];
  scheduleId: string;
  sessionName: string;
};

function parseLocalDate(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  if (!y || !m || !d) return new Date(NaN);
  return new Date(y, m - 1, d);
}

function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

function* eachDateInRange(startStr: string, endStr: string): Generator<string> {
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return;
  let n = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (++n > MAX_DAYS_PER_SCHEDULE) break;
    yield formatLocalYmd(new Date(d));
  }
}

function matchesScheduleWeekday(dateStr: string, daysOfWeek: string[]): boolean {
  const d = parseLocalDate(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const js = d.getDay();
  return daysOfWeek.some((key) => {
    const k = key.trim();
    const mapped = DAY_KEY_TO_JS[k];
    return mapped === js;
  });
}

/** Build local datetime string for FullCalendar (no timezone suffix). */
function combineDateAndHm(dateYmd: string, hm: string): string {
  const t = hm.trim();
  const [hRaw, mRaw = '0'] = t.split(':');
  const hh = String(parseInt(hRaw, 10) || 0).padStart(2, '0');
  const mm = String(parseInt(mRaw.replace(/\D/g, '') || '0', 10)).padStart(2, '0');
  return `${dateYmd}T${hh}:${mm}:00`;
}

function colorForSubjectId(subjectId: string): string {
  let h = 0;
  for (let i = 0; i < subjectId.length; i++) h = (h * 31 + subjectId.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 62% 42%)`;
}

function buildScheduleEvents(
  classSchedules: ClassSchedule[],
  classes: Class[],
  sessions: Session[],
  subjectMap: Map<string, string>
): EventInput[] {
  const classById = new Map(classes.map((c) => [c.id, c]));
  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const events: EventInput[] = [];

  for (const sch of classSchedules) {
    const cls = classById.get(sch.classId);
    if (!cls) continue;
    const session = sessionById.get(cls.sessionId);
    if (!session) continue;
    const subjectName = subjectMap.get(cls.subjectId) ?? 'Class';

    for (const dateStr of eachDateInRange(sch.startDate, sch.endDate)) {
      if (!matchesScheduleWeekday(dateStr, sch.daysOfWeek)) continue;
      const start = combineDateAndHm(dateStr, session.startTime);
      const end = combineDateAndHm(dateStr, session.endTime);
      const ext: ScheduleEventProps = {
        classId: cls.id,
        subjectId: cls.subjectId,
        teacherId: cls.teacherId,
        gradeId: cls.gradeId,
        studentIds: cls.studentIds ?? [],
        scheduleId: sch.id,
        sessionName: session.name,
      };
      events.push({
        id: `${sch.id}_${dateStr}`,
        title: subjectName,
        start,
        end,
        backgroundColor: colorForSubjectId(cls.subjectId),
        borderColor: colorForSubjectId(cls.subjectId),
        extendedProps: ext,
      });
    }
  }
  return events;
}

export const Schedules: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  const [filterTeacherId, setFilterTeacherId] = useState('');
  const [filterGradeId, setFilterGradeId] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  useEffect(() => {
    const u1 = classService.subscribe(setClasses);
    const u2 = classScheduleService.subscribe(setClassSchedules);
    const u3 = studentService.subscribe(setStudents);
    const u4 = teacherService.subscribe(setTeachers);
    const u5 = subjectService.subscribe(setSubjects);
    const u6 = sessionConfigService.subscribe(setSessions);
    const u7 = gradeService.subscribe(setGrades);
    return () => {
      u1();
      u2();
      u3();
      u4();
      u5();
      u6();
      u7();
    };
  }, []);

  const gradeMap = useMemo(() => new Map(grades.map((g) => [g.id, g.name])), [grades]);
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s.name])), [subjects]);
  const teacherMap = useMemo(
    () => new Map(teachers.map((t) => [t.id, `${t.pronoun ?? 'Mr'}. ${t.name}`])),
    [teachers]
  );
  const sessionMap = useMemo(() => new Map(sessions.map((s) => [s.id, s.name])), [sessions]);

  const baseEvents = useMemo(
    () => buildScheduleEvents(classSchedules, classes, sessions, subjectMap),
    [classSchedules, classes, sessions, subjectMap]
  );

  const calendarEvents = useMemo(() => {
    if (!filterTeacherId && !filterGradeId) return baseEvents;
    return baseEvents.filter((ev) => {
      const p = ev.extendedProps as ScheduleEventProps | undefined;
      if (!p) return false;
      if (filterTeacherId && p.teacherId !== filterTeacherId) return false;
      if (filterGradeId && p.gradeId !== filterGradeId) return false;
      return true;
    });
  }, [baseEvents, filterTeacherId, filterGradeId]);

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const p = arg.event.extendedProps as ScheduleEventProps;
      const cls = classes.find((c) => c.id === p.classId);
      if (!cls) {
        appToasts.genericError();
        return;
      }
      setSelectedClass(cls);
      setDetailOpen(true);
    },
    [classes]
  );

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedClass(null);
  };

  const studentsInSelectedClass = useMemo(() => {
    if (!selectedClass) return [];
    return (selectedClass.studentIds ?? [])
      .map((id) => students.find((s) => s.id === id))
      .filter((s): s is Student => Boolean(s));
  }, [selectedClass, students]);

  const sessionForSelected = useMemo(() => {
    if (!selectedClass) return null;
    return sessions.find((s) => s.id === selectedClass.sessionId) ?? null;
  }, [selectedClass, sessions]);

  const eventDidMount = useCallback(
    (info: EventMountArg) => {
      const p = info.event.extendedProps as ScheduleEventProps;
      const teacher = teacherMap.get(p.teacherId) ?? 'Teacher';
      const grade = gradeMap.get(p.gradeId) ?? 'Grade';
      info.el.setAttribute(
        'title',
        `${String(info.event.title)}\n${teacher}\n${grade}\n${p.sessionName}`
      );
    },
    [gradeMap, teacherMap]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]">Schedules</h1>
        <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-[#64748b]">
          Timetable from class schedules and session times. Scroll inside the calendar panel — the app chrome stays fixed.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm ring-1 ring-black/[0.04]">
        <div className="flex shrink-0 flex-col gap-4 border-b border-[#f1f5f9] bg-[#fafbfc] px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-2 text-[#0f172a]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-[#e2e8f0]">
              <Filter size={16} className="text-[#64748b]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0f172a]">Filters</p>
              <p className="text-[11px] text-[#94a3b8]">Narrow the calendar view</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Teacher
              </label>
              <select
                className="h-10 w-full min-w-[200px] rounded-lg border border-[#e2e8f0] bg-white px-3 text-[13px] text-[#0f172a] shadow-sm outline-none transition focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 sm:w-56"
                value={filterTeacherId}
                onChange={(e) => setFilterTeacherId(e.target.value)}
              >
                <option value="">All teachers</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {(t.pronoun ?? 'Mr')}. {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Grade
              </label>
              <select
                className="h-10 w-full min-w-[200px] rounded-lg border border-[#e2e8f0] bg-white px-3 text-[13px] text-[#0f172a] shadow-sm outline-none transition focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 sm:w-48"
                value={filterGradeId}
                onChange={(e) => setFilterGradeId(e.target.value)}
              >
                <option value="">All grades</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#fafbfc]">
          <div className="absolute inset-0 p-2 sm:p-3">
            <div className="schedules-fc-root h-full min-h-[22rem]">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={calendarEvents}
                eventClick={handleEventClick}
                height="100%"
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
                allDaySlot={false}
                nowIndicator
                eventDidMount={eventDidMount}
                stickyHeaderDates
              />
            </div>
          </div>
          {calendarEvents.length === 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-[42%] flex justify-center px-4">
              <p className="max-w-md text-center text-sm leading-relaxed text-[#64748b]">
                No schedule events yet. Add schedules from{' '}
                <span className="font-medium text-[#0f172a]">Class Management</span> → view a class.
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {detailOpen && selectedClass && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDetail}
              className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#e5e7eb] bg-white shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e5e7eb] bg-[#fafafa] p-6">
                <h3 className="text-[18px] font-bold text-[#1f2937]">Class details</h3>
                <button
                  type="button"
                  onClick={closeDetail}
                  className="rounded-lg p-1.5 text-[#9ca3af] transition-colors hover:bg-gray-200 hover:text-[#1f2937]"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-6 p-6">
                <div className="rounded-xl border border-[#e5e7eb] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-[#3b82f6]/10 p-2">
                      <BookOpen size={20} className="text-[#3b82f6]" />
                    </div>
                    <h4 className="text-lg font-bold text-[#1f2937]">Overview</h4>
                  </div>
                  <dl className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <dt className="mb-1 font-medium text-[#6b7280]">Grade</dt>
                      <dd className="font-semibold text-[#1f2937]">
                        {gradeMap.get(selectedClass.gradeId) ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="mb-1 font-medium text-[#6b7280]">Subject</dt>
                      <dd className="font-semibold text-[#1f2937]">
                        {subjectMap.get(selectedClass.subjectId) ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="mb-1 font-medium text-[#6b7280]">Teacher</dt>
                      <dd className="font-semibold text-[#1f2937]">
                        {teacherMap.get(selectedClass.teacherId) ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="mb-1 flex items-center gap-1 font-medium text-[#6b7280]">
                        <Calendar size={14} /> Session
                      </dt>
                      <dd className="font-semibold text-[#1f2937]">
                        {sessionMap.get(selectedClass.sessionId) ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="mb-1 flex items-center gap-1 font-medium text-[#6b7280]">
                        <Clock size={14} /> Time
                      </dt>
                      <dd className="font-semibold text-[#1f2937]">
                        {sessionForSelected
                          ? `${sessionForSelected.startTime} – ${sessionForSelected.endTime}`
                          : '—'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-xl border border-[#e5e7eb] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-[#10b981]/10 p-2">
                      <Users size={20} className="text-[#10b981]" />
                    </div>
                    <h4 className="text-lg font-bold text-[#1f2937]">
                      Students ({studentsInSelectedClass.length})
                    </h4>
                  </div>
                  {studentsInSelectedClass.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-[#e5e7eb] bg-gray-50 py-8 text-center text-sm text-[#6b7280]">
                      No students assigned to this class.
                    </p>
                  ) : (
                    <ul className="max-h-64 space-y-2 overflow-y-auto">
                      {studentsInSelectedClass.map((s) => (
                        <li
                          key={s.id}
                          className="rounded-lg border border-[#f3f4f6] bg-gray-50/80 px-3 py-2 text-sm font-medium text-[#1f2937]"
                        >
                          {s.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
