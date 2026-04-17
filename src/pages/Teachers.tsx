import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Users } from 'lucide-react';
import { teacherService, subjectService } from '../services/firestore';
import { Teacher, Subject } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const Teachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  
  const [formData, setFormData] = useState({
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
    return () => {
      unsubTeachers();
      unsubSubjects();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for major subjects
    if (formData.majorSubjectIds.length === 0) {
      alert('At least one major subject is required');
      return;
    }
    
    if (!formData.name || !formData.phone || !formData.qualification || formData.experience <= 0) {
      alert('Please fill all required fields and ensure experience is greater than 0');
      return;
    }

    const teacherData: Omit<Teacher, 'id'> = {
      ...formData,
      createdAt: editingTeacher ? editingTeacher.createdAt : Date.now()
    };

    if (editingTeacher) {
      await teacherService.update(editingTeacher.id, teacherData);
    } else {
      await teacherService.add(teacherData);
    }
    closeModal();
  };

  const openModal = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        name: teacher.name,
        phone: teacher.phone,
        qualification: teacher.qualification,
        experience: teacher.experience,
        majorSubjectIds: teacher.majorSubjectIds,
        otherSubjectIds: teacher.otherSubjectIds,
        address: teacher.address || ''
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        name: '',
        phone: '',
        qualification: '',
        experience: 0,
        majorSubjectIds: [],
        otherSubjectIds: [],
        address: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTeacher(null);
  };

  const getSubjectNames = (subjectIds: string[] | undefined) => 
    (subjectIds || []).map(id => subjects.find(s => s.id === id)?.name || id).slice(0, 2).join(', ');

  const filteredTeachers = teachers.filter((teacher) => 
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.phone.includes(searchTerm) ||
    teacher.qualification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-title">
          <h1 className="text-2xl font-bold text-[#1f2937]">Teacher Directory</h1>
          <p className="text-[#6b7280] text-[14px]">Manage your teaching staff records.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-[#3b82f6] text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:opacity-90 transition-all shadow-sm"
        >
          <Plus size={16} />
          Add Teacher
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#e5e7eb] bg-[#fafafa] flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
            <input 
              type="text"
              placeholder="Search teacher by name, phone or qualification..."
              className="w-[280px] pl-10 pr-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-[#e5e7eb] bg-white text-[#1f2937] rounded-lg text-[12px] font-medium hover:bg-gray-50">
              Bulk Actions
            </button>
          </div>
        </div>

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
                <th className="px-6 py-3 w-[100px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {filteredTeachers.map((teacher, idx) => (
                <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3 font-mono text-[11px] text-[#6b7280]">T{1000 + idx}</td>
                  <td className="px-6 py-3">
                    <div className="font-bold text-[13px] text-[#1f2937] truncate">{teacher.name}</div>
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
                        onClick={() => openModal(teacher)}
                        className="p-1.5 text-[#9ca3af] hover:text-[#3b82f6] hover:bg-[#3b82f6]/5 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => teacherService.delete(teacher.id)}
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
              className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-[#e5e7eb]"
            >
              <div className="p-5 border-b border-[#e5e7eb] flex items-center justify-between bg-[#fafafa]">
                <h3 className="text-[16px] font-bold text-[#1f2937]">
                  {editingTeacher ? 'Edit Teacher Record' : 'Register New Teacher'}
                </h3>
                <button onClick={closeModal} className="text-[#9ca3af] hover:text-[#1f2937]">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Full Name *</label>
                  <input 
                    required
                    type="text"
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Phone *</label>
                    <input 
                      required
                      type="tel"
                      placeholder="+1234567890"
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Experience (years) *</label>
                    <input 
                      required
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                      value={formData.experience}
                      onChange={e => setFormData({...formData, experience: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Qualification *</label>
                  <input 
                    required
                    type="text"
                    placeholder="B.Ed, M.Sc, etc."
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                    value={formData.qualification}
                    onChange={e => setFormData({...formData, qualification: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight mb-2 block">Major Subjects *</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-[#e5e7eb] rounded-lg p-3 bg-white">
                    {subjects.map((subject) => (
                      <label key={subject.id} className="flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-gray-50">
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
                  <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight mb-2 block">Other Subjects</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-[#e5e7eb] rounded-lg p-3 bg-white">
                    {subjects.map((subject) => (
                      <label key={subject.id} className="flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-gray-50">
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

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Address (Optional)</label>
                  <input 
                    type="text"
                    placeholder="Street, City, State"
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
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
                    className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-lg text-[13px] font-bold hover:opacity-90 transition-colors shadow-sm"
                  >
                    {editingTeacher ? 'Update Record' : 'Save Teacher'}
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

