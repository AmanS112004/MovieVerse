import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { getPosterUrl, getBackdropUrl, debounce } from '@/lib/utils';
import type { Movie } from '@/types';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSelectMovie?: (movie: Movie) => void;
  placeholder?: string;
  large?: boolean;
}

export default function SearchBar({ onSelectMovie, placeholder = 'Search movies, shows, anime...', large = false }: SearchBarProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateDebounced = useCallback(
    debounce((...args: unknown[]) => {
      const val = args[0];
      if (typeof val === 'string') {
        setDebouncedQuery(val);
      }
    }, 300),
    []
  );

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return null;
      const { data } = await api.get('/movies/search', { params: { q: debouncedQuery } });
      return data.results?.slice(0, 8) as Movie[];
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  const { data: trending } = useQuery({
    queryKey: ['trending-suggestions'],
    queryFn: async () => {
      const { data } = await api.get('/movies/trending');
      return data.slice(0, 6) as Movie[];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    updateDebounced(query);
  }, [query, updateDebounced]);

  const suggestions = debouncedQuery.length >= 2 ? (searchResults || []) : (isFocused ? (trending || []) : []);
  const showDropdown = isFocused && (suggestions.length > 0 || isSearching);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex]);
      }
    }
    if (e.key === 'Escape') setIsFocused(false);
  };

  const handleSelect = (movie: Movie) => {
    setQuery(movie.title || movie.name || '');
    setIsFocused(false);
    setActiveIndex(-1);
    if (onSelectMovie) onSelectMovie(movie);
    navigate(`/movies-like/${movie.id}`);
  };

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          !inputRef.current?.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isShowingTrending = !debouncedQuery || debouncedQuery.length < 2;

  return (
    <div className="relative w-full" style={{ zIndex: 50 }}>
      {/* Input */}
      <motion.div
        animate={{ boxShadow: isFocused ? '0 0 40px rgba(192,88,0,0.25)' : '0 0 0px rgba(192,88,0,0)' }}
        className={cn(
          'flex items-center gap-3 px-5 rounded-2xl border transition-all',
          'bg-[rgba(56,36,13,0.8)] backdrop-blur-xl',
          'border-[rgba(253,251,212,0.1)]',
          isFocused && 'border-[rgba(192,88,0,0.5)]',
          large ? 'py-5' : 'py-3'
        )}
      >
        <Search className={cn('text-[#FDFBD4] opacity-70 flex-shrink-0', large ? 'w-6 h-6' : 'w-5 h-5')} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'flex-1 bg-transparent outline-none text-[#FDFBD4] font-medium',
            'placeholder:text-[rgba(253,251,212,0.4)]',
            large ? 'text-xl' : 'text-base'
          )}
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-[rgba(253,251,212,0.1)] transition-colors"
            >
              <X className="w-4 h-4 text-[rgba(253,251,212,0.6)]" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full mt-3 left-0 right-0 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(56, 36, 13, 0.98)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(253,251,212,0.1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(253,251,212,0.05)',
              zIndex: 100,
            }}
          >
            {isShowingTrending && (
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(253,251,212,0.08)]">
                <TrendingUp className="w-4 h-4 text-[#C05800] opacity-60" />
                <span className="text-xs font-semibold text-[rgba(253,251,212,0.5)] uppercase tracking-wider">Trending Now</span>
              </div>
            )}
            {isSearching ? (
              <div className="p-4 space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-3 p-2 rounded-xl shimmer h-16" />
                ))}
              </div>
            ) : (
              <div className="py-2 max-h-96 overflow-y-auto">
                {suggestions.map((movie, idx) => {
                  const poster = getPosterUrl(movie.poster_path, 'w92');
                  const title = movie.title || movie.name || 'Unknown';
                  const year = movie.release_date?.slice(0, 4) || movie.first_air_date?.slice(0, 4) || '';
                  const type = movie.media_type === 'tv' ? 'TV' : 'Film';
                  return (
                    <motion.div
                      key={movie.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => handleSelect(movie)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all',
                        activeIndex === idx ? 'bg-[rgba(192,88,0,0.12)]' : 'hover:bg-[rgba(192,88,0,0.06)]'
                      )}
                    >
                      <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[rgba(253,251,212,0.1)]">
                        {movie.backdrop_path ? (
                          <img 
                            src={getBackdropUrl(movie.backdrop_path)} 
                            alt={title} 
                            className="w-full h-full object-cover"
                            loading="lazy" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[rgba(253,251,212,0.3)]">🎬</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#FDFBD4] text-sm truncate">{title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {year && <span className="text-xs text-[rgba(253,251,212,0.5)]">{year}</span>}
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[rgba(253,251,212,0.1)] text-[rgba(253,251,212,0.6)] font-medium">{type}</span>
                          {movie.vote_average > 0 && (
                            <span className="text-xs text-[rgba(253,251,212,0.6)]">⭐ {movie.vote_average.toFixed(1)}</span>
                          )}
                        </div>
                      </div>
                      {activeIndex === idx && (
                        <span className="text-xs text-[rgba(253,251,212,0.4)]">↵</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
