import React from 'react';
import { Edit2, Trash2, Eye, Users } from 'lucide-react';
import type { Class } from '../../types';

interface ClassTableProps {
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
}

export const ClassTable: React.FC<ClassTableProps> = ({
  classes,
  searchTerm,
  gradeMap,
  subjectMap,
  teacherMap,
  sessionMap,
  getStudentCount,
  onView,
  onEdit,
  onDelete
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse table-fixed">
        <thead>
          <tr className="bg-[#fafafa] text-[#6b7280] text-[11px] uppercase tracking-wider font-bold border-b border-[#e5e7eb]">
            <th className="px-6 py-3 w-[80px]">ID</th>
            <th className="px-6 py-3 w-[120px]">Grade</th>
            <th className="px-6 py-3 w-[180px]">Subject</th>
            <th className="px-6 py-3 w-[160px]">Teacher</th>
            <th className="px-6 py-3 w-[140px]">Session</th>
            <th className="px-6 py-3 w-[100px]">Students</th>
            <th className="px-6 py-3 w-[120px] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb]">
          {classes.map((cls, idx) => (
            <tr key={cls.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-3 font-mono text-[11px] text-[#6b7280]">C{1000 + idx}</td>
              <td className="px-6 py-3">
                <span className="font-bold text-[13px] text-[#1f2937]">
                  {gradeMap.get(cls.gradeId) ?? '—'}
                </span>
              </td>
              <td className="px-6 py-3">
                <span className="font-bold text-[13px] text-[#1f2937]">
                  {subjectMap.get(cls.subjectId)}
                </span>
              </td>
              <td className="px-6 py-3">
                <span className="status-pill bg-[#f3f4f6] text-[#1f2937]">
                  {teacherMap.get(cls.teacherId)}
                </span>
              </td>
              <td className="px-6 py-3 text-[12px] text-[#6b7280]">
                {sessionMap.get(cls.sessionId)}
              </td>
              <td className="px-6 py-3">
                <div className="flex items-center gap-1 text-[13px] text-[#1f2937]">
                  <Users size={14} />
                  <span className="font-bold">{getStudentCount(cls.studentIds)}</span>
                </div>
              </td>
              <td className="px-6 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button 
                    onClick={() => onView(cls)}
                    className="p-1.5 text-[#9ca3af] hover:text-[#3b82f6] hover:bg-[#3b82f6]/5 rounded-lg transition-colors"
                    title="View Class Details"
                  >
                    <Eye size={14} />
                  </button>
                  <button 
                    onClick={() => onEdit(cls)}
                    className="p-1.5 text-[#9ca3af] hover:text-[#3b82f6] hover:bg-[#3b82f6]/5 rounded-lg transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => onDelete(cls.id)}
                    className="p-1.5 text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#ef4444]/5 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {classes.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-[#6b7280]">
                {searchTerm ? 'No classes match your search.' : 'No classes configured yet. Create your first class!'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
