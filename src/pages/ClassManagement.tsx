import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, X, Table2, Grid, BookOpen, User, Clock, Users, AlertCircle, Eye, Calendar } from 'lucide-react';
import { 
  classService, studentService, teacherService, subjectService, sessionConfigService, gradeService, classScheduleService, attendanceService 
} from '../services/firestore';
import type { Class, Student, Teacher, Subject, Session, Grade, ClassSchedule, AttendanceRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { appToasts } from '../lib/appToasts';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { cn } from '../lib/utils';
import { formatLocalYmd, activeClassIdsForDate } from '../lib/attendanceScheduleUtils';

export const ClassManagement: React.FC = () => {
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
  const filteredClasses = useCallback(() => 
    classes.filter(cls => 
      gradeMap.get(cls.gradeId)?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      subjectMap.get(cls.subjectId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacherMap.get(cls.teacherId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sessionMap.get(cls.sessionId)?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [classes, searchTerm, gradeMap, subjectMap, teacherMap, sessionMap]
  );

  const currentClasses = filteredClasses();

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

  // ✅ Only reset if invalid
  if (
    formData.teacherId &&
    !teachersList.some(t => t.id === formData.teacherId)
  ) {
    setFormData(prev => ({
      ...prev,
      teacherId: '',
      sessionId: '' // also reset session if teacher invalid
    }));
  }
}, [formData.subjectId, teachers]);

useEffect(() => {
  if (!formData.teacherId) return;

  const sessionsList = getAvailableSessions(formData.teacherId);
  setAvailableSessions(sessionsList);

  // ✅ Only reset if invalid
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
      // Trigger filtering
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

  const updateFormField = (field: keyof typeof formData, value: any) => {
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

  // View modal helpers
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-[#fafafa] text-[#6b7280] text-[11px] uppercase tracking-wider font-bold border-b border-[#e5e7eb]">
                    <th className="px-6 py-3 w-[80px]">ID</th>
                    <th className="px-6 py-3 w-[120px]">Grade</th>
                    <th className="px-6 py-3 w-[180px]">Subject</th>
                    <th className="px-6 py-3 w-[160px]">Teacher</th>
                    <th className="px-6 py-3 w-[140px]">Session</th>
                    <th className="px-6 py-3 w-[100px]">Students</th>
                    <th className="px-6 py-3 w-[120px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {currentClasses.map((cls, idx) => (
                    <tr key={cls.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-mono text-[11px] text-[#6b7280]">C{1000 + idx}</td>
                      <td className="px-6 py-3">
                        <span className="font-bold text-[13px] text-[#1f2937]">
                          {gradeMap.get(cls.gradeId) ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-bold text-[13px] text-[#1f2937]">
                          {subjectMap.get(cls.subjectId)}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="status-pill bg-[#f3f4f6] text-[#1f2937]">
                          {teacherMap.get(cls.teacherId)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-[12px] text-[#6b7280]">
                        {sessionMap.get(cls.sessionId)}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1 text-[13px] text-[#1f2937]">
                          <Users size={14} />
                          <span className="font-bold">{getStudentCount(cls.studentIds)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => openViewModal(cls)}
                            className="p-1.5 text-[#9ca3af] hover:text-[#3b82f6] hover:bg-[#3b82f6]/5 rounded-lg transition-colors"
                            title="View Class Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            onClick={() => openModal(cls)}
                            className="p-1.5 text-[#9ca3af] hover:text-[#3b82f6] hover:bg-[#3b82f6]/5 rounded-lg transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => openDeleteConfirm(cls.id)}
                            className="p-1.5 text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#ef4444]/5 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentClasses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-[#6b7280]">
                        {searchTerm ? 'No classes match your search.' : 'No classes configured yet. Create your first class!'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentClasses.map((cls) => (
                <motion.div 
                  key={cls.id}
                  className="bg-white border border-[#e5e7eb] rounded-xl p-6 shadow-sm hover:shadow-md transition-all group"
                  whileHover={{ y: -2 }}
                >
                  <div className="space-y-3">
                    <div className="text-xs font-semibold bg-blue-100 px-2 py-1 rounded inline-block">
                      {gradeMap.get(cls.gradeId) ?? '—'}
                    </div>
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-lg text-[#1f2937] truncate flex-1">
                        {subjectMap.get(cls.subjectId)}
                      </h3>
                      <div className="flex gap-1 ml-2">
                        <button 
                          onClick={() => openViewModal(cls)}
                          className="p-1.5 text-[#9ca3af] hover:text-[#3b82f6] hover:bg-[#3b82f6]/5 rounded-lg transition-colors"
                          title="View Class Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => openModal(cls)}
                          className="p-1.5 text-[#9ca3af] hover:text-[#3b82f6] hover:bg-[#3b82f6]/5 rounded-lg"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => openDeleteConfirm(cls.id)}
                          className="p-1.5 text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#ef4444]/5 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="status-pill bg-[#f3f4f6] text-[#1f2937] inline-block px-3 py-1 rounded-full">
                      {teacherMap.get(cls.teacherId)}
                    </div>
                    <div className="text-[13px] text-[#6b7280] space-y-1">
                      <div>Session: {sessionMap.get(cls.sessionId)}</div>
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span className="font-bold">{getStudentCount(cls.studentIds)} students</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {currentClasses.length === 0 && (
                <div className="col-span-full p-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-[#e5e7eb]">
                  <BookOpen className="mx-auto h-12 w-12 text-[#9ca3af] mb-4" />
                  <h3 className="text-lg font-bold text-[#1f2937] mb-1">
                    {searchTerm ? 'No classes found' : 'No classes configured'}
                  </h3>
                  <p className="text-[#6b7280] mb-4">Get started by creating your first class with intelligent matching.</p>
                  <button
                    onClick={() => openModal()}
                    className="bg-[#3b82f6] text-white px-6 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-sm flex items-center gap-2 mx-auto"
                  >
                    <Plus size={16} />
                    Create Class
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden border border-[#e5e7eb] max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-[#e5e7eb] flex items-center justify-between bg-[#fafafa] sticky top-0">
                <h3 className="text-[18px] font-bold text-[#1f2937]">
                  {editingClass ? 'Edit Class Assignment' : 'Create New Class'}
                </h3>
                <button onClick={closeModal} className="text-[#9ca3af] hover:text-[#1f2937]">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Grade */}
                <div className="border border-[#e5e7eb] rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen size={20} className="text-[#3b82f6]" />
                    <h4 className="text-lg font-bold text-[#1f2937]">Grade *</h4>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {grades.map((g) => (
                      <label key={g.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="classGrade"
                          checked={selectedGrade === g.id}
                          onChange={() => {
                            setSelectedGrade(g.id);
                            if (formErrors.grade) setFormErrors(prev => ({ ...prev, grade: '' }));
                          }}
                          className="w-4 h-4 text-[#3b82f6] border-gray-300 focus:ring-[#3b82f6]"
                        />
                        <span className="text-sm text-[#1f2937]">{g.name}</span>
                      </label>
                    ))}
                  </div>
                  {formErrors.grade && <p className="text-red-500 text-[11px] mt-2">{formErrors.grade}</p>}
                </div>

                {/* Section 1: Subject + Teacher */}
                <div className="border border-[#e5e7eb] rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen size={20} className="text-[#3b82f6]" />
                    <h4 className="text-lg font-bold text-[#1f2937]">Subject & Teacher</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Subject *</label>
                      <select 
                        className={`w-full px-3 py-2 border rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all ${
                          formErrors.subjectId ? 'border-red-500 focus:ring-red-500' : 'border-[#e5e7eb]'
                        }`}
                        value={formData.subjectId}
                        onChange={e => updateFormField('subjectId', e.target.value)}
                      >
                        <option value="">Select Subject</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {formErrors.subjectId && <p className="text-red-500 text-[11px] mt-1">{formErrors.subjectId}</p>}
                      <p className="text-[11px] text-[#6b7280] mt-1">
                        {availableTeachers.length} teachers available
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Teacher *</label>
                      <select 
                        className={`w-full px-3 py-2 border rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all ${
                          formErrors.teacherId ? 'border-red-500 focus:ring-red-500' : 'border-[#e5e7eb]'
                        }`}
                        value={formData.teacherId}
                        onChange={e => updateFormField('teacherId', e.target.value)}
                      >
                        <option value="">{availableTeachers.length ? 'Select Teacher' : 'Select Subject first'}</option>
                        {availableTeachers.map(t => (
                          <option key={t.id} value={t.id}>{(t.pronoun ?? 'Mr')}. {t.name}</option>
                        ))}
                      </select>
                      {formErrors.teacherId && <p className="text-red-500 text-[11px] mt-1">{formErrors.teacherId}</p>}
                      <p className="text-[11px] text-[#6b7280] mt-1">
                        {availableSessions.length} sessions available
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Session */}
                <div className="border border-[#e5e7eb] rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={20} className="text-[#3b82f6]" />
                    <h4 className="text-lg font-bold text-[#1f2937]">Session (Teacher Availability)</h4>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Available Sessions *</label>
                    <select 
                      className={`w-full px-3 py-2 border rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all ${
                        formErrors.sessionId ? 'border-red-500 focus:ring-red-500' : 'border-[#e5e7eb]'
                      }`}
                      value={formData.sessionId}
                      onChange={e => updateFormField('sessionId', e.target.value)}
                    >
                      <option value="">{availableSessions.length ? 'Select Session' : 'Select Teacher first'}</option>
                      {availableSessions.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.startTime} - {s.endTime})
                        </option>
                      ))}
                    </select>
                    {formErrors.sessionId && <p className="text-red-500 text-[11px] mt-1">{formErrors.sessionId}</p>}
                    <p className="text-[11px] text-[#6b7280] mt-1">
                      {eligibleStudents.length} eligible students
                    </p>
                  </div>
                </div>

                {/* Section 3: Students */}
                <div className="border border-[#e5e7eb] rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={20} className="text-[#3b82f6]" />
                    <h4 className="text-lg font-bold text-[#1f2937]">Eligible Students *</h4>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-[#e5e7eb] rounded-lg p-3 bg-white">
                    {eligibleStudents.slice(0, 20).map((student) => ( // Limit for performance
                      <label key={student.id} className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.studentIds.includes(student.id)}
                          onChange={(e) => toggleStudent(student.id, e.target.checked)}
                          className="w-4 h-4 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6]"
                        />
                        <span className="text-sm text-[#1f2937] truncate flex-1">{student.name}</span>
                        <span className="text-xs text-[#6b7280]">{student.rollNumber || 'N/A'}</span>
                      </label>
                    ))}
                    {eligibleStudents.length > 20 && (
                      <p className="text-xs text-[#6b7280] p-2">
                        Showing first 20 of {eligibleStudents.length} students
                      </p>
                    )}
                  </div>
                  {formErrors.studentIds && (
                    <p className="text-red-500 text-[11px] mt-2">{formErrors.studentIds}</p>
                  )}
                  <div className="pt-2 text-sm text-[#6b7280]">
                    ({formData.studentIds.length} selected)
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-[#e5e7eb] text-[#6b7280] rounded-lg text-[13px] font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={Object.keys(formErrors).length > 0}
                    className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-lg text-[13px] font-bold hover:opacity-90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingClass ? 'Update Class' : 'Create Class'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* View Class Details Modal */}
        <AnimatePresence>
          {viewModalOpen && selectedClass && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeViewModal}
                className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-[#e5e7eb] max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-[#e5e7eb] flex items-center justify-between bg-[#fafafa] sticky top-0">
                  <h3 className="text-[18px] font-bold text-[#1f2937]">
                    Class Details
                  </h3>
                  <button 
                    onClick={closeViewModal} 
                    className="text-[#9ca3af] hover:text-[#1f2937] p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Class Info Section */}
                  <div className="border border-[#e5e7eb] rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[#3b82f6]/10 rounded-lg">
                        <BookOpen size={20} className="text-[#3b82f6]" />
                      </div>
                      <h4 className="text-lg font-bold text-[#1f2937]">Class Information</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div>
                        <span className="text-[#6b7280] block mb-1 font-medium">Class Name</span>
                        <span className="font-bold text-[#1f2937]">{getClassName(selectedClass)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1 font-medium">Grade</span>
                        <span className="font-bold text-[#1f2937]">
                          {gradeMap.get(selectedClass.gradeId) ?? '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6b7280] block mb-1 font-medium">Subject</span>
                        <span className="font-bold text-[#1f2937] bg-[#dbeafe]/50 px-2 py-1 rounded text-sm">
                          {subjectMap.get(selectedClass.subjectId) || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6b7280] block mb-1 font-medium">Teacher</span>
                        <span className="font-bold text-[#1f2937]">{teacherMap.get(selectedClass.teacherId) || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-[#6b7280] block mb-1 font-medium">Session Time</span>
                        <span className="font-bold text-[#1f2937]">{formatSession(selectedClass.sessionId)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Students Section */}
                  <div className="border border-[#e5e7eb] rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-[#10b981]/10 rounded-lg">
                        <Users size={20} className="text-[#10b981]" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-[#1f2937]">Students in this Class ({getStudentCount(selectedClass.studentIds)})</h4>
                        <p className="text-[#6b7280] text-sm">All students assigned to this class session</p>
                        {activeClassIdsToday.has(selectedClass.id) ? (
                          <p className="mt-1 text-[11px] font-medium text-emerald-700">Scheduled today — you can mark attendance below.</p>
                        ) : (
                          <p className="mt-1 text-[11px] text-[#94a3b8]">Attendance toggles appear when this class is on today&apos;s schedule.</p>
                        )}
                      </div>
                    </div>
                    
                    {getStudentsInClass(selectedClass).length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-[#e5e7eb]">
                        <Users className="mx-auto h-12 w-12 text-[#9ca3af] mb-4" />
                        <h5 className="text-lg font-bold text-[#1f2937] mb-1">No students assigned</h5>
                        <p className="text-[#6b7280]">No students have been assigned to this class yet.</p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {getStudentsInClass(selectedClass).map((student) => {
                          const rec = attendanceForClassToday(selectedClass.id, student.id);
                          const canMark = activeClassIdsToday.has(selectedClass.id);
                          return (
                            <div
                              key={student.id}
                              className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-[#f3f4f6] bg-gray-50/50 hover:bg-gray-50"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-sm font-bold text-white">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-bold text-[#1f2937]">{student.name}</p>
                                  {('preferredPhone' in student && student.preferredPhone) && (
                                    <p className="truncate text-sm text-[#6b7280]">{student.preferredPhone as string}</p>
                                  )}
                                </div>
                              </div>
                              {canMark ? (
                                <div className="flex shrink-0 gap-1 rounded-lg bg-[#f1f5f9] p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => saveAttendanceForStudent(selectedClass, student, 'present')}
                                    className={cn(
                                      'rounded-md px-3 py-1.5 text-[11px] font-bold transition-colors',
                                      rec?.status === 'present'
                                        ? 'bg-emerald-500 text-white shadow-sm'
                                        : 'text-[#64748b] hover:bg-white'
                                    )}
                                  >
                                    Present
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => saveAttendanceForStudent(selectedClass, student, 'absent')}
                                    className={cn(
                                      'rounded-md px-3 py-1.5 text-[11px] font-bold transition-colors',
                                      rec?.status === 'absent'
                                        ? 'bg-red-500 text-white shadow-sm'
                                        : 'text-[#64748b] hover:bg-white'
                                    )}
                                  >
                                    Absent
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Class schedules */}
                  <div className="rounded-xl border border-[#e5e7eb] p-6">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-[#6366f1]/10 p-2">
                          <Calendar size={20} className="text-[#6366f1]" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-[#1f2937]">Schedules</h4>
                          <p className="text-sm text-[#6b7280]">Date ranges and days of the week</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={openAddScheduleModal}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-[13px] font-bold text-[#1f2937] shadow-sm transition-colors hover:bg-gray-50"
                      >
                        <Plus size={16} />
                        Add Schedule
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h5 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">
                          Upcoming schedules
                        </h5>
                        {upcomingSchedules.length === 0 ? (
                          <p className="rounded-lg border border-dashed border-[#e5e7eb] bg-gray-50 py-6 text-center text-sm text-[#6b7280]">
                            No upcoming schedules
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {upcomingSchedules.map((sch) => (
                              <div
                                key={sch.id}
                                className="rounded-lg border border-[#e5e7eb] bg-white p-4 text-sm shadow-sm"
                              >
                                <div className="font-semibold text-[#1f2937]">
                                  {formatDisplayDate(sch.startDate)} → {formatDisplayDate(sch.endDate)}
                                </div>
                                <div className="mt-2 text-[#6b7280]">
                                  <span className="font-medium text-[#9ca3af]">Days: </span>
                                  {formatDaysList(sch.daysOfWeek)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <h5 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">
                          Completed schedules
                        </h5>
                        {completedSchedules.length === 0 ? (
                          <p className="rounded-lg border border-dashed border-[#e5e7eb] bg-gray-50 py-6 text-center text-sm text-[#6b7280]">
                            No completed schedules
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {completedSchedules.map((sch) => (
                              <div
                                key={sch.id}
                                className="rounded-lg border border-[#f3f4f6] bg-gray-50/80 p-4 text-sm"
                              >
                                <div className="font-semibold text-[#374151]">
                                  {formatDisplayDate(sch.startDate)} → {formatDisplayDate(sch.endDate)}
                                </div>
                                <div className="mt-2 text-[#6b7280]">
                                  <span className="font-medium text-[#9ca3af]">Days: </span>
                                  {formatDaysList(sch.daysOfWeek)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </AnimatePresence>

      <AnimatePresence>
        {addScheduleOpen && selectedClass && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAddScheduleModal}
              className="absolute inset-0 bg-[#111827]/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-md overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#fafafa] p-6">
                <h3 className="text-[18px] font-bold text-[#1f2937]">Add schedule</h3>
                <button
                  type="button"
                  onClick={closeAddScheduleModal}
                  className="rounded-lg p-1.5 text-[#9ca3af] transition-colors hover:bg-gray-200 hover:text-[#1f2937]"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddScheduleSubmit} className="space-y-5 p-6">
                <p className="text-sm text-[#6b7280]">
                  For <span className="font-semibold text-[#1f2937]">{getClassName(selectedClass)}</span>
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[12px] font-bold uppercase tracking-tight text-[#6b7280]">
                      Start date *
                    </label>
                    <input
                      type="date"
                      className={`w-full rounded-lg border px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 ${
                        scheduleFormErrors.startDate ? 'border-red-500' : 'border-[#e5e7eb]'
                      }`}
                      value={scheduleForm.startDate}
                      onChange={(e) => {
                        setScheduleForm((p) => ({ ...p, startDate: e.target.value }));
                        setScheduleFormErrors((er) => ({ ...er, startDate: '', range: '' }));
                      }}
                    />
                    {scheduleFormErrors.startDate && (
                      <p className="text-[11px] text-red-500">{scheduleFormErrors.startDate}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-bold uppercase tracking-tight text-[#6b7280]">
                      End date *
                    </label>
                    <input
                      type="date"
                      className={`w-full rounded-lg border px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 ${
                        scheduleFormErrors.endDate ? 'border-red-500' : 'border-[#e5e7eb]'
                      }`}
                      value={scheduleForm.endDate}
                      onChange={(e) => {
                        setScheduleForm((p) => ({ ...p, endDate: e.target.value }));
                        setScheduleFormErrors((er) => ({ ...er, endDate: '', range: '' }));
                      }}
                    />
                    {scheduleFormErrors.endDate && (
                      <p className="text-[11px] text-red-500">{scheduleFormErrors.endDate}</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[#e5e7eb] p-4">
                  <span className="mb-3 block text-[12px] font-bold uppercase tracking-tight text-[#6b7280]">
                    Days of week *
                  </span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {WEEKDAY_ORDER.map((key) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={scheduleForm.days.includes(key)}
                          onChange={() => toggleScheduleDay(key)}
                          className="h-4 w-4 rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6]"
                        />
                        <span className="text-sm text-[#1f2937]">{WEEKDAY_LABELS[key]}</span>
                      </label>
                    ))}
                  </div>
                  {scheduleFormErrors.days && (
                    <p className="mt-2 text-[11px] text-red-500">{scheduleFormErrors.days}</p>
                  )}
                </div>

                {scheduleFormErrors.range && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {scheduleFormErrors.range}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeAddScheduleModal}
                    className="flex-1 rounded-lg border border-[#e5e7eb] px-4 py-2 text-[13px] font-bold text-[#6b7280] transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-[#3b82f6] px-4 py-2 text-[13px] font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                  >
                    Save schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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


