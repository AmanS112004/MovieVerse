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

  // Global Trending
  const { data: trendingGlobal, isLoading: globalLoading } = useQuery<Movie[]>({
    queryKey: ['trending-global'],
    queryFn: async () => {
      const { data } = await api.get('/movies/trending', { params: { time_window: 'week' } });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // India Trending
  const { data: trendingIndia, isLoading: indiaLoading } = useQuery<Movie[]>({
    queryKey: ['trending-india'],
    queryFn: async () => {
      const { data } = await api.get('/movies/trending/india');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const trendingLoading = globalLoading || indiaLoading;

  // Mix Trending (India first, then alternating)
  const mixedTrending = React.useMemo(() => {
    if (!trendingGlobal && !trendingIndia) return [];
    const mixed: Movie[] = [];
    const len = Math.max(trendingGlobal?.length || 0, trendingIndia?.length || 0);

    for (let i = 0; i < len; i++) {
      if (trendingIndia?.[i]) mixed.push(trendingIndia[i]);
      if (trendingGlobal?.[i]) mixed.push(trendingGlobal[i]);
    }

    // Deduplicate by ID
    return Array.from(new Map(mixed.map(m => [m.id, m])).values()).slice(0, 24);
  }, [trendingGlobal, trendingIndia]);


  return (
    <div className="min-h-screen bg-[#0B0F1A] relative">
      {/* Navbar */}
      <Navbar
        onAuthClick={() => setAuthModalOpen(true)}
        onDashboardClick={() => { if (user) setDashboardOpen(true); else setAuthModalOpen(true); }}
        onCompareClick={() => setCompareModalOpen(true)}
        onCategoryClick={(id) => {
          if (id === 'collections') {
            if (user) setDashboardOpen(true);
            else setAuthModalOpen(true);
          } else if (id !== 'discover') {
            const section = document.getElementById('trending-section');
            section?.scrollIntoView({ behavior: 'smooth' });
          }
        }}

      />

      {/* HERO SECTION */}
      <section className="relative h-[300vh] overflow-hidden">

        {/* 🔥 Background Animation */}
        <Suspense fallback={null}>
          <HeroCanvas />
        </Suspense>

        {/* 🔥 Sticky Content */}
        <div className="sticky top-0 h-screen flex flex-col items-center justify-center px-4">

          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none opacity-20"
            style={{ background: 'radial-gradient(circle, #E11D48 0%, transparent 70%)', transform: 'translate(-50%, -50%)' }} />

          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none opacity-10"
            style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)', transform: 'translate(50%, 50%)' }} />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-center max-w-4xl w-full"
          >

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ background: 'rgba(192,88,0,0.08)', border: '1px solid rgba(192,88,0,0.2)' }}>
              <span className="text-xs font-semibold text-[rgba(253,251,212,0.8)]">
                30+ Smart Recommendations
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-black mb-4 tracking-tighter"
              style={{ background: 'linear-gradient(135deg, #E11D48 0%, #2563EB 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CINEVERSE
            </h1>

            {/* Subtitle */}
            <p className="text-sm md:text-xl text-[rgba(253,251,212,0.55)] mb-10 max-w-xs md:max-w-3xl mx-auto">
              Search any movie and discover 30+ similar titles
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto w-full">
              <SearchBar
                placeholder="Search Deadpool, Parasite, Attack on Titan..."
                large
              />
            </div>

          </motion.div>

        </div>
      </section>

      {/* TRENDING SECTION (Mixed Discovery) */}
      <section id="trending-section" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-[#FDFBD4] uppercase tracking-widest flex items-center gap-2">
            Discover what to watch
            <div className="h-px w-12 bg-[#C05800]/40" />
          </h2>
        </div>

        {trendingLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {mixedTrending.map((movie, i) => (
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
