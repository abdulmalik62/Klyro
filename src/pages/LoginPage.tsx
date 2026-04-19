import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appToasts } from '../lib/appToasts';
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
      console.error(error);
      appToasts.signInFailed();
    }
  };


  const slides = [
    {
      title: "Enterprise Educational Solution",
      desc: "A Reliable Edu Data Platform",
    },
    {
      title: "From Notebooks to Laptops",
      desc: "Digitalizingf Edu Data",
    },
    {
      title: "Safe and Secure Access",
      desc: "Controlled access and Secure Transactions",
    },
  ];

  const [current, setCurrent] = React.useState(0);

  // auto slide
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#eef2f6] flex flex-col items-center justify-center">

      {/* LOGO */}
      <div>
        <img
          src="/assets/an_t_logo.png"
          alt="AN Institute"
          className="w-36 h-36 object-contain"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-[380px] h-[520px] bg-white rounded-lg shadow-md border border-gray-200"
      >

        {/* TOP CONTENT */}
        <div className="absolute top-[60px] left-0 right-0 px-8">
          <h1 className="text-3xl font-bold mb-3 text-gray-800">
            Sign in
          </h1>

          <p className="text-sm text-gray-500 mb-6">
            Access your account effortlessly. Sign in to continue.
          </p>

          <button
            onClick={handleSignIn}
            className="w-full bg-[#4a7bdc] hover:bg-[#3b6ed3] text-white py-2.5 rounded-md flex items-center justify-center gap-2"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Sign in with Google
          </button>
        </div>

        {/* BOTTOM SLIDER AREA */}
        <div className="absolute bottom-[60px] left-0 right-0 px-8">
          <div className="text-xs text-gray-700 max-w-[65%] leading-snug transition-all duration-500">
            <p className="text-sm text-gray-400">
              Powered by{' '}
              <a
                href="https://yourdomain.com" // replace with your site
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#111827] hover:opacity-80 transition"
              >
                AcadGrid
              </a>
            </p>
          </div>

          {/* SLIDER */}
          <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-between overflow-hidden">

            {/* TEXT */}
            <div className="text-xs text-gray-700 max-w-[65%] leading-snug transition-all duration-500">
              <p>{slides[current].title}</p>
              <p className="font-medium">{slides[current].desc}</p>
            </div>

            {/* IMAGE PLACEHOLDER */}
            <div className="w-20 h-14 bg-gray-300 rounded-md flex items-center justify-center text-[10px] text-gray-500">
              Img
            </div>
          </div>

          {/* DOTS */}
          <div className="flex justify-center gap-2 mt-3">
            {slides.map((_, index) => (
              <div
                key={index}
                onClick={() => setCurrent(index)}
                className={`cursor-pointer transition-all ${current === index
                  ? "w-5 h-1.5 bg-gray-500 rounded-full"
                  : "w-1.5 h-1.5 bg-gray-300 rounded-full"
                  }`}
              />
            ))}
          </div>
        </div>

      </motion.div>

      {/* FOOTER */}
      <p className="mt-6 text-sm text-gray-500 text-center">
        © {new Date().getFullYear()} AN Institute, All Rights Reserved
      </p>
    </div>
  );
};