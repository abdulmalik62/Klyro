/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { StudentManagement } from './pages/StudentManagement';
import { ClassManagement } from './pages/ClassManagement';
import { AttendancePage } from './pages/AttendancePage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/students" element={
            <ProtectedRoute allowedRoles={['owner', 'teacher']}>
              <DashboardLayout>
                <StudentManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/classes" element={
            <ProtectedRoute allowedRoles={['owner', 'teacher']}>
              <DashboardLayout>
                <ClassManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/attendance" element={
            <ProtectedRoute allowedRoles={['owner', 'teacher']}>
              <DashboardLayout>
                <AttendancePage />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/unauthorized" element={
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">403</h1>
                <p className="text-gray-500 mb-4">You don't have permission to access this page.</p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Go back home
                </button>
              </div>
            </div>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

