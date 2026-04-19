import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appToasts } from '../lib/appToasts';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginPage: React.FC = () => {
  const { user, signIn, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;
  if (user) return <Navigate to="/" />;

  const handleSignIn = async () => {
    try {
      await signIn();
      appToasts.signedIn();
      navigate('/');
    } catch (error) {
      console.error('Sign in failed', error);
      appToasts.signInFailed();
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-xl shadow-xl p-10 text-center border border-[#e5e7eb]"
      >
        <div className="w-12 h-12 bg-[#3b82f6] rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#3b82f6]/20">
          <LogIn className="text-white" size={24} />
        </div>
        
        <h1 className="text-2xl font-bold text-[#1f2937] mb-1">EduFlow Attendance</h1>
        <p className="text-[#6b7280] text-[14px] mb-8">
          Secure access for educational institutions
        </p>

        <button
          onClick={handleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-white border border-[#e5e7eb] text-[#1f2937] px-6 py-3 rounded-lg text-[14px] font-bold hover:bg-[#fafafa] transition-all shadow-sm active:scale-[0.98]"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="w-5 h-5"
          />
          Sign in with Google
        </button>

        <div className="mt-10 pt-8 border-t border-[#e5e7eb]">
          <p className="text-[10px] text-[#9ca3af] uppercase tracking-widest font-bold mb-4">System v2.4.1</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-[#f3f4f6] rounded-lg text-[10px] font-bold text-[#6b7280] uppercase">Owner</div>
            <div className="p-2 bg-[#f3f4f6] rounded-lg text-[10px] font-bold text-[#6b7280] uppercase">Teacher</div>
            <div className="p-2 bg-[#f3f4f6] rounded-lg text-[10px] font-bold text-[#6b7280] uppercase">Parent</div>
          </div>
        </div>
      </motion.div>
    </div>
  );

};
