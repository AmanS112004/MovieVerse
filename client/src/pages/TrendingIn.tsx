import React, { useState, Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import MovieCard from '@/components/MovieCard';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import type { Movie } from '@/types';

const MovieModal = lazy(() => import('@/components/MovieModal'));
const ActorModal = lazy(() => import('@/components/ActorModal'));
const CompareModal = lazy(() => import('@/components/CompareModal'));
const AuthModal = lazy(() => import('@/components/AuthModal'));
const Dashboard = lazy(() => import('@/components/Dashboard'));

export default function TrendingIn() {
  const { 
    selectedMovie, setSelectedMovie, 
    compareModalOpen, setCompareModalOpen, 
    user, authModalOpen, setAuthModalOpen 
  } = useStore();
  
  const [actorId, setActorId] = useState<number | null>(null);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const { data: trending, isLoading } = useQuery<Movie[]>({
    queryKey: ['trending-india'],
    queryFn: async () => {
      const { data } = await api.get('/movies/trending/india');
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-[#0B0F1A] relative">
      <Navbar
        onAuthClick={() => setAuthModalOpen(true)}
        onDashboardClick={() => { if (user) setDashboardOpen(true); else setAuthModalOpen(true); }}
        onCompareClick={() => setCompareModalOpen(true)}
        onCategoryClick={() => {}} // Not needed on this page
      />

      <div className="pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <header className="mb-8 sm:mb-12">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl sm:text-6xl font-black text-white tracking-tighter"
          >
            Trending in <span className="text-[#E11D48] italic">India</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[rgba(253,251,212,0.5)] font-bold mt-2 sm:mt-4 tracking-widest uppercase text-[10px] sm:text-xs"
          >
            Regional Blockbusters & Local Favorites
          </motion.p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {trending?.map((movie, i) => (
              <MovieCard 
                key={movie.id} 
                movie={movie} 
                onClick={(m) => setSelectedMovie(m)}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

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
              onMovieClick={(movie) => { setActorId(null); setSelectedMovie(movie); }}
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
              onMovieClick={(movie) => { setDashboardOpen(false); setSelectedMovie(movie); }}
              onClose={() => setDashboardOpen(false)}
            />
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}
