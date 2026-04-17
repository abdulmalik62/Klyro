import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, X, BookOpen, Table2, Grid } from 'lucide-react';
import { 
  subjectService, 
  sessionConfigService, 
  gradeService 
} from '../services/firestore';
import type { Subject, Session, Grade } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const AcademicConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'subjects' | 'sessions' | 'grades'>('subjects');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchTerm, setSearchTerm] = useState('');

  // Data states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<(Subject | Session | Grade) | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<any>({});

  // Subscriptions
  useEffect(() => {
    const unsubSubjects = subjectService.subscribe(setSubjects);
    const unsubSessions = sessionConfigService.subscribe(setSessions);
    const unsubGrades = gradeService.subscribe(setGrades);
    return () => {
      unsubSubjects();
      unsubSessions();
      unsubGrades();
    };
  }, []);

  // Filtered data
  const filteredData = useCallback(() => {
    switch (activeTab) {
      case 'subjects':
        return subjects.filter(s => 
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.code?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      case 'sessions':
        return sessions.filter(s => 
          s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      case 'grades':
        return grades.filter(g => 
          g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          g.section?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      default:
        return [];
    }
  }, [activeTab, searchTerm, subjects, sessions, grades]);

  const currentData = filteredData();

  const tabs = [
    { id: 'subjects' as const, label: 'Subjects', count: subjects.length },
    { id: 'sessions' as const, label: 'Sessions', count: sessions.length },
    { id: 'grades' as const, label: 'Grades', count: grades.length }
  ];

  const openModal = (item?: Subject | Session | Grade) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: (item as any).name,
        code: (item as any).code,
        startTime: (item as any).startTime,
        endTime: (item as any).endTime,
        section: (item as any).section
      });
    } else {
      setEditingItem(null);
      setFormData({});
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = 'Name is required';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      switch (activeTab) {
        case 'subjects':
          if (editingItem) {
            await subjectService.update((editingItem as Subject).id, formData);
          } else {
            await subjectService.add({ ...formData, createdAt: Date.now() });
          }
          break;
        case 'sessions':
          if (editingItem) {
            await sessionConfigService.update((editingItem as Session).id, formData);
          } else {
            await sessionConfigService.add({ ...formData, createdAt: Date.now() });
          }
          break;
        case 'grades':
          if (editingItem) {
            await gradeService.update((editingItem as Grade).id, formData);
          } else {
            await gradeService.add({ ...formData, createdAt: Date.now() });
          }
          break;
      }
      closeModal();
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      switch (activeTab) {
        case 'subjects': await subjectService.delete(id); break;
        case 'sessions': await sessionConfigService.delete(id); break;
        case 'grades': await gradeService.delete(id); break;
      }
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'subjects': return 'Subjects Management';
      case 'sessions': return 'Session Configuration';
      case 'grades': return 'Grade Configuration';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-title">
          <h1 className="text-2xl font-bold text-[#1f2937]">Academic Configuration</h1>
          <p className="text-[#6b7280] text-[14px]">Configure subjects, sessions, and grades for your institution.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="p-1 bg-[#fafafa] border-b border-[#e5e7eb]">
          <nav className="flex space-x-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-[13px] font-bold rounded-lg transition-all flex-1 ${
                  activeTab === tab.id
                    ? 'bg-white text-[#1f2937] shadow-sm'
                    : 'text-[#9ca3af] hover:text-[#1f2937] hover:bg-white/50'
                }`}
              >
                {tab.label} <span className="ml-1 text-[11px]">({tab.count})</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content Header */}
        <div className="p-4 border-b border-[#e5e7eb] bg-[#fafafa] flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="page-title flex-1">
            <h2 className="text-xl font-bold text-[#1f2937]">{getTabTitle()}</h2>
          </div>
          
          {/* Search */}
          <div className="relative flex-1 sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
            <input 
              type="text"
              placeholder={`Search ${activeTab}...`}
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
              Add
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
                    {activeTab === 'subjects' && (
                      <>
                        <th className="px-6 py-3 w-[80px]">ID</th>
                        <th className="px-6 py-3 w-[250px]">Subject Name</th>
                        <th className="px-6 py-3 w-[120px]">Code</th>
                        <th className="px-6 py-3 w-[120px] text-right">Actions</th>
                      </>
                    )}
                    {activeTab === 'sessions' && (
                      <>
                        <th className="px-6 py-3 w-[80px]">ID</th>
                        <th className="px-6 py-3 w-[250px]">Session Name</th>
                        <th className="px-6 py-3 w-[140px]">Start Time</th>
                        <th className="px-6 py-3 w-[140px]">End Time</th>
                        <th className="px-6 py-3 w-[120px] text-right">Actions</th>
                      </>
                    )}
                    {activeTab === 'grades' && (
                      <>
                        <th className="px-6 py-3 w-[80px]">ID</th>
                        <th className="px-6 py-3 w-[250px]">Grade Name</th>
                        <th className="px-6 py-3 w-[150px]">Section</th>
                        <th className="px-6 py-3 w-[120px] text-right">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {currentData.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-mono text-[11px] text-[#6b7280]">
                        {(activeTab === 'subjects' ? 'S' : activeTab === 'sessions' ? 'SE' : 'G')}{1000 + idx}
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-[13px] text-[#1f2937] truncate">{(item as any).name}</div>
                      </td>
                      {activeTab === 'subjects' && (
                        <td className="px-6 py-3 text-[13px] text-[#6b7280]">
                          {(item as Subject).code || 'N/A'}
                        </td>
                      )}
                      {activeTab === 'sessions' && (
                        <>
                          <td className="px-6 py-3 text-[13px] text-[#1f2937]">
                            {(item as Session).startTime}
                          </td>
                          <td className="px-6 py-3 text-[13px] text-[#1f2937]">
                            {(item as Session).endTime}
                          </td>
                        </>
                      )}
                      {activeTab === 'grades' && (
                        <td className="px-6 py-3">
                          <span className="status-pill bg-[#f3f4f6] text-[#1f2937]">
                            {(item as Grade).section || 'N/A'}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => openModal(item)}
                            className="p-1.5 text-[#9ca3af] hover:text-[#3b82f6] hover:bg-[#3b82f6]/5 rounded-lg transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#ef4444]/5 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentData.length === 0 && (
                    <tr>
                      <td colSpan={activeTab === 'sessions' ? 5 : 4} className="px-6 py-12 text-center text-[#6b7280]">
                        {searchTerm ? `No ${activeTab} match your search.` : `No ${activeTab} configured yet. Add your first one!`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentData.map((item) => (
                <motion.div 
                  key={item.id}
                  className="bg-white border border-[#e5e7eb] rounded-xl p-6 shadow-sm hover:shadow-md transition-all group"
                  whileHover={{ y: -2 }}
                >
                  <div className="space-y-3">
                    <div className="font-bold text-lg text-[#1f2937] truncate">{(item as any).name}</div>
                    {activeTab === 'subjects' && (
                      <div className="text-[13px] text-[#6b7280]">
                        Code: <span className="font-mono">{(item as Subject).code || 'N/A'}</span>
                      </div>
                    )}
                    {activeTab === 'sessions' && (
                      <div className="text-[13px] text-[#6b7280] space-y-1">
                        <div>Start: {(item as Session).startTime}</div>
                        <div>End: {(item as Session).endTime}</div>
                      </div>
                    )}
                    {activeTab === 'grades' && (
                      <div className="status-pill bg-[#f3f4f6] text-[#1f2937] inline-block px-3 py-1 rounded-full">
                        {(item as Grade).section || 'General'}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => openModal(item)}
                        className="p-2 text-[#9ca3af] hover:text-[#3b82f6] hover:bg-[#3b82f6]/5 rounded-lg transition-colors flex-1 text-center"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#ef4444]/5 rounded-lg transition-colors flex-1 text-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {currentData.length === 0 && (
                <div className="col-span-full p-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-[#e5e7eb]">
                  <BookOpen className="mx-auto h-12 w-12 text-[#9ca3af] mb-4" />
                  <h3 className="text-lg font-bold text-[#1f2937] mb-1">
                    {searchTerm ? `No ${activeTab} found` : `No ${activeTab} configured`}
                  </h3>
                  <p className="text-[#6b7280] mb-4">Get started by adding your first {activeTab}.</p>
                  <button
                    onClick={() => openModal()}
                    className="bg-[#3b82f6] text-white px-6 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-sm"
                  >
                    Add {activeTab.slice(0, -1)}
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
              className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-[#e5e7eb]"
            >
              <div className="p-5 border-b border-[#e5e7eb] flex items-center justify-between bg-[#fafafa]">
                <h3 className="text-[16px] font-bold text-[#1f2937]">
                  {editingItem ? `Edit ${activeTab}` : `Add New ${activeTab}`}
                </h3>
                <button onClick={closeModal} className="text-[#9ca3af] hover:text-[#1f2937]">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">
                    Name *
                  </label>
                  <input 
                    required
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all ${
                      formErrors.name 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-[#e5e7eb]'
                    }`}
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-[11px] mt-1">{formErrors.name}</p>
                  )}
                </div>

                {(activeTab === 'subjects' || activeTab === 'grades') && (
                  <div className="space-y-1">
                    <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">
                      {(activeTab === 'subjects' ? 'Code' : 'Section')} (Optional)
                    </label>
                    <input 
                      type="text"
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                      value={formData.code || formData.section || ''}
                      onChange={e => setFormData({ 
                        ...formData, 
                        ...(activeTab === 'subjects' ? { code: e.target.value } : { section: e.target.value })
                      })}
                    />
                  </div>
                )}

                {activeTab === 'sessions' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">
                          Start Time
                        </label>
                        <input 
                          type="time"
                          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                          value={formData.startTime || ''}
                          onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[12px] font-bold text-[#6b7280] uppercase tracking-tight">
                          End Time
                        </label>
                        <input 
                          type="time"
                          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                          value={formData.endTime || ''}
                          onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
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
                    className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-lg text-[13px] font-bold hover:opacity-90 transition-colors shadow-sm"
                  >
                    {editingItem ? 'Update' : 'Create'}
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

export default AcademicConfig;

