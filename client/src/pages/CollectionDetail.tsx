import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Trash2, Calendar, Film, Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import MovieCard from '@/components/MovieCard';
import { useStore } from '@/store/useStore';
import api from '@/lib/api';
import type { Collection, Movie } from '@/types';

const MovieModal = lazy(() => import('@/components/MovieModal'));

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { collections, removeMovieFromCollection, deleteCollection, user, setAuthModalOpen, setSelectedMovie, selectedMovie } = useStore();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAuthModalOpen(true);
      navigate('/');
      return;
    }

    const fetchDetail = async () => {
      try {
        const { data } = await api.get(`/collections/${id}`);
        setCollection(data);
      } catch (err) {
        console.error('Failed to fetch collection', err);
        navigate('/collections');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, user]);

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this collection?')) {
      await deleteCollection(id);
      navigate('/collections');
    }
  };

  const handleRemoveMovie = async (movieId: number) => {
    if (!id) return;
    await removeMovieFromCollection(id, movieId);
    // Optimistic update local state
    setCollection(prev => {
      if (!prev) return null;
      return {
        ...prev,
        movies: prev.movies.filter(m => m.movieId !== movieId)
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#38240D] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#C05800] animate-spin" />
      </div>
    );
  }

  if (!collection) return null;

  return (
    <div className="min-h-screen bg-[#38240D] relative overflow-x-hidden">
      <Navbar
        onAuthClick={() => setAuthModalOpen(true)}
        onDashboardClick={() => navigate('/collections')}
        onCompareClick={() => {}}
        onCategoryClick={(cat) => cat === 'discover' && navigate('/')}
      />

      <main className="pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <header className="mb-12">
          <button
            onClick={() => navigate('/collections')}
            className="flex items-center gap-2 text-[rgba(253,251,212,0.4)] hover:text-[#FDFBD4] transition-colors mb-6 group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-black uppercase tracking-widest">Back to Collections</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex-1">
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-6xl font-black text-[#FDFBD4] tracking-tighter mb-4"
              >
                {collection.name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-[rgba(253,251,212,0.6)] font-medium max-w-3xl"
              >
                {collection.description || 'No description provided.'}
              </motion.p>
            </div>

            <button
              onClick={handleDelete}
              className="px-6 py-3 rounded-2xl bg-red-600/10 border border-red-600/20 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-600/20 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Collection
            </button>
          </div>

          <div className="flex items-center gap-6 mt-8 text-[10px] font-black uppercase tracking-widest text-[rgba(253,251,212,0.4)]">
             <span className="flex items-center gap-1.5">
               <Film className="w-3.5 h-3.5" />
               {collection.movies.length} TITLES
             </span>
             <span className="flex items-center gap-1.5">
               <Calendar className="w-3.5 h-3.5" />
                CREATED {new Date(collection.createdAt).toLocaleDateString()}
             </span>
          </div>
        </header>

        {collection.movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[rgba(253,251,212,0.03)] flex items-center justify-center mb-4">
               <Film className="w-6 h-6 text-[rgba(253,251,212,0.1)]" />
            </div>
            <p className="text-[rgba(253,251,212,0.3)] font-black uppercase tracking-widest text-sm">
              This list is currently empty
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 text-[#C05800] font-black uppercase text-[10px] tracking-widest hover:underline"
            >
              Browse movies to add
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {collection.movies.map((m, idx) => (
              <div key={m.movieId} className="relative group">
                <MovieCard 
                  movie={{
                    id: m.movieId,
                    title: m.title,
                    poster_path: m.poster_path,
                    media_type: m.media_type as any,
                    vote_average: 0,
                    vote_count: 0,
                    popularity: 0,
                    overview: ''
                  }}
                  onClick={(movie) => setSelectedMovie(movie as Movie)}
                  index={idx}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveMovie(m.movieId); }}
                  className="absolute -top-2 -right-2 p-2 rounded-full bg-red-600 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all z-50 hover:scale-110"
                  title="Remove from list"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <Suspense fallback={null}>
        <AnimatePresence>
          {selectedMovie && (
            <MovieModal
              movie={selectedMovie}
              onClose={() => setSelectedMovie(null)}
              onCastClick={() => {}}
            />
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}
