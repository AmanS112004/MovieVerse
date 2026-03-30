import React from 'react';
import { motion } from 'motion/react';
import { Bookmark, BookmarkCheck, Plus, Star } from 'lucide-react';
import { getPosterUrl, formatDate, cn, truncate } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { Movie } from '@/types';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  index?: number;
}

export default function MovieCard({ movie, onClick, index = 0 }: MovieCardProps) {
  const { isBookmarked, toggleBookmark, addToCompare, compareQueue, user, setOopsModalOpen } = useStore();
  const bookmarked = isBookmarked(movie.id);
  const inCompare = compareQueue.some(m => m.id === movie.id);

  const title = movie.title || movie.name || 'Unknown';
  const year = formatDate(movie.release_date || movie.first_air_date);
  const rating = movie.vote_average;
  const isTV = movie.media_type === 'tv';

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setOopsModalOpen(true);
      return;
    }
    toggleBookmark(movie.id, movie.media_type || 'movie');
  };

  const handleAddToCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setOopsModalOpen(true);
      return;
    }
    addToCompare(movie);
  };

  return (
    <div 
      className="group relative"
      style={{ perspective: '1000px' }}
    >
      {/* 1. Main Clickable Card Area */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        onClick={() => onClick(movie)}
        className="cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <motion.div
          whileHover={{ rotateY: 5, rotateX: -3, scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative rounded-2xl overflow-hidden"
          style={{ background: 'rgba(56,36,13,0.9)', transformStyle: 'preserve-3d' }}
        >
          {/* Poster */}
          <div className="aspect-[2/3] relative overflow-hidden bg-[rgba(253,251,212,0.05)]">
            {movie.poster_path ? (
              <img
                src={getPosterUrl(movie.poster_path)}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[rgba(253,251,212,0.3)]">
                <span className="text-4xl">🎬</span>
                <span className="text-xs text-center px-3">{truncate(title, 30)}</span>
              </div>
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 overlay-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Rating badge */}
            <div className="absolute top-2 left-2 z-10">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md"
                style={{ background: 'rgba(56,36,13,0.85)', border: '1px solid rgba(253,251,212,0.2)' }}>
                <Star className="w-3 h-3 fill-[#C05800] text-[#C05800]" />
                <span className="text-xs font-bold text-[#FDFBD4]">{rating > 0 ? rating.toFixed(1) : 'N/A'}</span>
              </div>
            </div>

            {/* Media type badge */}
            {isTV && (
              <div className="absolute top-2 right-2 px-2 py-1 rounded-lg backdrop-blur-md text-xs font-semibold z-10"
                style={{ background: 'rgba(192,88,0,0.2)', border: '1px solid rgba(192,88,0,0.3)', color: '#FDFBD4' }}>
                TV
              </div>
            )}

            {/* Similarity Score Badge */}
            {movie.similarity_score !== undefined && (
              <div className="absolute bottom-2 right-2 z-10">
                <div className="px-2 py-1 rounded-lg backdrop-blur-md border border-[#FDFBD4]/30 bg-[#38240D]/80"
                  style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                  <span className="text-[10px] font-black text-[#FDFBD4]">
                    {movie.similarity_score}% MATCH
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="p-3">
            <h3 className="font-bold text-[#FDFBD4] text-sm leading-tight line-clamp-2 mb-1">{title}</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[rgba(253,251,212,0.5)] font-medium">{year}</span>
              {movie.genre_ids && movie.genre_ids.length > 0 && (
                <span className="text-xs text-[rgba(253,251,212,0.4)]">
                  {movie.genre_ids.slice(0, 2).map(id => {
                    const genres: Record<number, string> = { 28: 'Action', 35: 'Comedy', 18: 'Drama', 27: 'Horror', 53: 'Thriller', 16: 'Animation', 80: 'Crime', 10749: 'Romance', 878: 'Sci-Fi', 14: 'Fantasy' };
                    return genres[id];
                  }).filter(Boolean).join(' • ')}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* 2. Action Buttons - SIBLING to clickable area, so they don't trigger its onClick */}
      <div className="absolute top-2/3 left-0 right-0 p-3 flex gap-2 translate-y-full group-hover:translate-y-[-40px] opacity-0 group-hover:opacity-100 transition-all duration-300 z-[60] pointer-events-none">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleBookmark}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-2xl pointer-events-auto',
            bookmarked
              ? 'bg-[#C05800] text-white'
              : 'bg-[rgba(26,15,5,0.95)] text-[#FDFBD4] border border-[rgba(253,251,212,0.2)] hover:bg-[rgba(253,251,212,0.1)]'
          )}
        >
          {bookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          {bookmarked ? 'Saved' : 'Save'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleAddToCompare}
          className={cn(
            'flex items-center justify-center p-2.5 rounded-xl text-xs font-semibold transition-all shadow-2xl pointer-events-auto',
            inCompare
              ? 'bg-[rgba(192,88,0,0.4)] text-[#FDFBD4]'
              : 'bg-[rgba(26,15,5,0.95)] text-[rgba(253,251,212,0.7)] border border-[rgba(253,251,212,0.2)] hover:bg-[rgba(253,251,212,0.1)]'
          )}
          title={inCompare ? 'Added to compare' : 'Add to compare'}
        >
          <Plus className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* Floating glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: '0 0 40px rgba(192,88,0,0.15)', zIndex: -1 }} />
    </div>
  );
}
