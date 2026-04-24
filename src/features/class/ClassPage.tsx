import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Search, Table2, Grid } from 'lucide-react';
import { 
  classService, studentService, teacherService, subjectService, sessionConfigService, gradeService, classScheduleService, attendanceService 
} from '../../services/firestore';
import type { Class, Student, Teacher, Subject, Session, Grade, ClassSchedule, AttendanceRecord } from '../../types';
import { appToasts } from '../../lib/appToasts';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { formatLocalYmd, activeClassIdsForDate } from '../../lib/attendanceScheduleUtils';

import { ClassTable } from './ClassTable';
import { ClassCard } from './ClassCard';
import { ClassFormModal } from './ClassFormModal';
import { ClassViewModal } from './ClassViewModal';

const WEEKDAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const WEEKDAY_LABELS: Record<(typeof WEEKDAY_ORDER)[number], string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

const parseLocalDate = (yyyyMmDd: string): Date => {
  const parts = yyyyMmDd.split('-').map(Number);
  const [y, m, d] = parts;
  if (!y || !m || !d) return new Date(NaN);
  return new Date(y, m - 1, d);
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const rangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) => {
  const a1 = parseLocalDate(aStart).getTime();
  const a2 = parseLocalDate(aEnd).getTime();
  const b1 = parseLocalDate(bStart).getTime();
  const b2 = parseLocalDate(bEnd).getTime();
  if ([a1, a2, b1, b2].some((t) => Number.isNaN(t))) return false;
  return a1 <= b2 && b1 <= a2;
};

