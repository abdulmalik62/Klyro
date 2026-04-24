import React from 'react';
import { X, BookOpen, Clock, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Class, Grade, Subject, Teacher, Session, Student } from '../../types';

interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClass: Class | null;
  grades: Grade[];
  subjects: Subject[];
  availableTeachers: Teacher[];
  availableSessions: Session[];
  eligibleStudents: Student[];
  selectedGrade: string;
  setSelectedGrade: (id: string) => void;
  formData: {
    subjectId: string;
    teacherId: string;
    sessionId: string;
    studentIds: string[];
  };
  formErrors: Record<string, string>;
  updateFormField: (field: string, value: any) => void;
  toggleStudent: (studentId: string, checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ClassFormModal: React.FC<ClassFormModalProps> = ({
  isOpen,
  onClose,
  editingClass,
  grades,
  subjects,
  availableTeachers,
  availableSessions,
  eligibleStudents,
  selectedGrade,
  setSelectedGrade,
  formData,
  formErrors,
  updateFormField,
  toggleStudent,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden border border-[#e5e7eb] max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-[#e5e7eb] flex items-center justify-between bg-[#fafafa] sticky top-0 z-10">
            <h3 className="text-[18px] font-bold text-[#1f2937]">
              {editingClass ? 'Edit Class Assignment' : 'Create New Class'}
            </h3>
            <button onClick={onClose} className="text-[#9ca3af] hover:text-[#1f2937]">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-6">
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
                      onChange={() => setSelectedGrade(g.id)}
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
                {eligibleStudents.slice(0, 20).map((student) => (
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
                onClick={onClose}
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
    </AnimatePresence>
  );
};
