import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';
import { studentService, classService } from '../services/firestore';
import { Student, Class } from '../types';

const StatCard = ({ label, value, colorClass }: any) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className="bg-white p-4 rounded-xl border border-[#e5e7eb] shadow-sm"
  >
    <p className="text-[12px] text-[#6b7280] font-bold uppercase tracking-wider mb-1">{label}</p>
    <h3 className={cn("text-2xl font-bold font-mono", colorClass || "text-[#1f2937]")}>{value}</h3>
  </motion.div>
);

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ students: 0, classes: 0 });

  useEffect(() => {
    const unsubStudents = studentService.subscribe(s => setStats(prev => ({ ...prev, students: s.length })));
    const unsubClasses = classService.subscribe(c => setStats(prev => ({ ...prev, classes: c.length })));
    return () => {
      unsubStudents();
      unsubClasses();
    };
  }, []);

  if (profile?.role === 'parent') {
    return (
      <div className="space-y-6">
        <div className="page-title">
          <h1 className="text-2xl font-bold text-[#1f2937]">Parent Dashboard</h1>
          <p className="text-[#6b7280] text-[14px]">Track your child's attendance and progress.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard label="Attendance Rate" value="94%" colorClass="text-[#10b981]" />
          <StatCard label="Total Absences" value="03" colorClass="text-[#ef4444]" />
          <StatCard label="Performance" value="Good" colorClass="text-[#3b82f6]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-title">
        <h1 className="text-2xl font-bold text-[#1f2937]">Welcome, {profile?.displayName}</h1>
        <p className="text-[#6b7280] text-[14px]">Here's what's happening in your school today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total Students" value={stats.students.toString().padStart(2, '0')} />
        <StatCard label="Active Classes" value={stats.classes.toString().padStart(2, '0')} />
        <StatCard label="Present Today" value="28" colorClass="text-[#10b981]" />
        <StatCard label="Absent" value="04" colorClass="text-[#ef4444]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-[#e5e7eb] shadow-sm">
          <h3 className="text-[16px] font-bold text-[#1f2937] mb-4 uppercase tracking-tight">Recent Activity</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-[#f3f4f6] flex items-center justify-center text-[#3b82f6] font-bold text-xs">
                  {i}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#1f2937]">Attendance marked for Class {i}A</p>
                  <p className="text-[11px] text-[#6b7280]">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e5e7eb] shadow-sm">
          <h3 className="text-[16px] font-bold text-[#1f2937] mb-4 uppercase tracking-tight">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 bg-[#f3f4f6] text-[#1f2937] rounded-lg font-semibold hover:bg-[#e5e7eb] transition-colors text-[12px]">
              Add New Student
            </button>
            <button className="p-3 bg-[#f3f4f6] text-[#1f2937] rounded-lg font-semibold hover:bg-[#e5e7eb] transition-colors text-[12px]">
              Schedule Session
            </button>
            <button className="p-3 bg-[#f3f4f6] text-[#1f2937] rounded-lg font-semibold hover:bg-[#e5e7eb] transition-colors text-[12px]">
              View Reports
            </button>
            <button className="p-3 bg-[#25D366] text-white rounded-lg font-semibold hover:opacity-90 transition-colors text-[12px]">
              Send Alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

