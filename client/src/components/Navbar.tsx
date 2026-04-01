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
          background: scrolled ? 'rgba(17,24,39,0.7)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(249,250,251,0.05)' : 'none',
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
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(225,29,72,0.3)]"
              style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.3)' }}>
              <Film className="w-4 h-4 text-[#E11D48]" />
            </div>
            <span className="font-black text-lg text-white tracking-tight uppercase">CineVerse</span>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <div
                key={item.id}
                className="px-4 py-2 cursor-pointer"
                onClick={() => {
                  if (item.id === 'trending-in') navigate('/trending-in');
                  else if (item.id === 'trending-intl') navigate('/trending-global');
                  else if (item.id === 'collections') {
                    if (user) navigate('/collections');
                    else onAuthClick();
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

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Compare button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onCompareClick}
              className="relative flex items-center gap-2 p-2 sm:px-3 sm:py-2.5 rounded-xl transition-all hover:bg-[rgba(253,251,212,0.1)]"
              title="Compare Movies"
            >
              <Scale className="w-5 h-5 sm:w-4 sm:h-4 text-[rgba(253,251,212,0.7)]" />
              <span className="text-sm font-bold text-[rgba(253,251,212,0.8)] hidden lg:block">Compare</span>
              {compareQueue.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shadow-lg"
                  style={{ background: '#E11D48', color: 'white' }}
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
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shadow-lg"
                    style={{ background: '#E11D48', color: 'white' }}
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
                'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all',
                user
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-[#E11D48] text-white hover:bg-[#F43F5E] shadow-[0_0_20px_rgba(225,29,72,0.4)]'
              )}
            >
              <User className="w-4 h-4" />
              <span className="hidden xs:block">{user ? user.name.split(' ')[0] : 'Sign In'}</span>
            </motion.button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen(m => !m)}
              className="sm:hidden p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="relative w-5 h-5 flex flex-col justify-center gap-1.5 overflow-hidden">
                 <motion.span animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 6.5 : 0 }} className="w-5 h-0.5 bg-[#E11D48] rounded-full" />
                 <motion.span animate={{ x: mobileOpen ? 40 : 0 }} className="w-5 h-0.5 bg-[#E11D48] rounded-full" />
                 <motion.span animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -6.5 : 0 }} className="w-5 h-0.5 bg-[#E11D48] rounded-full" />
              </div>
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
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#111827' }}
            >
              <div className="px-4 py-4 flex flex-col gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { 
                      if (item.id === 'trending-in') navigate('/trending-in');
                      else if (item.id === 'trending-intl') navigate('/trending-global');
                      else if (item.id === 'collections') {
                        if (user) navigate('/collections');
                        else onAuthClick();
                      } else {
                        onCategoryClick(item.id); 
                      }
                      setMobileOpen(false); 
                    }}
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
