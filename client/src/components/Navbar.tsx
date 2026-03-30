import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Bookmark, Scale, User, Menu, X } from 'lucide-react';
import TextRoll from './ui/text-roll';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onAuthClick: () => void;
  onDashboardClick: () => void;
  onCompareClick: () => void;
  onCategoryClick: (category: string) => void;
}

const navItems = [
  { id: 'trending-in', name: 'Trending (IN)' },
  { id: 'trending-intl', name: 'Trending (Global)' },
  { id: 'collections', name: 'Collections' },
];

export default function Navbar({ onAuthClick, onDashboardClick, onCompareClick, onCategoryClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, compareQueue, bookmarks } = useStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'py-3'
            : 'py-5'
        )}
        style={{
          background: scrolled ? 'rgba(16,25,14,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(172,200,162,0.08)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-2.5 cursor-pointer" 
            whileTap={{ scale: 0.97 }}
            onClick={() => onCategoryClick('discover')}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(172,200,162,0.15)', border: '1px solid rgba(172,200,162,0.2)' }}>
              <Film className="w-4 h-4 text-[#ACC8A2]" />
            </div>
            <span className="font-black text-lg text-[#ACC8A2] tracking-tight">CineVerse</span>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <div 
                key={item.id} 
                className="px-4 py-2 cursor-pointer"
                onClick={() => onCategoryClick(item.id)}
              >
                <TextRoll
                  className="text-sm font-semibold text-[rgba(172,200,162,0.7)] dark:text-[rgba(172,200,162,0.7)] hover:text-[#ACC8A2]"
                  center
                >
                  {item.name}
                </TextRoll>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Compare button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onCompareClick}
              className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all hover:bg-[rgba(172,200,162,0.1)]"
              title="Compare Movies"
            >
              <Scale className="w-4 h-4 text-[rgba(172,200,162,0.7)]" />
              <span className="text-sm font-bold text-[rgba(172,200,162,0.8)] hidden lg:block">Compare</span>
              {compareQueue.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                  style={{ background: '#ACC8A2', color: '#1A2517' }}
                >
                  {compareQueue.length}
                </motion.span>
              )}
            </motion.button>

            {/* Bookmarks */}
            {user && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onDashboardClick}
                className="relative p-2.5 rounded-xl transition-all hover:bg-[rgba(172,200,162,0.1)]"
                title="My Library"
              >
                <Bookmark className="w-4 h-4 text-[rgba(172,200,162,0.7)]" />
                {bookmarks.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                    style={{ background: '#ACC8A2', color: '#1A2517' }}
                  >
                    {bookmarks.length > 9 ? '9+' : bookmarks.length}
                  </motion.span>
                )}
              </motion.button>
            )}

            {/* User / Auth */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={user ? onDashboardClick : onAuthClick}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all',
                user
                  ? 'bg-[rgba(172,200,162,0.1)] text-[#ACC8A2] hover:bg-[rgba(172,200,162,0.15)]'
                  : 'bg-[#ACC8A2] text-[#1A2517] hover:opacity-90'
              )}
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:block">{user ? user.name.split(' ')[0] : 'Sign In'}</span>
            </motion.button>

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(m => !m)}
              className="sm:hidden p-2.5 rounded-xl hover:bg-[rgba(172,200,162,0.1)] transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5 text-[#ACC8A2]" /> : <Menu className="w-5 h-5 text-[#ACC8A2]" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="sm:hidden overflow-hidden"
              style={{ borderTop: '1px solid rgba(172,200,162,0.08)', background: 'rgba(16,25,14,0.95)' }}
            >
              <div className="px-4 py-4 flex flex-col gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { onCategoryClick(item.id); setMobileOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-[rgba(172,200,162,0.7)] hover:bg-[rgba(172,200,162,0.08)] hover:text-[#ACC8A2] transition-all"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
