import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Users, Users2, BookOpen, User, Phone, GraduationCap, Briefcase, MapPin, Table2, Grid, Eye, Clock } from 'lucide-react';
import { teacherService, subjectService, classService, gradeService, sessionConfigService } from '../services/firestore';
import type { Teacher, Subject, TeacherPronoun, Class, Grade, Session as ConfigSession } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { appToasts } from '../lib/appToasts';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { Avatar } from '../components/ui/Avatar';

export const Teachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [modalError, setModalError] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [teacherIdToDelete, setTeacherIdToDelete] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sessions, setSessions] = useState<ConfigSession[]>([]);

  const [formData, setFormData] = useState({
    pronoun: 'Mr' as TeacherPronoun,
    name: '',
    phone: '',
    qualification: '',
    experience: 0,
    majorSubjectIds: [] as string[],
    otherSubjectIds: [] as string[],
    address: ''
  });

  useEffect(() => {
    const unsubTeachers = teacherService.subscribe(setTeachers);
    const unsubSubjects = subjectService.subscribe(setSubjects);
    const unsubClasses = classService.subscribe(setClasses);
    const unsubGrades = gradeService.subscribe(setGrades);
    const unsubSessions = sessionConfigService.subscribe(setSessions);
    return () => {
      unsubTeachers();
      unsubSubjects();
      unsubClasses();
      unsubGrades();
      unsubSessions();
    };
  }, []);

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s.name])), [subjects]);
  const gradeMap = useMemo(() => new Map(grades.map((g) => [g.id, g.name])), [grades]);

  const teacherDisplayName = (t: Teacher) => `${t.pronoun ?? 'Mr'}. ${t.name}`;

  const formatSessionTime = (sessionId: string) => {
    const sess = sessions.find((s) => s.id === sessionId);
    if (!sess) return '—';
    return `${sess.name} · ${sess.startTime} – ${sess.endTime}`;
  };

  const teacherAssignedClasses = useMemo(() => {
    if (!selectedTeacher) return [];
    return classes.filter((c) => c.teacherId === selectedTeacher.id);
  }, [classes, selectedTeacher]);

  const openViewModal = (teacher: Teacher) => setSelectedTeacher(teacher);
  const closeViewModal = () => setSelectedTeacher(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    // Validation for major subjects
    if (formData.majorSubjectIds.length === 0) {
      setModalError('At least one major subject is required');
      appToasts.fixForm();
      return;
    }
    
    if (!formData.name || !formData.phone || !formData.qualification || formData.experience <= 0) {
      setModalError('Please fill all required fields, ensure experience > 0');
      appToasts.fixForm();
      return;
    }

    // Declaration only for new teachers
    if (!editingTeacher && !declarationChecked) {
      setModalError('Please check the declaration');
      appToasts.confirmRequired('declaration');
      return;
    }

    const teacherData: Omit<Teacher, 'id'> = {
      ...formData,
      createdAt: editingTeacher ? editingTeacher.createdAt : Date.now()
    };

    try {
      if (editingTeacher) {
        await teacherService.update(editingTeacher.id, teacherData);
        appToasts.updated('Teacher');
      } else {
        await teacherService.add(teacherData);
        appToasts.created('Teacher');
      }
      closeModal();
    } catch {
      appToasts.saveFailed('teacher');
    }
  };

  const openModal = (teacher?: Teacher) => {
    setModalError('');
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        pronoun: teacher.pronoun ?? 'Mr',
        name: teacher.name,
        phone: teacher.phone,
        qualification: teacher.qualification,
        experience: teacher.experience,
        majorSubjectIds: teacher.majorSubjectIds || [],
        otherSubjectIds: teacher.otherSubjectIds || [],
        address: teacher.address || ''
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        pronoun: 'Mr',
        name: '',
        phone: '',
        qualification: '',
        experience: 0,
        majorSubjectIds: [],
        otherSubjectIds: [],
        address: ''
      });
    }
    setDeclarationChecked(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTeacher(null);
    setModalError('');
  };

  const getSubjectNames = (subjectIds: string[] | undefined) => 
    (subjectIds || []).map(id => subjects.find(s => s.id === id)?.name || id).slice(0, 2).join(', ');

  const filteredTeachers = teachers.filter((teacher) => 
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.phone.includes(searchTerm) ||
    teacher.qualification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openDeleteConfirm = (id: string) => {
    setTeacherIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTeacher = async () => {
    if (!teacherIdToDelete) return;
    try {
      await teacherService.delete(teacherIdToDelete);
      appToasts.deleted('Teacher');
    } catch {
      appToasts.deleteFailed('teacher');
      throw new Error('delete failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-title">
          <h1 className="text-2xl font-bold text-[#1f2937]">Teachers</h1>
          <p className="text-[#6b7280] text-[14px]">Manage your teaching staff records.</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 border-b border-[#e5e7eb] bg-[#fafafa] flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="page-title flex-1">
            <h2 className="text-xl font-bold text-[#1f2937]">Teacher Directory ({teachers.length})</h2>
          </div>
          
          {/* Search */}
          <div className="relative flex-1 sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
            <input 
              type="text"
              placeholder="Search by name, phone or qualification..."
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
              Add Teacher
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
                    <th className="px-6 py-3 w-[200px]">Teacher Name</th>
                    <th className="px-6 py-3 w-[140px]">Qualification</th>
                    <th className="px-6 py-3 w-[100px]">Experience</th>
                    <th className="px-6 py-3 w-[180px]">Major Subjects</th>
                    <th className="px-6 py-3 w-[120px]">Phone</th>
                    <th className="px-6 py-3 w-[130px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {filteredTeachers.map((teacher, idx) => (
                    <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-mono text-[11px] text-[#6b7280]">T{1000 + idx}</td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-[13px] text-[#1f2937] truncate">
                          {(teacher.pronoun ?? 'Mr')}. {teacher.name}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="status-pill bg-[#f3f4f6] text-[#1f2937] px-2 py-1 rounded-full text-[11px]">
                          {teacher.qualification}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-bold text-[13px] text-[#1f2937]">{teacher.experience} yrs</span>
                      </td>
                      <td className="px-6 py-3 text-[12px] text-[#6b7280] max-w-[180px]">
                        {getSubjectNames(teacher.majorSubjectIds)}
                        {(teacher.majorSubjectIds || []).length > 2 && '...'}
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-[13px] text-[#1f2937]">{teacher.phone}</div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openViewModal(teacher)}
                            className="p-1.5 text-[#9ca3af] hover:text-[#6366f1] hover:bg-[#6366f1]/5 rounded-lg transition-colors"
                            title="View profile"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            onClick={() => openModal(teacher)}
                            className="p-1.5 text-[#9ca3af] hover:text-[#3b82f6] hover:bg-[#3b82f6]/5 rounded-lg transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => openDeleteConfirm(teacher.id)}
                            className="p-1.5 text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#ef4444]/5 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTeachers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-[#6b7280]">
                        {searchTerm ? 'No teachers match your search.' : 'No teachers found. Add your first teacher!'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map((teacher) => (
                <motion.div 
                  key={teacher.id}
                  className="bg-white border border-[#e5e7eb] rounded-xl p-6 shadow-sm hover:shadow-md transition-all group"
                  whileHover={{ y: -2 }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-lg text-[#1f2937] truncate flex-1">
                        {(teacher.pronoun ?? 'Mr')}. {teacher.name}
                      </h3>
                      <div className="flex gap-1 ml-2">
                        <button
                          type="button"
                          onClick={() => openViewModal(teacher)}
                          className="p-1.5 text-[#9ca3af] hover:text-[#6366f1] hover:bg-[#6366f1]/5 rounded-lg"
                          title="View profile"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => openModal(teacher)}
                          className="p-1.5 text-[#9ca3af] hover:text-[#3b82f6] hover:bg-[#3b82f6]/5 rounded-lg"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => openDeleteConfirm(teacher.id)}
                          className="p-1.5 text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#ef4444]/5 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <span className="status-pill bg-[#f3f4f6] text-[#1f2937] inline-block px-3 py-1 rounded-full">
                      {teacher.qualification}
                    </span>
                    <div className="text-[13px] text-[#6b7280] space-y-1">
                      <div>Experience: {teacher.experience} yrs</div>
                      <div>Major Subjects: {getSubjectNames(teacher.majorSubjectIds)}{(teacher.majorSubjectIds || []).length > 2 && '...'}</div>
                    </div>
                    <div className="flex items-center gap-1 pt-2 text-[#1f2937]">
                      <Phone size={14} />
                      {teacher.phone}
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredTeachers.length === 0 && (
                <div className="col-span-full p-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-[#e5e7eb]">
                  <Users className="mx-auto h-12 w-12 text-[#9ca3af] mb-4" />
                  <h3 className="text-lg font-bold text-[#1f2937] mb-1">
                    {searchTerm ? 'No teachers found' : 'No teachers enrolled'}
                  </h3>
                  <p className="text-[#6b7280] mb-4">Get started by adding your first teacher.</p>
                  <button
                    onClick={() => openModal()}
                    className="bg-[#3b82f6] text-white px-6 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-sm flex items-center gap-2 mx-auto"
                  >
                    <Plus size={16} />
                    Add Teacher
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
              className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-[#e5e7eb] max-h-[90vh]"
            >
              <div className="p-6 border-b border-[#e5e7eb] flex items-center justify-between bg-[#fafafa] sticky top-0 z-10">
                <h3 className="text-[18px] font-bold text-[#1f2937]">
                  {editingTeacher ? 'Edit Teacher Record' : 'Register New Teacher'}
                </h3>
                <button onClick={closeModal} className="text-[#9ca3af] hover:text-[#1f2937]">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Section 1: Personal Details */}
                <div className="form-section">
                  <div className="section-header">
                    <Users2 size={20} className="text-[#3b82f6]" />
                    <h4 className="section-title">Personal Details</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4">
                    <div className="space-y-1">
                      <label className="form-label">Pronoun *</label>
                      <select
                        className="form-input w-full"
                        value={formData.pronoun}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pronoun: e.target.value as TeacherPronoun,
                          })
                        }
                      >
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Dr">Dr</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="form-label">Full Name *</label>
                      <div className="input-with-icon">
                        <User className="input-icon" size={16} />
                        <input 
                          required
                          type="text"
                          className="form-input"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1">
                      <label className="form-label">Phone *</label>
                      <div className="input-with-icon">
                        <Phone className="input-icon" size={16} />
                        <input 
                          required
                          type="tel"
                          placeholder="+1234567890"
                          className="form-input"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="form-label">Experience (years) *</label>
                      <div className="input-with-icon">
                        <Briefcase className="input-icon" size={16} />
                        <input 
                          required
                          type="number"
                          min="1"
                          className="form-input"
                          value={formData.experience}
                          onChange={e => setFormData({...formData, experience: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 mt-4">
                    <label className="form-label">Qualification *</label>
                    <div className="input-with-icon">
                      <GraduationCap className="input-icon" size={16} />
                      <input 
                        required
                        type="text"
                        placeholder="B.Ed, M.Sc, etc."
                        className="form-input"
                        value={formData.qualification}
                        onChange={e => setFormData({...formData, qualification: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Subjects */}
                <div className="form-section">
                  <div className="section-header">
                    <BookOpen size={20} className="text-[#3b82f6]" />
                    <h4 className="section-title">Subjects</h4>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="form-label mb-2 block">Major Subjects * (At least 1)</label>
                      <div className="checkbox-list">
                        {subjects.map((subject) => (
                          <label key={subject.id} className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={formData.majorSubjectIds.includes(subject.id)}
                              onChange={(e) => {
                                const newIds = e.target.checked
                                  ? [...formData.majorSubjectIds, subject.id]
                                  : formData.majorSubjectIds.filter(id => id !== subject.id);
                                setFormData({ ...formData, majorSubjectIds: newIds });
                              }}
                              className="w-4 h-4 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6]"
                            />
                            <span className="text-sm text-[#1f2937]">{subject.name}</span>
                          </label>
                        ))}
                      </div>
                      {formData.majorSubjectIds.length === 0 && (
                        <p className="text-red-500 text-[11px] mt-1">At least one major subject is required</p>
                      )}
                    </div>
                    <div>
                      <label className="form-label mb-2 block">Other Subjects</label>
                      <div className="checkbox-list">
                        {subjects.map((subject) => (
                          <label key={subject.id} className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={formData.otherSubjectIds.includes(subject.id)}
                              onChange={(e) => {
                                const newIds = e.target.checked
                                  ? [...formData.otherSubjectIds, subject.id]
                                  : formData.otherSubjectIds.filter(id => id !== subject.id);
                                setFormData({ ...formData, otherSubjectIds: newIds });
                              }}
                              className="w-4 h-4 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6]"
                            />
                            <span className="text-sm text-[#1f2937]">{subject.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Address */}
                <div className="form-section">
                  <div className="section-header">
                    <MapPin size={20} className="text-[#3b82f6]" />
                    <h4 className="section-title">Address</h4>
                  </div>
                  <div className="space-y-1">
                    <label className="form-label">Address (Optional)</label>
                    <div className="input-with-icon">
                      <MapPin className="input-icon" size={16} />
                      <input 
                        type="text"
                        placeholder="Street, City, State"
                        className="form-input"
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Declaration required only when registering a new teacher */}
                {!editingTeacher && (
                  <div className="declaration-section">
                    <div className="flex items-start gap-3">
                      <input
                        id="declaration"
                        type="checkbox"
                        checked={declarationChecked}
                        onChange={(e) => setDeclarationChecked(e.target.checked)}
                        className="mt-1 h-4 w-4 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6] mt-0.5"
                      />
                      <label htmlFor="declaration" className="text-[14px] text-[#1f2937] cursor-pointer flex-1">
                        <strong>I confirm the above details are correct</strong> and agree to the terms of employment.
                      </label>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {modalError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{modalError}</p>
                  </div>
                )}

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
                    disabled={!editingTeacher && !declarationChecked}
                    className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-lg text-[13px] font-bold hover:opacity-90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingTeacher ? 'Update Record' : 'Save Teacher'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTeacher && (
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
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-[#e5e7eb] bg-white shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e5e7eb] bg-[#fafafa] p-6">
                <h3 className="text-[18px] font-bold text-[#1f2937]">Teacher profile</h3>
                <button
                  type="button"
                  onClick={closeViewModal}
                  className="rounded-lg p-1.5 text-[#9ca3af] transition-colors hover:bg-gray-200 hover:text-[#1f2937]"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div className="rounded-xl border border-[#e5e7eb] p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Avatar name={selectedTeacher.name} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xl font-bold text-[#1f2937]">
                        {teacherDisplayName(selectedTeacher)}
                      </h4>
                      <p className="mt-1 text-sm text-[#6b7280]">{selectedTeacher.phone}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="status-pill rounded-full bg-[#dbeafe]/80 px-3 py-1 text-xs font-semibold text-[#1e40af]">
                          {selectedTeacher.qualification}
                        </span>
                        <span className="text-sm font-semibold text-[#1f2937]">
                          {selectedTeacher.experience} yrs experience
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#e5e7eb] p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-[#3b82f6]/10 p-2">
                      <BookOpen size={20} className="text-[#3b82f6]" />
                    </div>
                    <h4 className="text-lg font-bold text-[#1f2937]">Subjects</h4>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="mb-2 block font-medium text-[#6b7280]">Major subjects</span>
                      <div className="flex flex-wrap gap-2">
                        {(selectedTeacher.majorSubjectIds || []).length ? (
                          (selectedTeacher.majorSubjectIds || []).map((id) => (
                            <span
                              key={id}
                              className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-semibold text-[#1f2937]"
                            >
                              {subjectMap.get(id) || id}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#9ca3af]">—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="mb-2 block font-medium text-[#6b7280]">Other subjects</span>
                      <div className="flex flex-wrap gap-2">
                        {(selectedTeacher.otherSubjectIds || []).length ? (
                          (selectedTeacher.otherSubjectIds || []).map((id) => (
                            <span
                              key={id}
                              className="rounded-full border border-[#e5e7eb] bg-white px-3 py-1 text-xs font-medium text-[#374151]"
                            >
                              {subjectMap.get(id) || id}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#9ca3af]">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#e5e7eb] p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-[#10b981]/10 p-2">
                      <Clock size={20} className="text-[#10b981]" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#1f2937]">Assigned classes</h4>
                      <p className="text-sm text-[#6b7280]">Subject, session, and grade</p>
                    </div>
                  </div>
                  {teacherAssignedClasses.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-[#e5e7eb] bg-gray-50 py-10 text-center text-sm text-[#6b7280]">
                      No classes assigned to this teacher yet.
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {teacherAssignedClasses.map((cls) => (
                        <li
                          key={cls.id}
                          className="rounded-lg border border-[#f3f4f6] bg-gray-50/50 p-4 text-sm"
                        >
                          <div className="font-bold text-[#1f2937]">
                            {subjectMap.get(cls.subjectId) || 'Unknown subject'}
                          </div>
                          <div className="mt-1 text-[#6b7280]">{formatSessionTime(cls.sessionId)}</div>
                          <div className="mt-1 text-xs text-[#9ca3af]">
                            Grade: {gradeMap.get(cls.gradeId) ?? '—'}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {selectedTeacher.address ? (
                  <div className="rounded-xl border border-[#e5e7eb] p-6">
                    <div className="mb-2 flex items-center gap-3">
                      <MapPin size={18} className="text-[#3b82f6]" />
                      <h4 className="font-bold text-[#1f2937]">Address</h4>
                    </div>
                    <p className="text-sm text-[#374151]">{selectedTeacher.address}</p>
                  </div>
                ) : null}

                <div className="rounded-lg border border-[#e5e7eb] bg-gray-50 p-4 text-center">
                  <h4 className="mb-2 font-bold text-[#1f2937]">Attendance</h4>
                  <p className="text-sm text-gray-500">Attendance data will be available soon</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) setTeacherIdToDelete(null);
        }}
        title="Delete this teacher?"
        description="This will permanently remove the teacher record. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDeleteTeacher}
      />
    </div>
  );
};

