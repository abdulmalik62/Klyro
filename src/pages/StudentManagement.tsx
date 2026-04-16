import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { studentService, classService } from '../services/firestore';
import { Student, Class } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    parentEmail: '',
    parentPhone: '',
    classId: ''
  });

  useEffect(() => {
    const unsubStudents = studentService.subscribe(setStudents);
    const unsubClasses = classService.subscribe(setClasses);
    return () => {
      unsubStudents();
      unsubClasses();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      await studentService.update(editingStudent.id, formData);
    } else {
      await studentService.add({ ...formData, createdAt: Date.now() });
    }
    closeModal();
  };

  const openModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        rollNumber: student.rollNumber,
        parentEmail: student.parentEmail,
        parentPhone: student.parentPhone,
        classId: student.classId
      });
    } else {
      setEditingStudent(null);
      setFormData({
        name: '',
        rollNumber: '',
        parentEmail: '',
        parentPhone: '',
        classId: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-title">
          <h1 className="text-2xl font-bold text-[#1f2937]">Student Directory</h1>
          <p className="text-[#6b7280] text-[14px]">Manage your school's student records.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-[#3b82f6] text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:opacity-90 transition-all shadow-sm"
        >
          <Plus size={16} />
          Add Student
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#e5e7eb] bg-[#fafafa] flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
            <input 
              type="text"
              placeholder="Search student by name or ID..."
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
                <th className="px-6 py-3 w-[200px]">Student Name</th>
                <th className="px-6 py-3 w-[120px]">Class</th>
                <th className="px-6 py-3">Parent Contact</th>
                <th className="px-6 py-3 w-[100px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {filteredStudents.map((student, idx) => (
                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3 font-mono text-[11px] text-[#6b7280]">#{1000 + idx}</td>
                  <td className="px-6 py-3">
                    <div className="font-bold text-[13px] text-[#1f2937] truncate">{student.name}</div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="status-pill bg-[#f3f4f6] text-[#1f2937]">
                      {classes.find(c => c.id === student.classId)?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-3 truncate">
                    <div className="text-[13px] text-[#1f2937]">{student.parentPhone}</div>
                    <div className="text-[11px] text-[#6b7280]">{student.parentEmail}</div>
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
                        onClick={() => studentService.delete(student.id)}
                        className="p-1.5 text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#ef4444]/5 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                  {editingStudent ? 'Edit Student Record' : 'Register New Student'}
                </h3>
                <button onClick={closeModal} className="text-[#9ca3af] hover:text-[#1f2937]">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Full Name</label>
                    <input 
                      required
                      type="text"
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Roll Number</label>
                    <input 
                      required
                      type="text"
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                      value={formData.rollNumber}
                      onChange={e => setFormData({...formData, rollNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Class Assignment</label>
                  <select 
                    required
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                    value={formData.classId}
                    onChange={e => setFormData({...formData, classId: e.target.value})}
                  >
                    <option value="">Select a class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Parent Email</label>
                  <input 
                    required
                    type="email"
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                    value={formData.parentEmail}
                    onChange={e => setFormData({...formData, parentEmail: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">WhatsApp Number</label>
                  <input 
                    required
                    type="tel"
                    placeholder="+1234567890"
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                    value={formData.parentPhone}
                    onChange={e => setFormData({...formData, parentPhone: e.target.value})}
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
                    {editingStudent ? 'Update Record' : 'Save Student'}
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
