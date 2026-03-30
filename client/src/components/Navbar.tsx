import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Bookmark, Scale, User, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
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
          background: scrolled ? 'rgba(56,36,13,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(253,251,212,0.08)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-2.5 cursor-pointer" 
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (location.pathname !== '/') {
                navigate('/');
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                onCategoryClick('discover');
              }
            }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(192, 88, 0, 0.15)', border: '1px solid rgba(192, 88, 0, 0.2)' }}>
              <Film className="w-4 h-4 text-[#C05800]" />
            </div>
            <span className="font-black text-lg text-[#FDFBD4] tracking-tight">CineVerse</span>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <div 
                key={item.id} 
                className="px-4 py-2 cursor-pointer"
                onClick={() => {
                  if (location.pathname !== '/') {
                    navigate('/', { state: { scrollTo: 'trending-section' } });
                  } else {
                    onCategoryClick(item.id);
                  }
                }}
              >
                <TextRoll
                  className="text-sm font-semibold text-[rgba(253,251,212,0.7)] dark:text-[rgba(253,251,212,0.7)] hover:text-[#FDFBD4]"
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
              className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all hover:bg-[rgba(253,251,212,0.1)]"
              title="Compare Movies"
            >
              <Scale className="w-4 h-4 text-[rgba(253,251,212,0.7)]" />
              <span className="text-sm font-bold text-[rgba(253,251,212,0.8)] hidden lg:block">Compare</span>
              {compareQueue.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                  style={{ background: '#C05800', color: 'white' }}
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
                className="relative p-2.5 rounded-xl transition-all hover:bg-[rgba(253,251,212,0.1)]"
                title="My Library"
              >
                <Bookmark className="w-4 h-4 text-[rgba(253,251,212,0.7)]" />
                {bookmarks.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                    style={{ background: '#C05800', color: 'white' }}
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
                  ? 'bg-[rgba(253,251,212,0.1)] text-[#FDFBD4] hover:bg-[rgba(253,251,212,0.15)]'
                  : 'bg-[#C05800] text-white hover:opacity-90'
              )}
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:block">{user ? user.name.split(' ')[0] : 'Sign In'}</span>
            </motion.button>

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(m => !m)}
              className="sm:hidden p-2.5 rounded-xl hover:bg-[rgba(253,251,212,0.1)] transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5 text-[#C05800]" /> : <Menu className="w-5 h-5 text-[#C05800]" />}
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
              style={{ borderTop: '1px solid rgba(253,251,212,0.08)', background: 'rgba(56,36,13,0.98)' }}
            >
              <div className="px-4 py-4 flex flex-col gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { onCategoryClick(item.id); setMobileOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-[rgba(253,251,212,0.7)] hover:bg-[rgba(253,251,212,0.08)] hover:text-[#FDFBD4] transition-all"
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
