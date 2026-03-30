import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Eye, EyeOff, Film } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate();
  };

  const inputClass = cn(
    'w-full px-4 py-3 rounded-xl text-sm font-medium text-[#ACC8A2]',
    'bg-[rgba(172,200,162,0.05)] border border-[rgba(172,200,162,0.15)]',
    'placeholder:text-[rgba(172,200,162,0.3)] outline-none',
    'focus:border-[rgba(172,200,162,0.5)] focus:bg-[rgba(172,200,162,0.08)]',
    'transition-all duration-200'
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        style={{ background: 'rgba(5,10,4,0.92)', backdropFilter: 'blur(12px)' }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-full max-w-md rounded-3xl overflow-hidden"
          style={{
            background: '#0e1a0c',
            border: '1px solid rgba(172,200,162,0.15)',
            boxShadow: '0 40px 120px rgba(0,0,0,0.9), 0 0 60px rgba(172,200,162,0.05)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Decorative top gradient */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(172,200,162,0.4), transparent)' }} />

          <div className="p-6 sm:p-8">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(172,200,162,0.15)' }}>
                <Film className="w-5 h-5 text-[#ACC8A2]" />
              </div>
              <span className="text-lg font-black text-[#ACC8A2]">CineVerse</span>
            </div>

            {/* Toggle */}
            <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(172,200,162,0.05)' }}>
              {(['login', 'register'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg text-sm font-bold transition-all capitalize',
                    mode === m ? 'bg-[rgba(172,200,162,0.15)] text-[#ACC8A2]' : 'text-[rgba(172,200,162,0.4)] hover:text-[rgba(172,200,162,0.6)]'
                  )}
                >
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(172,200,162,0.4)]" />
                  <input type="text" placeholder="Your name" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required className={cn(inputClass, 'pl-11')} />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(172,200,162,0.4)]" />
                <input type="email" placeholder="Email address" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required className={cn(inputClass, 'pl-11')} />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(172,200,162,0.4)]" />
                <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required minLength={6} className={cn(inputClass, 'pl-11 pr-11')} />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(172,200,162,0.4)] hover:text-[rgba(172,200,162,0.7)] transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400/80 bg-red-400/5 border border-red-400/15 rounded-xl p-3">
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                disabled={mutation.isPending}
                className="w-full py-3.5 rounded-xl font-bold text-[#1A2517] text-sm transition-all"
                style={{ background: mutation.isPending ? 'rgba(172,200,162,0.6)' : '#ACC8A2' }}
              >
                {mutation.isPending ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </motion.button>
            </form>
          </div>

          {/* Close */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-[rgba(172,200,162,0.1)] transition-colors">
            <X className="w-4 h-4 text-[rgba(172,200,162,0.5)]" />
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
