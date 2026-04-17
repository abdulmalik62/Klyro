import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, X, Table2, Grid, Users, Phone, BadgeCheck, Mail, Home, School, BookOpen, Calendar, Users2, ChevronRight } from 'lucide-react';
import { 
  studentService, gradeService, subjectService, sessionConfigService 
} from '../services/firestore';
import type { Student, Grade, Subject, Session as ConfigSession } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<ConfigSession[]>([]);
  
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [declarationChecked, setDeclarationChecked] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    fatherName: '',
    motherName: '',
    guardianName: '',
    fatherPhone: '',
    motherPhone: '',
    guardianPhone: '',
    parentEmail: '',
    preferredContact: 'father' as 'father' | 'mother' | 'guardian',
    age: 0,
    sex: 'male' as 'male' | 'female' | 'other',
    address: '',
    gradeId: '',
    school: '',
    hscGroup: '',
    ourGradeId: '',
    subjectIds: [] as string[],
    sessionIds: [] as string[]
  });

  // Lookup maps
  const gradeMap = useMemo(() => new Map(grades.map(g => [g.id, g.name])), [grades]);
  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
  const sessionMap = useMemo(() => new Map(sessions.map(s => [s.id, s.name])), [sessions]);

  // Subscriptions
  useEffect(() => {
    const unsubStudents = studentService.subscribe(setStudents);
    const unsubGrades = gradeService.subscribe(setGrades);
    const unsubSubjects = subjectService.subscribe(setSubjects);
    const unsubSessions = sessionConfigService.subscribe(setSessions);
    return () => {
      unsubStudents();
      unsubGrades();
      unsubSubjects();
      unsubSessions();
    };
  }, []);

  // Filtered students
  const filteredStudents = useCallback(() => 
    students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      [student.fatherPhone, student.motherPhone, student.guardianPhone].some(phone => 
        phone?.includes(searchTerm)
      )
    ), [students, searchTerm]
  );

  const currentStudents = filteredStudents();

  const getPreferredPhone = (student: Student) => {
    switch (student.preferredContact) {
      case 'father': return student.fatherPhone;
      case 'mother': return student.motherPhone;
      case 'guardian': return student.guardianPhone;
      default: return student.parentEmail || 'N/A';
    }
  };

  const getSubjectNames = (subjectIds: string[]) => 
    subjectIds.slice(0, 2).map(id => subjectMap.get(id)).filter(Boolean).join(', ') +
    (subjectIds.length > 2 ? '...' : '');

  const getSessionNames = (sessionIds: string[]) => 
    sessionIds.slice(0, 2).map(id => sessionMap.get(id)).filter(Boolean).join(', ') +
    (sessionIds.length > 2 ? '...' : '');

  const openModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        rollNumber: student.rollNumber || '',
        fatherName: student.fatherName || '',
        motherName: student.motherName || '',
        guardianName: student.guardianName || '',
        fatherPhone: student.fatherPhone || '',
        motherPhone: student.motherPhone || '',
        guardianPhone: student.guardianPhone || '',
        parentEmail: student.parentEmail || '',
        preferredContact: student.preferredContact,
        age: student.age || 0,
        sex: student.sex || 'male',
        address: student.address || '',
        gradeId: student.gradeId || '',
        school: student.school || '',
        hscGroup: student.hscGroup || '',
        ourGradeId: student.ourGradeId,
        subjectIds: student.subjectIds || [],
        sessionIds: student.sessionIds || []
      });
    } else {
      setEditingStudent(null);
      setFormData({
        name: '',
        rollNumber: '',
        fatherName: '',
        motherName: '',
        guardianName: '',
        fatherPhone: '',
        motherPhone: '',
        guardianPhone: '',
        parentEmail: '',
        preferredContact: 'father',
        age: 0,
        sex: 'male',
        address: '',
        gradeId: '',
        school: '',
        hscGroup: '',
        ourGradeId: '',
        subjectIds: [],
        sessionIds: []
      });
    }
    setFormErrors({});
    setDeclarationChecked(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setFormData({
      name: '',
      rollNumber: '',
      fatherName: '',
      motherName: '',
      guardianName: '',
      fatherPhone: '',
      motherPhone: '',
      guardianPhone: '',
      parentEmail: '',
      preferredContact: 'father',
      age: 0,
      sex: 'male',
      address: '',
      gradeId: '',
      school: '',
      hscGroup: '',
      ourGradeId: '',
      subjectIds: [],
      sessionIds: []
    });
    setFormErrors({});
    setDeclarationChecked(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = 'Student name is required';
    if (!formData.preferredContact) errors.preferredContact = 'Preferred contact is required';
    if (formData.subjectIds.length === 0) errors.subjectIds = 'At least one subject is required';
    // Phone format validation if provided
    const phoneRegex = /^\+?\d{10,15}$/;
    if (formData.fatherPhone && !phoneRegex.test(formData.fatherPhone)) errors.fatherPhone = 'Invalid phone format';
    if (formData.motherPhone && !phoneRegex.test(formData.motherPhone)) errors.motherPhone = 'Invalid phone format';
    if (formData.guardianPhone && !phoneRegex.test(formData.guardianPhone)) errors.guardianPhone = 'Invalid phone format';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0 || !declarationChecked) {
      setFormErrors(errors);
      return;
    }

    const studentData: Omit<Student, 'id'> = {
      ...formData,
      createdAt: editingStudent?.createdAt || new Date().toISOString(),
      subjectIds: formData.subjectIds,
      sessionIds: formData.sessionIds
    };

    try {
      if (editingStudent) {
        await studentService.update(editingStudent.id, studentData);
      } else {
        await studentService.add(studentData);
      }
      closeModal();
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      await studentService.delete(id);
    }
  };

  const updateFormField = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error if fixed
    if (formErrors[field as string]) {
      setFormErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  const toggleSubject = (subjectId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subjectIds: checked 
        ? [...prev.subjectIds, subjectId]
        : prev.subjectIds.filter(id => id !== subjectId)
    }));
  };

  const toggleSession = (sessionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sessionIds: checked 
        ? [...prev.sessionIds, sessionId]
        : prev.sessionIds.filter(id => id !== sessionId)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-title">
          <h1 className="text-2xl font-bold text-[#1f2937]">Students</h1>
          <p className="text-[#6b7280] text-[14px]">Manage your student records and enrollment.</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 border-b border-[#e5e7eb] bg-[#fafafa] flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="page-title flex-1">
            <h2 className="text-xl font-bold text-[#1f2937]">Student Directory ({students.length})</h2>
          </div>
          
          {/* Search */}
          <div className="relative flex-1 sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
            <input 
              type="text"
              placeholder="Search by name or phone..."
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
              Add Student
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
                    <th className="px-6 py-3 w-[200px]">Name</th>
                    <th className="px-6 py-3 w-[120px]">Grade</th>
                    <th className="px-6 py-3 w-[160px]">Subjects</th>
                    <th className="px-6 py-3 w-[140px]">Sessions</th>
                    <th className="px-6 py-3 w-[140px]">Contact</th>
                    <th className="px-6 py-3 w-[100px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {currentStudents.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-mono text-[11px] text-[#6b7280]">S{1000 + idx}</td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-[13px] text-[#1f2937] truncate">{student.name}</div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="status-pill bg-[#f3f4f6] text-[#1f2937]">
                          {gradeMap.get(student.ourGradeId) || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-[12px] text-[#6b7280]">
                        {getSubjectNames(student.subjectIds)}
                      </td>
                      <td className="px-6 py-3 text-[12px] text-[#6b7280]">
                        {getSessionNames(student.sessionIds)}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1 text-[13px] text-[#1f2937]">
                          <Phone size={12} />
                          {getPreferredPhone(student)}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => openModal(student)}
                            className="p-1.5 text-[#9ca3af] hover:text-[#3b82f6] hover:bg-[#3b82f6]/5 rounded-lg transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(student.id)}
                            className="p-1.5 text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#ef4444]/5 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-[#6b7280]">
                        {searchTerm ? 'No students match your search.' : 'No students enrolled yet. Add your first student!'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentStudents.map((student) => (
                <motion.div 
                  key={student.id}
                  className="bg-white border border-[#e5e7eb] rounded-xl p-6 shadow-sm hover:shadow-md transition-all group"
                  whileHover={{ y: -2 }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-lg text-[#1f2937] truncate flex-1">{student.name}</h3>
                      <div className="flex gap-1 ml-2">
                        <button 
                          onClick={() => openModal(student)}
                          className="p-1.5 text-[#9ca3af] hover:text-[#3b82f6] hover:bg-[#3b82f6]/5 rounded-lg"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id)}
                          className="p-1.5 text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#ef4444]/5 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="status-pill bg-[#f3f4f6] text-[#1f2937] inline-block px-3 py-1 rounded-full">
                      {gradeMap.get(student.ourGradeId)}
                    </div>
                    <div className="text-[13px] text-[#6b7280] space-y-1">
                      <div>Subjects: {getSubjectNames(student.subjectIds)}</div>
                      <div>Sessions: {getSessionNames(student.sessionIds)}</div>
                    </div>
                    <div className="flex items-center gap-1 pt-2 text-[#1f2937]">
                      <Phone size={14} />
                      {getPreferredPhone(student)}
                    </div>
                  </div>
                </motion.div>
              ))}
              {currentStudents.length === 0 && (
                <div className="col-span-full p-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-[#e5e7eb]">
                  <Users className="mx-auto h-12 w-12 text-[#9ca3af] mb-4" />
                  <h3 className="text-lg font-bold text-[#1f2937] mb-1">
                    {searchTerm ? 'No students found' : 'No students enrolled'}
                  </h3>
                  <p className="text-[#6b7280] mb-4">Get started by adding your first student.</p>
                  <button
                    onClick={() => openModal()}
                    className="bg-[#3b82f6] text-white px-6 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-sm flex items-center gap-2 mx-auto"
                  >
                    <Plus size={16} />
                    Add Student
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
                  {editingStudent ? 'Edit Student Record' : 'Register New Student'}
                </h3>
                <button onClick={closeModal} className="text-[#9ca3af] hover:text-[#1f2937]">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Section 1: Basic Details */}
                <div className="border border-[#e5e7eb] rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users2 size={20} className="text-[#3b82f6]" />
                    <h4 className="text-lg font-bold text-[#1f2937]">Basic Details</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Student Name *</label>
                      <input 
                        required
                        type="text"
                        className={`w-full px-3 py-2 border rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all ${
                          formErrors.name 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-[#e5e7eb]'
                        }`}
                        value={formData.name}
                        onChange={e => updateFormField('name', e.target.value)}
                      />
                      {formErrors.name && <p className="text-red-500 text-[11px] mt-1">{formErrors.name}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Roll Number</label>
                      <input 
                        type="text"
                        className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                        value={formData.rollNumber}
                        onChange={e => updateFormField('rollNumber', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="space-y-1">
                      <label>Father Name</label>
                      <input type="text" className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all" value={formData.fatherName} onChange={e => updateFormField('fatherName', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label>Mother Name</label>
                      <input type="text" className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all" value={formData.motherName} onChange={e => updateFormField('motherName', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label>Guardian Name</label>
                      <input type="text" className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all" value={formData.guardianName} onChange={e => updateFormField('guardianName', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="space-y-1">
                      <label>Father Phone</label>
                      <input type="tel" className={`w-full px-3 py-2 border ${formErrors.fatherPhone ? 'border-red-500' : 'border-[#e5e7eb]'} rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all`} value={formData.fatherPhone} onChange={e => updateFormField('fatherPhone', e.target.value)} />
                      {formErrors.fatherPhone && <p className="text-red-500 text-[11px]">{formErrors.fatherPhone}</p>}
                    </div>
                    <div className="space-y-1">
                      <label>Mother Phone</label>
                      <input type="tel" className={`w-full px-3 py-2 border ${formErrors.motherPhone ? 'border-red-500' : 'border-[#e5e7eb]'} rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all`} value={formData.motherPhone} onChange={e => updateFormField('motherPhone', e.target.value)} />
                      {formErrors.motherPhone && <p className="text-red-500 text-[11px]">{formErrors.motherPhone}</p>}
                    </div>
                    <div className="space-y-1">
                      <label>Guardian Phone</label>
                      <input type="tel" className={`w-full px-3 py-2 border ${formErrors.guardianPhone ? 'border-red-500' : 'border-[#e5e7eb]'} rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all`} value={formData.guardianPhone} onChange={e => updateFormField('guardianPhone', e.target.value)} />
                      {formErrors.guardianPhone && <p className="text-red-500 text-[11px]">{formErrors.guardianPhone}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    <div className="space-y-1">
                      <label>Parent Email</label>
                      <input type="email" className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all" value={formData.parentEmail} onChange={e => updateFormField('parentEmail', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Preferred Contact *</label>
                      <select 
                        className={`w-full px-3 py-2 border rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 ${
                          formErrors.preferredContact ? 'border-red-500' : 'border-[#e5e7eb]'
                        }`}
                        value={formData.preferredContact}
                        onChange={e => updateFormField('preferredContact', e.target.value as any)}
                      >
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="guardian">Guardian</option>
                      </select>
                      {formErrors.preferredContact && <p className="text-red-500 text-[11px]">{formErrors.preferredContact}</p>}
                    </div>
                    <div className="space-y-1">
                      <label>Age</label>
                      <input type="number" min="5" max="25" className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all" value={formData.age} onChange={e => updateFormField('age', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1">
                      <label>Sex</label>
                      <select className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all" value={formData.sex} onChange={e => updateFormField('sex', e.target.value as any)}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label>Address</label>
                      <textarea 
                        rows={2}
                        className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all resize-none"
                        value={formData.address}
                        onChange={e => updateFormField('address', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Academic Details */}
                <div className="border border-[#e5e7eb] rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <School size={20} className="text-[#3b82f6]" />
                    <h4 className="text-lg font-bold text-[#1f2937]">Academic Details</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label>Current Grade</label>
                      <select className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all" value={formData.gradeId} onChange={e => updateFormField('gradeId', e.target.value)}>
                        <option value="">Select Grade</option>
                        {grades.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label>School</label>
                      <input type="text" className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all" value={formData.school} onChange={e => updateFormField('school', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1 mt-4">
                    <label>HSC Group (if applicable)</label>
                    <input type="text" className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all" value={formData.hscGroup} onChange={e => updateFormField('hscGroup', e.target.value)} />
                  </div>
                </div>

                {/* Section 3: Enrollment */}
                <div className="border border-[#e5e7eb] rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen size={20} className="text-[#3b82f6]" />
                    <h4 className="text-lg font-bold text-[#1f2937]">Our Enrollment</h4>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight mb-2 block">Our Grade *</label>
                      <select 
                        required
                        className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                        value={formData.ourGradeId}
                        onChange={e => updateFormField('ourGradeId', e.target.value)}
                      >
                        <option value="">Select Our Grade</option>
                        {grades.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight mb-2 block">Subjects * (At least 1)</label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border border-[#e5e7eb] rounded-lg p-3 bg-white">
                        {subjects.map((subject) => (
                          <label key={subject.id} className="flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={formData.subjectIds.includes(subject.id)}
                              onChange={(e) => toggleSubject(subject.id, e.target.checked)}
                              className="w-4 h-4 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6]"
                            />
                            <span className="text-sm text-[#1f2937]">{subject.name}</span>
                          </label>
                        ))}
                      </div>
                      {formErrors.subjectIds && <p className="text-red-500 text-[11px] mt-1">{formErrors.subjectIds}</p>}
                        <span className="text-sm text-[#6b7280] ml-2">({formData.subjectIds.length} selected)</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight mb-2 block">Sessions</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-[#e5e7eb] rounded-lg p-3 bg-white">
                      {sessions.map((session) => (
                        <label key={session.id} className="flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={formData.sessionIds.includes(session.id)}
                            onChange={(e) => toggleSession(session.id, e.target.checked)}
                            className="w-4 h-4 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6]"
                          />
<span className="text-sm text-[#1f2937]">{session.name} <span className="text-[#6b7280] text-xs ml-1">({session.startTime} - {session.endTime})</span></span>
                        </label>
                      ))}
                    </div>
                    <span className="text-sm text-[#6b7280] ml-2">({formData.sessionIds.length} selected)</span>
                  </div>
                </div>

                {/* Section 4: Declaration */}
                <div className="border border-[#e5e7eb] rounded-xl p-6 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <input
                      id="declaration"
                      type="checkbox"
                      checked={declarationChecked}
                      onChange={(e) => setDeclarationChecked(e.target.checked)}
                      className="mt-1 h-4 w-4 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6] mt-0.5"
                    />
                    <label htmlFor="declaration" className="text-[14px] text-[#1f2937] cursor-pointer flex-1">
                      <strong>I confirm the above details are correct</strong> and agree to the terms of enrollment.
                    </label>
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
                    disabled={!declarationChecked || Object.keys(formErrors).length > 0}
                    className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-lg text-[13px] font-bold hover:opacity-90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingStudent ? 'Update Student' : 'Register Student'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};