export const ClassPage: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]); 
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [classIdToDelete, setClassIdToDelete] = useState<string | null>(null);

  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [addScheduleOpen, setAddScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    startDate: '',
    endDate: '',
    days: [] as string[],
  });
  const [scheduleFormErrors, setScheduleFormErrors] = useState<Record<string, string>>({});

  // Modal form state
  const [formData, setFormData] = useState({
    subjectId: '',
    teacherId: '',
    sessionId: '',
    studentIds: [] as string[]
  });

  // Filtering state for modal
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
  const [eligibleStudents, setEligibleStudents] = useState<Student[]>([]);

  // Lookup maps
  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
  const teacherMap = useMemo(
    () => new Map(teachers.map((t) => [t.id, `${t.pronoun ?? 'Mr'}. ${t.name}`])),
    [teachers]
  );
  const sessionMap = useMemo(() => new Map(sessions.map(s => [s.id, s.name])), [sessions]);
  const gradeMap = useMemo(() => new Map(grades.map(g => [g.id, g.name])), [grades]);

  const schedulesForSelectedClass = useMemo(
    () => (selectedClass ? schedules.filter((s) => s.classId === selectedClass.id) : []),
    [schedules, selectedClass]
  );

  const { upcomingSchedules, completedSchedules } = useMemo(() => {
    const today = startOfToday();
    const upcoming: ClassSchedule[] = [];
    const completed: ClassSchedule[] = [];
    for (const sch of schedulesForSelectedClass) {
      const end = parseLocalDate(sch.endDate);
      end.setHours(0, 0, 0, 0);
      if (end.getTime() >= today.getTime()) upcoming.push(sch);
      else completed.push(sch);
    }
    const byStart = (a: ClassSchedule, b: ClassSchedule) =>
      parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime();
    upcoming.sort(byStart);
    completed.sort((a, b) => parseLocalDate(b.endDate).getTime() - parseLocalDate(a.endDate).getTime());
    return { upcomingSchedules: upcoming, completedSchedules: completed };
  }, [schedulesForSelectedClass]);

  const formatDisplayDate = (yyyyMmDd: string) => {
    const d = parseLocalDate(yyyyMmDd);
    if (Number.isNaN(d.getTime())) return yyyyMmDd;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDaysList = (days: string[]) =>
    [...days].sort((a, b) => WEEKDAY_ORDER.indexOf(a as (typeof WEEKDAY_ORDER)[number]) - WEEKDAY_ORDER.indexOf(b as (typeof WEEKDAY_ORDER)[number])).join(', ');

  // Subscriptions
  useEffect(() => {
    const unsubClasses = classService.subscribe(setClasses);
    const unsubStudents = studentService.subscribe(setStudents);
    const unsubTeachers = teacherService.subscribe(setTeachers);
    const unsubSubjects = subjectService.subscribe(setSubjects);
    const unsubSessions = sessionConfigService.subscribe(setSessions);
    const unsubGrades = gradeService.subscribe(setGrades);
    const unsubSchedules = classScheduleService.subscribe(setSchedules);
    const unsubAttendance = attendanceService.subscribe(setAttendanceRecords);
    
    return () => {
      unsubClasses();
      unsubStudents();
      unsubTeachers();
      unsubSubjects();
      unsubSessions();
      unsubGrades();
      unsubSchedules();
      unsubAttendance();
    };
  }, []);

  // Search filtering
  const currentClasses = useMemo(
    () =>
      classes.filter(
        (cls) =>
          gradeMap.get(cls.gradeId)?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
          subjectMap.get(cls.subjectId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacherMap.get(cls.teacherId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sessionMap.get(cls.sessionId)?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [classes, searchTerm, gradeMap, subjectMap, teacherMap, sessionMap]
  );

  // Filtering logic for modal
  const getAvailableTeachers = useCallback((subjectId: string): Teacher[] => {
    return teachers.filter(t => t.majorSubjectIds.includes(subjectId));
  }, [teachers]);

  const getAvailableSessions = useCallback((teacherId: string): Session[] => {
    return sessions.filter(s => 
      !classes.some(c => c.teacherId === teacherId && c.sessionId === s.id)
    );
  }, [sessions, classes]);

  const getEligibleStudents = useCallback((subjectId: string, sessionId: string, gradeOverride?: string): Student[] => {
    const gradeId = gradeOverride !== undefined ? gradeOverride : selectedGrade;
    return students.filter(s => 
      s.subjectIds.includes(subjectId) &&
      s.sessionIds.includes(sessionId) &&
      s.gradeId === gradeId
    );
  }, [students, selectedGrade]);

  // Update filtering when selections change
  useEffect(() => {
    if (!formData.subjectId) return;

    const teachersList = getAvailableTeachers(formData.subjectId);
    setAvailableTeachers(teachersList);

    if (
      formData.teacherId &&
      !teachersList.some(t => t.id === formData.teacherId)
    ) {
      setFormData(prev => ({
        ...prev,
        teacherId: '',
        sessionId: ''
      }));
    }
  }, [formData.subjectId, teachers]);

  useEffect(() => {
    if (!formData.teacherId) return;

    const sessionsList = getAvailableSessions(formData.teacherId);
    setAvailableSessions(sessionsList);

    if (
      formData.sessionId &&
      !sessionsList.some(s => s.id === formData.sessionId)
    ) {
      setFormData(prev => ({
        ...prev,
        sessionId: ''
      }));
    }
  }, [formData.teacherId, classes, sessions]);

  useEffect(() => {
    if (formData.subjectId && formData.sessionId) {
      const list = getEligibleStudents(formData.subjectId, formData.sessionId);
      setEligibleStudents(list);
    }
  }, [formData.subjectId, formData.sessionId, selectedGrade, getEligibleStudents]);

  // Modal handlers
  const openViewModal = (cls: Class) => {
    setSelectedClass(cls);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setSelectedClass(null);
    setAddScheduleOpen(false);
    setScheduleForm({ startDate: '', endDate: '', days: [] });
    setScheduleFormErrors({});
  };

  const openAddScheduleModal = () => {
    setScheduleForm({ startDate: '', endDate: '', days: [] });
    setScheduleFormErrors({});
    setAddScheduleOpen(true);
  };

  const closeAddScheduleModal = () => {
    setAddScheduleOpen(false);
    setScheduleForm({ startDate: '', endDate: '', days: [] });
    setScheduleFormErrors({});
  };

  const toggleScheduleDay = (key: string) => {
    setScheduleForm((prev) => ({
      ...prev,
      days: prev.days.includes(key) ? prev.days.filter((d) => d !== key) : [...prev.days, key],
    }));
    setScheduleFormErrors((prev) => ({ ...prev, days: '' }));
  };

  const validateScheduleForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!scheduleForm.startDate) errors.startDate = 'Start date is required';
    if (!scheduleForm.endDate) errors.endDate = 'End date is required';
    if (scheduleForm.startDate && scheduleForm.endDate) {
      if (parseLocalDate(scheduleForm.endDate) < parseLocalDate(scheduleForm.startDate)) {
        errors.endDate = 'End date must be on or after start date';
      }
    }
    if (scheduleForm.days.length === 0) errors.days = 'Select at least one day';
    if (selectedClass && scheduleForm.startDate && scheduleForm.endDate && !errors.endDate) {
      const overlap = schedulesForSelectedClass.some((s) =>
        rangesOverlap(scheduleForm.startDate, scheduleForm.endDate, s.startDate, s.endDate)
      );
      if (overlap) errors.range = 'This date range overlaps an existing schedule for this class';
    }
    return errors;
  };

  const handleAddScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    const errors = validateScheduleForm();
    if (Object.keys(errors).length > 0) {
      setScheduleFormErrors(errors);
      appToasts.fixForm();
      return;
    }
    const orderedDays = [...scheduleForm.days].sort(
      (a, b) => WEEKDAY_ORDER.indexOf(a as (typeof WEEKDAY_ORDER)[number]) - WEEKDAY_ORDER.indexOf(b as (typeof WEEKDAY_ORDER)[number])
    );
    try {
      await classScheduleService.add({
        classId: selectedClass.id,
        startDate: scheduleForm.startDate,
        endDate: scheduleForm.endDate,
        daysOfWeek: orderedDays,
        createdAt: new Date().toISOString(),
      });
      appToasts.created('Schedule');
      closeAddScheduleModal();
    } catch {
      appToasts.saveFailed('schedule');
    }
  };

  const openModal = (cls?: Class) => {
    if (cls) {
      setEditingClass(cls);
      setSelectedGrade(cls.gradeId || '');
      setFormData({
        subjectId: cls.subjectId,
        teacherId: cls.teacherId,
        sessionId: cls.sessionId,
        studentIds: cls.studentIds
      });
      setAvailableTeachers(getAvailableTeachers(cls.subjectId));
      setAvailableSessions(getAvailableSessions(cls.teacherId));
      setEligibleStudents(getEligibleStudents(cls.subjectId, cls.sessionId, cls.gradeId || ''));
    } else {
      setEditingClass(null);
      setSelectedGrade('');
      setFormData({ subjectId: '', teacherId: '', sessionId: '', studentIds: [] });
      setAvailableTeachers([]);
      setAvailableSessions([]);
      setEligibleStudents([]);
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClass(null);
    setSelectedGrade('');
    setFormData({ subjectId: '', teacherId: '', sessionId: '', studentIds: [] });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!selectedGrade) errors.grade = 'Grade is required';
    if (!formData.subjectId) errors.subjectId = 'Subject is required';
    if (!formData.teacherId) errors.teacherId = 'Teacher is required';
    if (!formData.sessionId) errors.sessionId = 'Session is required';
    if (formData.studentIds.length === 0) errors.studentIds = 'At least one student is required';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      appToasts.fixForm();
      return;
    }

    const classData: Omit<Class, 'id'> = {
      ...formData,
      gradeId: selectedGrade,
      createdAt: editingClass?.createdAt || new Date().toISOString()
    };

    try {
      if (editingClass) {
        await classService.update(editingClass.id, classData);
        appToasts.updated('Class');
      } else {
        await classService.add(classData);
        appToasts.created('Class');
      }
      closeModal();
    } catch (error) {
      console.error('Submit error:', error);
      appToasts.saveFailed('class');
    }
  };

  const openDeleteConfirm = (id: string) => {
    setClassIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteClass = async () => {
    if (!classIdToDelete) return;
    try {
      const allSchedules = await classScheduleService.getAll();
      await Promise.all(
        allSchedules.filter((s) => s.classId === classIdToDelete).map((s) => classScheduleService.delete(s.id))
      );
      await classService.delete(classIdToDelete);
      appToasts.deleted('Class');
    } catch {
      appToasts.deleteFailed('class');
      throw new Error('delete failed');
    }
  };

  const updateFormField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field as string]) {
      setFormErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  const toggleStudent = (studentId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      studentIds: checked 
        ? [...prev.studentIds, studentId]
        : prev.studentIds.filter(id => id !== studentId)
    }));
  };

  const getStudentCount = (studentIds: string[]) => studentIds.length;

  const getClassName = (cls: Class) => {
    const subjectName = subjectMap.get(cls.subjectId) || 'Unknown Subject';
    const sessionName = sessionMap.get(cls.sessionId) || 'Unknown Session';
    return `${subjectName} - ${sessionName}`;
  };

  const formatSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return 'Unknown Session';
    return `${session.startTime} - ${session.endTime}`;
  };

  const getStudentsInClass = (cls: Class): Student[] => {
    return cls.studentIds
      .map(id => students.find(s => s.id === id))
      .filter((s): s is Student => s !== undefined);
  };

  const todayYmd = formatLocalYmd(new Date());
  const activeClassIdsToday = useMemo(
    () => activeClassIdsForDate(schedules, todayYmd),
    [schedules, todayYmd]
  );

  const attendanceForClassToday = useCallback(
    (classId: string, studentId: string) =>
      attendanceRecords.find(
        (a) => a.classId === classId && a.studentId === studentId && a.date === todayYmd
      ),
    [attendanceRecords, todayYmd]
  );

  const saveAttendanceForStudent = async (cls: Class, student: Student, status: 'present' | 'absent') => {
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-title">
          <h1 className="text-2xl font-bold text-[#1f2937]">Classes</h1>
          <p className="text-[#6b7280] text-[14px]">Manage class assignments with intelligent subject-teacher-session-student matching.</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 border-b border-[#e5e7eb] bg-[#fafafa] flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="page-title flex-1">
            <h2 className="text-xl font-bold text-[#1f2937]">Class Directory ({classes.length})</h2>
          </div>
          
          {/* Search */}
          <div className="relative flex-1 sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
            <input 
              type="text"
              placeholder="Search by grade, subject, teacher or session..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* View Toggle + Add */}
          <div className="flex items-center gap-2">
            <div className="flex bg-white border border-[#e5e7eb] rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md text-xs font-medium flex items-center gap-1 ${
                  viewMode === 'table'
                    ? 'bg-[#3b82f6] text-white shadow-sm'
                    : 'text-[#9ca3af] hover:text-[#1f2937]'
                }`}
              >
                <Table2 size={14} /> Table
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-md text-xs font-medium flex items-center gap-1 ${
                  viewMode === 'card'
                    ? 'bg-[#3b82f6] text-white shadow-sm'
                    : 'text-[#9ca3af] hover:text-[#1f2937]'
                }`}
              >
                <Grid size={14} /> Cards
              </button>
            </div>
            <button 
              onClick={() => openModal()}
              className="flex items-center justify-center gap-2 bg-[#3b82f6] text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:opacity-90 transition-all shadow-sm"
            >
              <Plus size={16} />
              Add Class
            </button>
          </div>
        </div>

        {/* Data Display */}
        <div className="p-6">
          {viewMode === 'table' ? (
            <ClassTable 
              classes={currentClasses}
              searchTerm={searchTerm}
              gradeMap={gradeMap}
              subjectMap={subjectMap}
              teacherMap={teacherMap}
              sessionMap={sessionMap}
              getStudentCount={getStudentCount}
              onView={openViewModal}
              onEdit={openModal}
              onDelete={openDeleteConfirm}
            />
          ) : (
            <ClassCard
              classes={currentClasses}
              searchTerm={searchTerm}
              gradeMap={gradeMap}
              subjectMap={subjectMap}
              teacherMap={teacherMap}
              sessionMap={sessionMap}
              getStudentCount={getStudentCount}
              onView={openViewModal}
              onEdit={openModal}
              onDelete={openDeleteConfirm}
              onCreateClass={() => openModal()}
            />
          )}
        </div>
      </div>

      <ClassFormModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        editingClass={editingClass}
        grades={grades}
        subjects={subjects}
        availableTeachers={availableTeachers}
        availableSessions={availableSessions}
        eligibleStudents={eligibleStudents}
        selectedGrade={selectedGrade}
        setSelectedGrade={setSelectedGrade}
        formData={formData}
        formErrors={formErrors}
        updateFormField={updateFormField}
        toggleStudent={toggleStudent}
        onSubmit={handleSubmit}
      />

      <ClassViewModal 
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        selectedClass={selectedClass}
        gradeMap={gradeMap}
        subjectMap={subjectMap}
        teacherMap={teacherMap}
        getClassName={getClassName}
        formatSession={formatSession}
        getStudentsInClass={getStudentsInClass}
        getStudentCount={getStudentCount}
        activeClassIdsToday={activeClassIdsToday}
        attendanceForClassToday={attendanceForClassToday}
        saveAttendanceForStudent={saveAttendanceForStudent}
        upcomingSchedules={upcomingSchedules}
        completedSchedules={completedSchedules}
        formatDisplayDate={formatDisplayDate}
        formatDaysList={formatDaysList}
        openAddScheduleModal={openAddScheduleModal}
        addScheduleOpen={addScheduleOpen}
        closeAddScheduleModal={closeAddScheduleModal}
        scheduleForm={scheduleForm}
        setScheduleForm={setScheduleForm}
        scheduleFormErrors={scheduleFormErrors}
        setScheduleFormErrors={setScheduleFormErrors}
        toggleScheduleDay={toggleScheduleDay}
        handleAddScheduleSubmit={handleAddScheduleSubmit}
        WEEKDAY_ORDER={WEEKDAY_ORDER}
        WEEKDAY_LABELS={WEEKDAY_LABELS}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) setClassIdToDelete(null);
        }}
        title="Delete this class?"
        description="This will remove all associations for this class. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDeleteClass}
      />
    </div>
  );
};
