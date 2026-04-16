import React, { useEffect, useState } from 'react';
import { Plus, BookOpen, User, X, Trash2 } from 'lucide-react';
import { classService } from '../services/firestore';
import { Class } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    teacherId: 'current-user-id', // Replace with actual user ID
    subjects: [] as string[]
  });
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    return classService.subscribe(setClasses);
  }, []);

  const handleAddSubject = () => {
    if (newSubject.trim()) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, newSubject.trim()]
      }));
      setNewSubject('');
    }
  };

  const removeSubject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await classService.add(formData);
    setIsModalOpen(false);
    setFormData({ name: '', teacherId: 'current-user-id', subjects: [] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-title">
          <h1 className="text-2xl font-bold text-[#1f2937]">Subjects & Sessions</h1>
          <p className="text-[#6b7280] text-[14px]">Manage your school's classes and their respective subjects.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#3b82f6] text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:opacity-90 transition-all shadow-sm"
        >
          <Plus size={16} />
          Create Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <motion.div 
            key={cls.id}
            whileHover={{ y: -2 }}
            className="bg-white p-5 rounded-xl border border-[#e5e7eb] shadow-sm flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-[#f3f4f6] rounded-lg flex items-center justify-center text-[#3b82f6]">
                <BookOpen size={18} />
              </div>
              <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">
                {cls.subjects.length} Subjects
              </span>
            </div>
            
            <h3 className="text-[16px] font-bold text-[#1f2937] mb-1">{cls.name}</h3>
            <div className="flex items-center gap-2 text-[12px] text-[#6b7280] mb-4">
              <User size={12} />
              <span>Assigned Teacher</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-auto">
              {cls.subjects.map((subject, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-0.5 bg-[#f3f4f6] text-[#1f2937] rounded text-[11px] font-medium border border-[#e5e7eb]"
                >
                  {subject}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-[#e5e7eb]"
            >
              <div className="p-5 border-b border-[#e5e7eb] flex items-center justify-between bg-[#fafafa]">
                <h3 className="text-[16px] font-bold text-[#1f2937]">Create New Class</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[#9ca3af] hover:text-[#1f2937]">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Class Name</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. Grade 10-A"
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">Add Subjects</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="e.g. Mathematics"
                      className="flex-1 px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                      value={newSubject}
                      onChange={e => setNewSubject(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubject())}
                    />
                    <button 
                      type="button"
                      onClick={handleAddSubject}
                      className="px-4 py-2 bg-[#1f2937] text-white rounded-lg text-[13px] font-bold hover:opacity-90 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-[#f3f4f6] rounded-lg border border-dashed border-[#e5e7eb]">
                  {formData.subjects.length === 0 && (
                    <span className="text-[12px] text-[#9ca3af]">No subjects added yet</span>
                  )}
                  {formData.subjects.map((s, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-white border border-[#e5e7eb] rounded text-[12px] font-medium text-[#1f2937] shadow-sm">
                      {s}
                      <button 
                        type="button" 
                        onClick={() => removeSubject(i)}
                        className="text-[#9ca3af] hover:text-[#ef4444]"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-[#e5e7eb] text-[#6b7280] rounded-lg text-[13px] font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-lg text-[13px] font-bold hover:opacity-90 transition-colors shadow-sm"
                  >
                    Create Class
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
