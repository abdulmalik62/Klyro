import React from 'react';
import { Edit2, Trash2, Eye, Users, BookOpen, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import type { Class } from '../../types';

interface ClassCardProps {
  classes: Class[];
  searchTerm: string;
  gradeMap: Map<string, string>;
  subjectMap: Map<string, string>;
  teacherMap: Map<string, string>;
  sessionMap: Map<string, string>;
  getStudentCount: (studentIds: string[]) => number;
  onView: (cls: Class) => void;
  onEdit: (cls: Class) => void;
  onDelete: (id: string) => void;
  onCreateClass: () => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  classes,
  searchTerm,
  gradeMap,
  subjectMap,
  teacherMap,
  sessionMap,
  getStudentCount,
  onView,
  onEdit,
  onDelete,
  onCreateClass
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {classes.map((cls) => (
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
                  onClick={() => onView(cls)}
                  className="p-1.5 text-[#9ca3af] hover:text-[#3b82f6] hover:bg-[#3b82f6]/5 rounded-lg transition-colors"
                  title="View Class Details"
                >
                  <Eye size={14} />
                </button>
                <button 
                  onClick={() => onEdit(cls)}
                  className="p-1.5 text-[#9ca3af] hover:text-[#3b82f6] hover:bg-[#3b82f6]/5 rounded-lg"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => onDelete(cls.id)}
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
      {classes.length === 0 && (
        <div className="col-span-full p-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-[#e5e7eb]">
          <BookOpen className="mx-auto h-12 w-12 text-[#9ca3af] mb-4" />
          <h3 className="text-lg font-bold text-[#1f2937] mb-1">
            {searchTerm ? 'No classes found' : 'No classes configured'}
          </h3>
          <p className="text-[#6b7280] mb-4">Get started by creating your first class with intelligent matching.</p>
          <button
            onClick={onCreateClass}
            className="bg-[#3b82f6] text-white px-6 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-sm flex items-center gap-2 mx-auto"
          >
            <Plus size={16} />
            Create Class
          </button>
        </div>
      )}
    </div>
  );
};
