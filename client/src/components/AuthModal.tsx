import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { GoogleLogin } from '@react-oauth/google';
import api from '@/lib/api';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { setAuth } = useStore();

  const mutation = useMutation({
    mutationFn: async () => {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login' ? { email: form.email, password: form.password } : form;
      const { data } = await api.post(endpoint, payload);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      onClose();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Something went wrong';
      setError(msg);
    },
  });

  const googleMutation = useMutation({
    mutationFn: async (credential: string) => {
      const { data } = await api.post('/auth/google', { credential });
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      onClose();
    },
    onError: () => {
      setError('Google authentication failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate();
  };

  const inputClass = cn(
    'w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-900',
    'bg-gray-50 border border-gray-200',
    'placeholder:text-gray-400 outline-none',
    'focus:border-[#E11D48] focus:bg-white',
    'transition-all duration-200'
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-0 sm:p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        style={{ background: 'rgba(11,15,26,0.95)', backdropFilter: 'blur(16px)' }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 40 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-full max-w-5xl h-full sm:h-auto sm:max-h-[800px] bg-white rounded-none sm:rounded-[40px] overflow-hidden flex flex-col lg:flex-row shadow-[0_50px_100px_rgba(0,0,0,0.5)]"
          onClick={e => e.stopPropagation()}
        >
          {/* LEFT SIDE: Branding & Cinematic Asset */}
          <div className="relative w-full lg:w-[45%] h-48 sm:h-64 lg:h-auto overflow-hidden flex-shrink-0">
            <img 
              src="/spiderman/00001.png" 
              alt="Spider-Man" 
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Dark overlay with gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/40 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#0B0F1A]/20" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 sm:px-8 z-10">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl sm:text-4xl lg:text-6xl font-black tracking-tighter mb-2 sm:mb-4"
                style={{ background: 'linear-gradient(135deg, #E11D48 0%, #2563EB 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                CINEVERSE
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white/80 text-[10px] sm:text-xs lg:text-base font-medium max-w-[200px] sm:max-w-xs"
              >
                Discover your next favorite movie, <span className="text-[#E11D48] font-bold">powered by AI</span>
              </motion.p>
            </div>

            {/* Subtle floating elements - hidden on mobile to save space */}
            <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 flex items-center gap-2 opacity-50 hidden sm:flex">
               <div className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse" />
               <span className="text-[10px] text-white font-black uppercase tracking-widest">Authentication Secure</span>
            </div>
          </div>

          {/* RIGHT SIDE: Auth Form */}
          <div className="flex-1 bg-white p-8 lg:p-12 overflow-y-auto custom-scrollbar">
            <div className="max-w-sm mx-auto">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Welcome Back</h2>
                <p className="text-gray-500 text-sm font-medium">Sign in to continue your cinematic journey</p>
              </div>

              {/* Google Login */}
              <div className="mb-8 flex justify-center">
                <GoogleLogin
                  onSuccess={credentialResponse => {
                    if (credentialResponse.credential) {
                      googleMutation.mutate(credentialResponse.credential);
                    }
                  }}
                  onError={() => {
                    setError('Google Login Failed');
                  }}
                  useOneTap
                  theme="outline"
                  shape="pill"
                  width="100%"
                />
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-gray-400 font-bold tracking-widest">Secure login</span></div>
              </div>

              {/* Toggle */}
              <div className="flex bg-gray-50 rounded-2xl p-1.5 mb-8 border border-gray-100">
                {(['login', 'register'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(''); }}
                    className={cn(
                      'flex-1 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest',
                      mode === m ? 'bg-white text-[#E11D48] shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    )}
                  >
                    {m === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#E11D48] transition-colors" />
                    <input type="text" placeholder="Your Full Name" value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required className={cn(inputClass, 'pl-11')} />
                  </div>
                )}

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#E11D48] transition-colors" />
                  <input type="email" placeholder="Email Address" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required className={cn(inputClass, 'pl-11')} />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#E11D48] transition-colors" />
                  <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required minLength={6} className={cn(inputClass, 'pl-11 pr-11')} />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                    {error}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  disabled={mutation.isPending}
                  className="w-full py-4 rounded-2xl font-black text-white text-xs uppercase tracking-[0.2em] transition-all shadow-[0_20px_40px_rgba(225,29,72,0.2)]"
                  style={{ background: mutation.isPending ? 'rgba(225,29,72,0.6)' : '#E11D48' }}
                >
                  {mutation.isPending ? 'Authenticating...' : mode === 'login' ? 'Enter CineVerse' : 'Create Account'}
                </motion.button>
              </form>

              <div className="mt-8 text-center">
                 <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                   Protected by CineVerse Forge &bull; 2026
                 </p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }} 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 z-[120] transition-all"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
