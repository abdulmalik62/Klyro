import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Users2,
  User,
  Book,
  CheckCircle2,
  AlertTriangle,
  PieChart,
  BarChart3
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { studentService, classService, attendanceService, teacherService, classScheduleService, gradeService, subjectService } from '../services/firestore';
import type { Student, Class, AttendanceRecord, Teacher, ClassSchedule, Grade, Subject } from '../types';
import { formatLocalYmd, isScheduleActiveOnDate, activeClassIdsForDate } from '../lib/attendanceScheduleUtils';

const StatCard = ({ label, value, icon, colorClass, onClick }: { label: string; value: string; icon?: React.ReactNode; colorClass?: string; onClick?: () => void }) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className={cn(
      "bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-sm group cursor-pointer hover:bg-[#f8fafc] transition-all duration-200 flex items-center justify-between gap-4",
      onClick && "hover:shadow-md"
    )}
    onClick={onClick}
  >
    <div>
      <p className="text-[12px] text-[#6b7280] font-bold uppercase tracking-wider mb-1">{label}</p>
      <h3 className={cn("text-3xl font-bold font-mono", colorClass || "text-[#1f2937]")}>{value}</h3>
    </div>
    {icon && <div className="opacity-75 group-hover:opacity-100 transition-all">{icon}</div>}
    {onClick && <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all ml-auto" />}
  </motion.div>
);

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    const unsubStudents = studentService.subscribe(setStudents);
    const unsubTeachers = teacherService.subscribe(setTeachers);
    const unsubClasses = classService.subscribe(setClasses);
    const unsubSchedules = classScheduleService.subscribe(setSchedules);
    const unsubGrades = gradeService.subscribe(setGrades);
    const unsubSubjects = subjectService.subscribe(setSubjects);
    const unsubAttendance = attendanceService.subscribe(setAllAttendance);
    return () => {
      unsubStudents();
      unsubTeachers();
      unsubClasses();
      unsubSchedules();
      unsubGrades();
      unsubSubjects();
      unsubAttendance();
    };
  }, []);

  const todayYmd = formatLocalYmd(new Date());

  const todayAtts = useMemo(
    () => allAttendance.filter((a) => a.date === todayYmd),
    [allAttendance, todayYmd]
  );

  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalClasses = classes.length;

  const presentTodayCount = useMemo(
    () => todayAtts.filter((a) => a.status === 'present').length,
    [todayAtts]
  );
  const absentTodayCount = useMemo(
    () => todayAtts.filter((a) => a.status === 'absent').length,
    [todayAtts]
  );

  const attendancePercentage = todayAtts.length > 0 
    ? Math.round((presentTodayCount / todayAtts.length) * 100)
    : 0;

  const todayActiveClassIds = activeClassIdsForDate(schedules, todayYmd);

  const todayClasses = useMemo(() => 
    classes.filter(cls => todayActiveClassIds.has(cls.id)),
    [classes, todayActiveClassIds]
  );

  const studentsPerGrade = useMemo(() => {
    const count = new Map<string, number>();
    students.forEach(s => {
      const g = grades.find(g => g.id === s.gradeId);
      if (g) count.set(g.name, (count.get(g.name) || 0) + 1);
    });
    return Array.from(count.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [students, grades]);

  const alerts = useMemo(() => {
    return todayClasses.filter(cls => {
      const classAtts = todayAtts.filter(a => a.classId === cls.id);
      const classTotal = cls.studentIds.length;
      const classPresent = classAtts.filter(a => a.status === 'present').length;
      const classAttPct = classTotal > 0 ? (classPresent / classTotal) * 100 : 0;
      return classAttPct < 50 || classTotal === 0;
    });
  }, [todayClasses, todayAtts]);

  if (profile?.role === 'parent') {
    return (
      <div className="space-y-6">
        <div className="page-title">
          <h1 className="text-2xl font-bold text-[#1f2937]">Parent Dashboard</h1>
          <p className="text-[#6b7280] text-[14px]">Track your child's attendance and progress.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard label="Attendance Rate" value="94%" colorClass="text-[#10b981]" />
          <StatCard label="Total Absences" value="03" colorClass="text-[#ef4444]" />
          <StatCard label="Performance" value="Good" colorClass="text-[#3b82f6]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-title">
        <h1 className="text-2xl font-bold text-[#1f2937]">Welcome, {profile?.displayName}</h1>
        <p className="text-[#6b7280] text-[14px]">Here's what's happening in your school today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total Students" value={totalStudents.toString().padStart(2, '0')} icon={<Users className="h-8 w-8 text-[#3b82f6]" />} onClick={() => navigate('/students')} />
        <StatCard label="Total Teachers" value={totalTeachers.toString().padStart(2, '0')} icon={<User className="h-8 w-8 text-[#10b981]" />} onClick={() => navigate('/teachers')} />
        <StatCard label="Total Classes" value={totalClasses.toString().padStart(2, '0')} icon={<Book className="h-8 w-8 text-[#f59e0b]" />} onClick={() => navigate('/classes')} />
        <StatCard label="Attendance %" value={`${attendancePercentage}%`} colorClass="text-[#10b981]" icon={<CheckCircle2 className="h-8 w-8 text-[#10b981]" />} onClick={() => navigate('/attendance')} />
      </div>

      {/* Today's Classes Table */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-[#3b82f6]" />
            <h3 className="text-xl font-bold text-[#1f2937]">Today's Classes ({todayClasses.length})</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8fafc] sticky top-0">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#1f2937] uppercase tracking-wider">Class</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-[#1f2937] uppercase tracking-wider">Teacher</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-[#1f2937] uppercase tracking-wider">Session</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-[#1f2937] uppercase tracking-wider">Students</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-[#1f2937] uppercase tracking-wider">Present</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-[#1f2937] uppercase tracking-wider">Absent</th>
              </tr>
            </thead>
            <tbody>
              {todayClasses.map(cls => {
                const classAtts = todayAtts.filter(a => a.classId === cls.id);
                const classTotal = cls.studentIds.length;
                const classPresent = classAtts.filter(a => a.status === 'present').length;
                const classAbsent = classTotal - classPresent;
                const classAttPct = classTotal > 0 ? Math.round((classPresent / classTotal) * 100) : 0;
                const grade = grades.find(g => g.id === cls.gradeId);
                const subj = subjects.find(s => s.id === cls.subjectId);
                const teacher = teachers.find(t => t.id === cls.teacherId);
                return (
                  <tr key={cls.id} className="border-t border-[#f3f4f6] hover:bg-[#f8fafc]">
                    <td className="px-6 py-4 font-medium text-[#1f2937]">
                      {grade?.name} {subj?.name}
                    </td>
                    <td className="px-4 py-4 text-[#6b7280]">
                      {teacher?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-[#6b7280]">
                      9:00 AM - 10:30 AM
                    </td>
                    <td className="px-4 py-4">
                      <span className="status-pill bg-[#f3f4f6] text-[#1f2937]">{classTotal}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="status-pill bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">{classPresent}</span>
                    </td>
                    <td className="px-4 py-4 font-bold text-[#ef4444]">
                      {classAbsent}
                      <span className="text-xs font-normal text-[#6b7280] ml-1">({classAttPct}%)</span>
                    </td>
                  </tr>
                );
              })}
              {todayClasses.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#6b7280]">
                    <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No classes scheduled for today</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Column: Attendance Summary + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Summary */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="h-6 w-6 text-[#3b82f6]" />
            <h3 className="text-xl font-bold text-[#1f2937]">Today's Attendance Summary</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-[#10b981]">{presentTodayCount}</span>
              <span className="text-[#6b7280]">Present</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-[#ef4444]">{absentTodayCount}</span>
              <span className="text-[#6b7280]">Absent</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-[#1f2937]">{attendancePercentage}%</span>
              <span className="text-xs text-[#6b7280]">Overall</span>
            </div>
          </div>
          {/* Simple Pie Chart */}
          <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto mt-8 block">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray={`${(attendancePercentage / 100) * 265}, 265`} strokeLinecap="round" transform="rotate(-90 50 50)" />
          </svg>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-6 w-6 text-[#ef4444]" />
            <h3 className="text-xl font-bold text-[#1f2937]">Alerts ({alerts.length})</h3>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {alerts.map(cls => {
              const classAtts = todayAtts.filter(a => a.classId === cls.id);
              const classTotal = cls.studentIds.length;
              const classPresent = classAtts.filter(a => a.status === 'present').length;
              const classAttPct = classTotal > 0 ? Math.round((classPresent / classTotal) * 100) : 0;
              const grade = grades.find(g => g.id === cls.gradeId);
              const subj = subjects.find(s => s.id === cls.subjectId);
              const teacher = teachers.find(t => t.id === cls.teacherId);
              const alertType = classTotal === 0 ? 'No Students' : 'Low Attendance';
              return (
                <div key={cls.id} className="flex gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#dc2626]">{grade?.name} {subj?.name}</p>
                    <p className="text-sm text-[#991b1b]">{teacher?.name} - {alertType}</p>
                    <p className="text-xs text-[#6b7280]">{classAttPct}% attendance ({classPresent}/{classTotal})</p>
                  </div>
                </div>
              );
            })}
            {alerts.length === 0 && (
              <div className="text-center py-8 text-[#6b7280]">
                <AlertTriangle className="mx-auto h-12 w-12 opacity-50 mb-4" />
                <p>No alerts today</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Students per Grade */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-[#8b5cf6]" />
            <h3 className="text-xl font-bold text-[#1f2937]">Students per Grade</h3>
          </div>
        </div>
        <div className="divide-y divide-[#f3f4f6]">
          {studentsPerGrade.map(([gradeName, count]) => {
            const maxCount = studentsPerGrade[0]?.[1] || 1;
            const pct = (count / maxCount) * 100;
            return (
              <div key={gradeName} className="p-6 hover:bg-[#f8fafc]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[#1f2937]">{gradeName}</span>
                  <span className="font-bold text-[#1f2937]">{count}</span>
                </div>
                <div className="w-full bg-[#f3f4f6] rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {studentsPerGrade.length === 0 && (
            <div className="p-12 text-center text-[#6b7280]">
              <Users2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No student data yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

