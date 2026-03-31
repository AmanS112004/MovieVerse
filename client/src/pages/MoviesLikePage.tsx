import React, { useState, Suspense, lazy, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, ArrowLeft, Loader2, Play, X, ListPlus } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import MovieCard from '@/components/MovieCard';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useStore } from '@/store/useStore';
import { getBackdropUrl, cn } from '@/lib/utils';
import type { Movie } from '@/types';
import AddMovieToCollection from '@/components/AddMovieToCollection';
import CreateCollectionModal from '@/components/CreateCollectionModal';

// Lazy load modals to optimize bundle
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
    setOopsModalOpen,
    createCollectionModalOpen,
    setCreateCollectionModalOpen,
    compareWarning
  } = useStore();

  const [actorId, setActorId] = useState<number | null>(null);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showCollections, setShowCollections] = useState(false);

  // Auto-scroll on movie change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [movieId]);

  // Fetch current movie details
  const { data: sourceMovie, isLoading: loadingSource, error: sourceError } = useQuery<Movie>({
    queryKey: ['movie-detail', movieId],
    queryFn: async () => {
      const { data } = await api.get(`/movies/detail/${movieId}`);
      return data;
    },
    enabled: !!movieId,
  });

  // Fetch recommendations
  const { data: recommendations, isLoading: loadingRecs } = useQuery<Movie[]>({
    queryKey: ['recommendations', movieId],
    queryFn: async () => {
      const { data } = await api.get(`/movies/recommend/${movieId}`);
      return data;
    },
    enabled: !!movieId,
    staleTime: 10 * 60 * 1000,
  });

  // Error state for main movie
  if (sourceError) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mb-6">
          <X className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">Movie not found</h2>
        <p className="text-gray-400 mb-8">We couldn't load details for this title. It might have been removed or doesn't exist.</p>
        <button onClick={() => navigate('/')} className="text-[#E11D48] font-black uppercase text-sm tracking-[0.2em] hover:underline">Return to safety</button>
      </div>
    );
  }

  // Loading state
  if (loadingSource && !sourceMovie) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Loader2 className="w-10 h-10 text-[#E11D48]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] relative overflow-x-hidden">
      <Navbar
        onAuthClick={() => setAuthModalOpen(true)}
        onDashboardClick={() => { if (user) setDashboardOpen(true); else setAuthModalOpen(true); }}
        onCompareClick={() => setCompareModalOpen(true)}
        onCategoryClick={(id) => id === 'discover' && navigate('/')}
      />

      {/* Cinematic Banner */}
      <section className="relative h-[60vh] sm:h-[70vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={getBackdropUrl(sourceMovie?.backdrop_path || '')}
            alt={sourceMovie?.title || 'Backdrop'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F1A]/80 via-transparent to-transparent" />
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

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 bg-[#E11D48]/10 border border-[#E11D48]/20">
                <Sparkles className="w-3 h-3 text-[#E11D48]" />
                <span className="text-[10px] font-black text-[#E11D48] uppercase tracking-widest">AI Recommendation Engine</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-white mb-4 tracking-tighter leading-none">
                Because you liked <span className="text-[#E11D48] italic">"{sourceMovie?.title || sourceMovie?.name || 'this movie'}"</span>
              </h1>
              <p className="text-lg text-gray-400 max-w-2xl font-medium line-clamp-2">
                {sourceMovie?.overview}
              </p>
            </motion.div>

            <div className="flex flex-wrap items-center gap-4 relative">
              <AnimatePresence>
                {showCollections && sourceMovie && (
                  <div className="z-[120]" onClick={(e) => e.stopPropagation()}>
                    <AddMovieToCollection
                      movie={sourceMovie}
                      onClose={() => setShowCollections(false)}
                      onCreateNewCollection={() => setCreateCollectionModalOpen(true)}
                    />
                  </div>
                )}
              </AnimatePresence>

              {sourceMovie?.trailer ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTrailer(true)}
                  className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-white text-lg shadow-2xl transition-all"
                  style={{ background: '#E11D48', boxShadow: '0 20px 40px rgba(225,29,72,0.3)' }}
                >
                  <Play className="w-6 h-6 fill-current" />
                  Play Trailer
                </motion.button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-[rgba(253,251,212,0.4)] text-xs font-bold uppercase tracking-widest">
                  No Trailer Available
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!user) setAuthModalOpen(true);
                  else setShowCollections(!showCollections);
                }}
                className={cn(
                  "flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-lg shadow-2xl transition-all border",
                  showCollections 
                    ? "bg-[#E11D48] border-[#E11D48] text-white" 
                    : "bg-[#111827]/80 border-white/10 text-white hover:bg-white/10"
                )}
              >
                <ListPlus className="w-6 h-6" />
                Add to List
              </motion.button>
            </div>
          </div>
        </div>

        {/* Trailer Overlay */}
        <AnimatePresence>
          {showTrailer && sourceMovie?.trailer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black flex flex-col"
            >
              <div className="flex items-center justify-between p-4 bg-black/40 backdrop-blur-md">
                <span className="text-[#FDFBD4] font-black uppercase tracking-widest text-sm truncate">
                  Trailer: {sourceMovie.title || sourceMovie.name}
                </span>
                <button 
                  onClick={() => setShowTrailer(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <iframe
                src={`https://www.youtube.com/embed/${sourceMovie.trailer.key}?autoplay=1&rel=0`}
                className="flex-1 w-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Trailer"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Search Overlay */}
      <div className="sticky top-0 z-[100] transform -translate-y-1/2 max-w-3xl mx-auto px-4">
        <SearchBar placeholder="Search another movie for relative recommendations..." />
      </div>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 mt-12">
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
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {recommendations?.map((movie: Movie, i: number) => (
              <MovieCard
                key={`${movie.id}-${i}`}
                movie={movie}
                onClick={(m) => setSelectedMovie(m)}
                index={i}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
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

        <AnimatePresence>
          {createCollectionModalOpen && (
            <CreateCollectionModal onClose={() => setCreateCollectionModalOpen(false)} />
          )}
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
                background: 'rgba(11,15,26,0.98)',
                borderColor: 'rgba(225,29,72,0.4)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
            >
              <div className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse" />
              <span className="text-sm font-bold text-[#E11D48] whitespace-nowrap">{compareWarning}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}
