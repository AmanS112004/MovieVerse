import React, { useState, Suspense, lazy, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import MovieCard from '@/components/MovieCard';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useStore } from '@/store/useStore';
import { getBackdropUrl } from '@/lib/utils';
import type { Movie } from '@/types';

// Lazy load modals
const MovieModal = lazy(() => import('@/components/MovieModal'));
const ActorModal = lazy(() => import('@/components/ActorModal'));
const CompareModal = lazy(() => import('@/components/CompareModal'));
const AuthModal = lazy(() => import('@/components/AuthModal'));
const Dashboard = lazy(() => import('@/components/Dashboard'));
const OopsModal = lazy(() => import('@/components/OopsModal'));

export default function MoviesLikePage() {
  const { movieId } = useParams<{ movieId: string }>();
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

  // Scroll to top on ID change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [movieId]);

  // Source movie details for the banner
  const { data: sourceMovie, isLoading: loadingSource } = useQuery<Movie>({
    queryKey: ['movie-detail', movieId],
    queryFn: async () => {
      const { data } = await api.get(`/movies/detail/${movieId}`);
      return data;
    },
    enabled: !!movieId,
  });

  // Recommendations
  const { data: recommendations, isLoading: loadingRecs } = useQuery<Movie[]>({
    queryKey: ['recommendations', movieId],
    queryFn: async () => {
      const { data } = await api.get(`/movies/recommend/${movieId}`);
      return data;
    },
    enabled: !!movieId,
    staleTime: 10 * 60 * 1000,
  });

  if (loadingSource && !sourceMovie) {
    return (
      <div className="min-h-screen bg-[#38240D] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#C05800] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#38240D] relative">
      <Navbar
        onAuthClick={() => setAuthModalOpen(true)}
        onDashboardClick={() => { if (user) setDashboardOpen(true); else setAuthModalOpen(true); }}
        onCompareClick={() => setCompareModalOpen(true)}
        onCategoryClick={(id) => id === 'discover' && navigate('/')}
      />

      {/* Cinematic Banner */}
      <section className="relative h-[60vh] sm:h-[70vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={getBackdropUrl(sourceMovie?.backdrop_path || '')} 
            alt={sourceMovie?.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#38240D] via-[#38240D]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#38240D]/80 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-12 w-full">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[rgba(253,251,212,0.6)] hover:text-[#FDFBD4] transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-bold uppercase tracking-wider">Back to Search</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 bg-[#C05800]/10 border border-[#C05800]/20">
              <Sparkles className="w-3 h-3 text-[#C05800]" />
              <span className="text-[10px] font-black text-[#C05800] uppercase tracking-widest">AI Recommendation Engine</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-[#FDFBD4] mb-4 tracking-tighter leading-none">
              Because you liked <span className="text-[#C05800] italic">"{sourceMovie?.title || sourceMovie?.name}"</span>
            </h1>
            <p className="text-lg text-[rgba(253,251,212,0.6)] max-w-2xl font-medium line-clamp-2">
              {sourceMovie?.overview}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search Overlay (Compact) */}
      <div className="sticky top-0 z-[100] transform -translate-y-1/2 max-w-3xl mx-auto px-4">
        <SearchBar placeholder="Search another movie to get recommendations..." />
      </div>

      {/* Recommendations Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 -mt-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-[#FDFBD4] uppercase tracking-widest flex items-center gap-2">
            Recommended for you
            <div className="h-px w-12 bg-[#C05800]/40" />
          </h2>
          <div className="text-xs font-bold text-[rgba(253,251,212,0.4)]">
            {recommendations?.length || 0} TITLES FOUND
          </div>
        </div>

        {loadingRecs ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl shimmer" />
            ))}
          </div>
        ) : recommendations && recommendations.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {recommendations.map((movie: Movie, i: number) => (
              <MovieCard
                key={`${movie.id}-${i}`}
                movie={movie}
                onClick={(m) => setSelectedMovie(m)}
                index={i}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-[rgba(253,251,212,0.4)]">
            <p className="text-lg font-bold">No recommendations found</p>
            <p className="text-sm">We couldn't find similar titles for this one.</p>
          </div>
        )}
      </section>

      {/* Modals - Same logic as Home.tsx to avoid redirection on close */}
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
              onMovieClick={(movie) => {
                setActorId(null);
                setTimeout(() => setSelectedMovie(movie), 100);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {compareModalOpen && (
            <CompareModal onClose={() => setCompareModalOpen(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {authModalOpen && (
            <AuthModal onClose={() => setAuthModalOpen(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {dashboardOpen && user && (
            <Dashboard
              onMovieClick={(movie) => { setDashboardOpen(false); setSelectedMovie(movie); }}
              onClose={() => setDashboardOpen(false)}
            />
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {oopsModalOpen && <OopsModal />}
        </AnimatePresence>

        {/* Global Notifications */}
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
