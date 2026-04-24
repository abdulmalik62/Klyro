import React from 'react';
import { X, BookOpen, Users, Calendar, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import type { Class, Student, ClassSchedule, AttendanceRecord } from '../../types';

interface ClassViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: Class | null;
  gradeMap: Map<string, string>;
  subjectMap: Map<string, string>;
  teacherMap: Map<string, string>;
  getClassName: (cls: Class) => string;
  formatSession: (sessionId: string) => string;
  getStudentsInClass: (cls: Class) => Student[];
  getStudentCount: (studentIds: string[]) => number;
  activeClassIdsToday: Set<string>;
  attendanceForClassToday: (classId: string, studentId: string) => AttendanceRecord | undefined;
  saveAttendanceForStudent: (cls: Class, student: Student, status: 'present' | 'absent') => void;
  upcomingSchedules: ClassSchedule[];
  completedSchedules: ClassSchedule[];
  formatDisplayDate: (date: string) => string;
  formatDaysList: (days: string[]) => string;
  openAddScheduleModal: () => void;
  // Add schedule form props
  addScheduleOpen: boolean;
  closeAddScheduleModal: () => void;
  scheduleForm: { startDate: string; endDate: string; days: string[] };
  setScheduleForm: React.Dispatch<React.SetStateAction<{ startDate: string; endDate: string; days: string[] }>>;
  scheduleFormErrors: Record<string, string>;
  setScheduleFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  toggleScheduleDay: (key: string) => void;
  handleAddScheduleSubmit: (e: React.FormEvent) => void;
  WEEKDAY_ORDER: readonly ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  WEEKDAY_LABELS: Record<string, string>;
}

export const ClassViewModal: React.FC<ClassViewModalProps> = ({
  isOpen,
  onClose,
  selectedClass,
  gradeMap,
  subjectMap,
  teacherMap,
  getClassName,
  formatSession,
  getStudentsInClass,
  getStudentCount,
  activeClassIdsToday,
  attendanceForClassToday,
  saveAttendanceForStudent,
  upcomingSchedules,
  completedSchedules,
  formatDisplayDate,
  formatDaysList,
  openAddScheduleModal,
  addScheduleOpen,
  closeAddScheduleModal,
  scheduleForm,
  setScheduleForm,
  scheduleFormErrors,
  setScheduleFormErrors,
  toggleScheduleDay,
  handleAddScheduleSubmit,
  WEEKDAY_ORDER,
  WEEKDAY_LABELS
}) => {
  return (
    <>
      <AnimatePresence>
        {isOpen && selectedClass && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
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
                  onClick={onClose} 
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
    </>
  );
};
