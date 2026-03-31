import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function OopsModal() {
  const { oopsModalOpen, setOopsModalOpen, setAuthModalOpen } = useStore();

  if (!oopsModalOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[400] flex items-center justify-center p-4"
        style={{ background: 'rgba(11,15,26,0.85)', backdropFilter: 'blur(12px)' }}
        onClick={() => setOopsModalOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm overflow-hidden rounded-3xl p-8 text-center"
          style={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 40px rgba(225,29,72,0.05)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#E11D48]/20 to-[#E11D48]/5 flex items-center justify-center mx-auto mb-8 border border-[#E11D48]/10 relative group">
            <div className="absolute inset-0 bg-[#E11D48]/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Lock className="w-10 h-10 text-white relative z-10" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-4 border-[#111827]" />
          </div>

          <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Access Token Required</h2>
          <p className="text-gray-400 text-sm mb-10 leading-relaxed px-4">
            Unlock the full potential of CineVerse. Sign in to bookmark favorites, compare movies with AI, and sync your history across devices.
          </p>

          <div className="flex flex-col gap-4">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setOopsModalOpen(false);
                setAuthModalOpen(true);
              }}
              className="w-full py-4 rounded-2xl font-bold bg-[#E11D48] text-white flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(225,29,72,0.3)] transition-all"
            >
              Get Started Now <ArrowRight className="w-4 h-4" />
            </motion.button>
            <button
              onClick={() => setOopsModalOpen(false)}
              className="w-full py-3 rounded-2xl font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all"
            >
              Continue as Guest
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={() => setOopsModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="h-4 h-4 text-gray-500" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
