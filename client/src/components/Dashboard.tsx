import React from 'react';
import { motion } from 'motion/react';
import { Film, Bookmark, Clock, LogOut, User, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import MovieCard from './MovieCard';
import { useStore } from '@/store/useStore';
import type { Movie } from '@/types';

interface DashboardProps {
  onMovieClick: (movie: Movie) => void;
  onClose: () => void;
}

export default function Dashboard({ onMovieClick, onClose }: DashboardProps) {
  const { user, clearAuth, recentlyViewed, bookmarks } = useStore();
  const [activeTab, setActiveTab] = React.useState<'saved' | 'recent'>('saved');

  const { data: savedMovies, isLoading } = useQuery<Movie[]>({
    queryKey: ['bookmarked-movies', bookmarks],
    queryFn: async () => {
      if (!bookmarks.length) return [];
      
      const moviePromises = bookmarks.slice(0, 40).map(async (b) => {
        try {
          const { data } = await api.get(`/movies/detail/${b.id}`, { 
            params: { media_type: b.media_type || 'movie' } 
          });
          return data;
        } catch (err) {
          console.error(`Failed to fetch detail for ${b.id}:`, err);
          return null;
        }
      });

      const results = await Promise.all(moviePromises);
      return results.filter((m): m is Movie => m !== null);
    },
    enabled: bookmarks.length > 0,
    staleTime: 60 * 1000,
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="fixed inset-y-0 right-0 z-[150] w-full sm:w-[480px] overflow-hidden"
      style={{
        background: '#111827',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '-40px 0 80px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-white">{user?.name || 'Guest'}</div>
            <div className="text-xs text-gray-500">{user?.email}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { clearAuth(); onClose(); }}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors text-gray-500 hover:text-white"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors text-gray-500"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 p-5">
        <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-2xl font-black text-white">{bookmarks.length}</div>
          <div className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1">
            <Bookmark className="w-3 h-3 text-[#E11D48]" /> Saved
          </div>
        </div>
        <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-2xl font-black text-white">{recentlyViewed.length}</div>
          <div className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-[#2563EB]" /> Viewed
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-5 mb-4">
        {[
          { id: 'saved' as const, label: 'Saved', icon: Bookmark },
          { id: 'recent' as const, label: 'Recently Viewed', icon: Clock },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === id
                ? 'bg-[#E11D48]/20 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="overflow-y-auto px-5 pb-8 custom-scrollbar" style={{ height: 'calc(100vh - 260px)' }}>
        {activeTab === 'saved' ? (
          isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="aspect-[2/3] rounded-2xl shimmer" />)}
            </div>
          ) : savedMovies && savedMovies.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {savedMovies.map((m, i) => (
                <MovieCard key={m.id} movie={m} onClick={onMovieClick} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-700">
              <Bookmark className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">No saved movies yet</p>
              <p className="text-xs mt-1">Click the bookmark icon on any movie</p>
            </div>
          )
        ) : (
          recentlyViewed.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {recentlyViewed.map((m, i) => (
                <MovieCard key={m.id} movie={m} onClick={onMovieClick} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-700">
              <Clock className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">No recently viewed</p>
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}
