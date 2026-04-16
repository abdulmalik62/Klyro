import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  LogOut, 
  Menu, 
  X,
  UserCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-6 py-3 text-[14px] transition-all border-l-4",
      active 
        ? "bg-[#1f2937] text-white border-[#3b82f6]" 
        : "text-[#9ca3af] border-transparent hover:bg-white/5 hover:text-white"
    )}
  >
    <Icon size={18} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['owner', 'teacher', 'parent'] },
    { to: '/students', icon: Users, label: 'Student Directory', roles: ['owner', 'teacher'] },
    { to: '/classes', icon: BookOpen, label: 'Subjects & Sessions', roles: ['owner', 'teacher'] },
    { to: '/attendance', icon: Calendar, label: 'Daily Attendance', roles: ['owner', 'teacher'] },
  ].filter(item => profile && item.roles.includes(profile.role));

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[240px] bg-[#111827] transform transition-transform lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#3b82f6] rounded-lg" />
            <h1 className="text-xl font-bold text-white">EduFlow</h1>
          </div>

          <nav className="flex-1 mt-5 space-y-0">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                active={location.pathname === item.to}
              />
            ))}
          </nav>

          <div className="p-6 border-t border-white/10">
            <div className="text-[11px] text-[#4b5563] uppercase tracking-wider font-bold">System v2.4.1</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[64px] bg-white border-b border-[#e5e7eb] flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-gray-600"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-4 text-[14px]">
              <span className="text-[#6b7280]">Academic Year 2023-24</span>
              <span className="text-[#e5e7eb]">|</span>
              <span className="font-semibold text-[#1f2937]">Grade 10 - Section A</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-[13px] font-semibold text-[#1f2937]">{profile?.displayName}</div>
              <div className="text-[11px] text-[#6b7280] capitalize">{profile?.role}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-[12px] font-bold">
              {profile?.displayName?.split(' ').map(n => n[0]).join('')}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

