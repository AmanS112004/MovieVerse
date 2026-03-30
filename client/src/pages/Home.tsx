import React, { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, ChevronDown } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import MovieCard from '@/components/MovieCard';
import Navbar from '@/components/Navbar';
import TextRoll from '@/components/ui/text-roll';
import api from '@/lib/api';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import type { Movie } from '@/types';

// Lazy load heavy modals
const MovieModal = lazy(() => import('@/components/MovieModal'));
const ActorModal = lazy(() => import('@/components/ActorModal'));
const CompareModal = lazy(() => import('@/components/CompareModal'));
const AuthModal = lazy(() => import('@/components/AuthModal'));
const Dashboard = lazy(() => import('@/components/Dashboard'));
const HeroCanvas = lazy(() => import('@/components/HeroCanvas'));
const OopsModal = lazy(() => import('@/components/OopsModal'));

export default function Home() {
  const navigate = useNavigate();
  const { 
    selectedMovie, 
    setSelectedMovie, 
    compareModalOpen, 
    setCompareModalOpen, 
    user, 
    authModalOpen, 
    setAuthModalOpen, 
    oopsModalOpen,
    compareWarning
  } = useStore();

  const [actorId, setActorId] = useState<number | null>(null);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  // Default trending for the landing page (only if not searching)
  const { data: trendingGlobal, isLoading: trendingLoading } = useQuery<Movie[]>({
    queryKey: ['trending-global'],
    queryFn: async () => {
      const { data } = await api.get('/movies/trending', { params: { time_window: 'week' } });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-[#38240D] relative">
      {/* Navbar */}
      <Navbar
        onAuthClick={() => setAuthModalOpen(true)}
        onDashboardClick={() => { if (user) setDashboardOpen(true); else setAuthModalOpen(true); }}
        onCompareClick={() => setCompareModalOpen(true)}
        onCategoryClick={(id) => {
          if (id !== 'discover') {
             const section = document.getElementById('trending-section');
             section?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* HERO SECTION */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden px-4">
        <Suspense fallback={null}>
          <HeroCanvas />
        </Suspense>

        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(192,88,0,0.06) 0%, transparent 70%)', transform: 'translate(-50%, -50%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(253,251,212,0.04) 0%, transparent 70%)', transform: 'translate(50%, 50%)' }} />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 text-center max-w-4xl w-full"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'rgba(192,88,0,0.08)', border: '1px solid rgba(192,88,0,0.2)' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C05800]" />
            <span className="text-xs font-semibold text-[rgba(253,251,212,0.8)] tracking-wide">30+ Smart Recommendations</span>
          </motion.div>

          {/* Main headline using TextRoll */}
          <h1 className="mb-4" style={{ lineHeight: 1 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <TextRoll
                center
                className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-[#C05800] dark:text-[#C05800]"
              >
                CINEVERSE
              </TextRoll>
            </motion.div>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-base sm:text-xl text-[rgba(253,251,212,0.55)] mb-10 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            Search any movie and discover 30+ similar titles —<br className="hidden sm:block" />
            by vibe, theme, audience, and tone.
          </motion.p>

          {/* Search bar - Navigates away on selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <SearchBar
              placeholder="Search Deadpool, Parasite, Attack on Titan..."
              large
            />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown className="w-5 h-5 text-[rgba(253,251,212,0.4)]" />
          </motion.div>
        </motion.div>
      </section>

      {/* TRENDING SECTION (Optional discovery for landing) */}
      <section id="trending-section" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-[#FDFBD4] uppercase tracking-widest flex items-center gap-2">
            Trending Globally
            <div className="h-px w-12 bg-[#C05800]/40" />
          </h2>
        </div>

        {trendingLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {trendingGlobal?.slice(0, 12).map((movie, i) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={(m) => setSelectedMovie(m)}
                index={i}
              />
            ))}
          </div>
        )}
      </section>

      {/* MODALS */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {selectedMovie && (
            <MovieModal
              movie={selectedMovie}
              onClose={() => setSelectedMovie(null)}
              onCastClick={(id) => setActorId(id)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {actorId && (
            <ActorModal
              personId={actorId}
              onClose={() => setActorId(null)}
              onMovieClick={(m) => { setActorId(null); setTimeout(() => setSelectedMovie(m), 100); }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {compareModalOpen && <CompareModal onClose={() => setCompareModalOpen(false)} />}
        </AnimatePresence>

        <AnimatePresence>
          {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
        </AnimatePresence>

        <AnimatePresence>
          {dashboardOpen && user && (
            <Dashboard
              onMovieClick={(m) => { setDashboardOpen(false); setSelectedMovie(m); }}
              onClose={() => setDashboardOpen(false)}
            />
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {oopsModalOpen && <OopsModal />}
        </AnimatePresence>

        {/* Comparison Alert */}
        <AnimatePresence>
          {compareWarning && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 20, x: '-50%' }}
              className="fixed bottom-10 left-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl"
              style={{ 
                background: 'rgba(56,36,13,0.98)', 
                borderColor: 'rgba(192,88,0,0.4)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
            >
              <div className="w-2 h-2 rounded-full bg-[#C05800] animate-pulse" />
              <span className="text-sm font-bold text-[#C05800] whitespace-nowrap">{compareWarning}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}
