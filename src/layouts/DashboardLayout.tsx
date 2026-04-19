import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  House,
  Student,
  ChalkboardTeacher,
  ChalkboardSimple,
  UsersThree,
  GraduationCap,
  Notebook,
  CalendarCheck,
  SignOut
} from "phosphor-react";
import { useAuth } from '../context/AuthContext';
import { appToasts } from '../lib/appToasts';
import { cn } from '../lib/utils';

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  collapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon: Icon, label, active, collapsed }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 text-[14px] transition-all border-l-4 rounded-r-lg mx-1 hover:bg-white/5",
      active
        ? "bg-[#1f2937] text-white border-[#3b82f6]"
        : "text-[#9ca3af] border-transparent hover:text-white"
    )}
  >
    <Icon size={18} />
    {!collapsed && <span className="font-medium">{label}</span>}
  </Link>
);

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const handleLogout = async () => {
    await logout();
    appToasts.signedOut();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const sidebarWidth = isSidebarCollapsed ? 'w-16' : 'w-[240px]';


  const menuItems = [
    { to: '/', icon: ChalkboardSimple, label: 'Dashboard', roles: ['owner', 'teacher', 'parent'] },
    { to: '/academic-config', icon: GraduationCap, label: 'Academic Setup', roles: ['owner', 'teacher'] },
     { to: '/teachers', icon: ChalkboardTeacher, label: 'Teacher Management', roles: ['owner', 'teacher'] },
    { to: '/students', icon: Student, label: 'Student Management', roles: ['owner', 'teacher'] },
    { to: '/classes', icon: Notebook, label: 'Class Management', roles: ['owner', 'teacher'] },

    { to: '/schedules', icon: Calendar, label: 'Schedules', roles: ['owner', 'teacher'] },

    { to: '/attendance', icon: CalendarCheck, label: 'Attendance Management', roles: ['owner', 'teacher'] },
  ].filter(item => profile && item.roles.includes(profile.role));

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#f3f4f6] font-sans">
      {/* Topbar */}
      <header className="h-16 shrink-0 bg-white border-b border-[#e5e7eb] flex items-center justify-between px-4 sm:px-8 z-50 shadow-sm">
        <div className="flex items-center gap-4 flex-shrink-0">
          <img
            src="../assets/an_t_logo.png"
            alt="AN Logo"
            className="h-15 w-auto"
          />
          <div className="hidden md:flex items-center gap-4 text-[14px]">
            <span className="font-semibold text-[#1f2937]">AN Institute</span>
            <span className="text-[#e5e7eb]">|</span>
            <span className="font-semibold text-[#6b7280]">Way to Success</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <div className="text-[13px] font-semibold text-[#1f2937]">{profile?.displayName}</div>
            <div className="text-[11px] text-[#6b7280] capitalize">{profile?.role}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-[12px] font-bold flex-shrink-0">
            {profile?.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
          </div>
        </div>
      </header>

      {/* Main Area with Sidebar */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Full-Height Sidebar */}
        <aside className={cn(
          "flex shrink-0 flex-col bg-[#111827] transition-all duration-300 border-r border-white/10 z-40",
          sidebarWidth
        )}>
          {/* Nav Content */}
          <div className="flex-1 overflow-auto py-6 px-0">
            <nav className="space-y-1 w-full">
              {menuItems.map((item) => (
                <SidebarItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  active={location.pathname === item.to}
                  collapsed={isSidebarCollapsed}
                />
              ))}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-white/10 p-3 flex flex-col gap-2">
            {/* Collapse Toggle */}
            <button
              onClick={toggleSidebar}
              className="p-2 flex items-center justify-center hover:bg-white/5 rounded transition-colors"
              title={isSidebarCollapsed ? "Expand" : "Collapse"}
            >
              {isSidebarCollapsed ? <ChevronRight size={18} className="text-[#9ca3af]" /> : <ChevronLeft size={18} className="text-[#9ca3af]" />}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 flex items-center gap-2 hover:bg-red-600/20 text-[#9ca3af] hover:text-red-400 rounded transition-colors w-full justify-center"
              title="Logout"
            >
              <LogOut size={18} />
              {!isSidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {/* Primary scroll: long pages scroll here; calendar pages fill height */}
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f3f4f6] p-6 lg:p-8">
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden [-webkit-overflow-scrolling:touch]">
              {children}
            </div>
          </main>

          {/* Footer: same column as main — no extra pl; sidebar is a sibling */}
          <footer className="flex h-12 shrink-0 items-center justify-between border-t border-[#e5e7eb] bg-white px-6 text-sm text-[#6b7280] shadow-sm lg:px-8">
            <div>
              Powered by <span className="text-[#6b7280]">AcadGrid</span>
            </div>
            <div className="ml-auto">
              © {currentYear} AN Institute. All rights reserved.
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
