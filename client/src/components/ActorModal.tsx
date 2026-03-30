import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Film, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { getPosterUrl, formatDate, cn } from '@/lib/utils';
import type { Person, Movie } from '@/types';

interface ActorModalProps {
  personId: number;
  onClose: () => void;
  onMovieClick: (movie: Movie) => void;
}

export default function ActorModal({ personId, onClose, onMovieClick }: ActorModalProps) {
  const { data: person, isLoading } = useQuery<Person>({
    queryKey: ['person', personId],
    queryFn: async () => {
      const { data } = await api.get(`/movies/person/${personId}`);
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        style={{ background: 'rgba(5,10,4,0.9)', backdropFilter: 'blur(12px)' }}
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-t-3xl sm:rounded-3xl"
          style={{
            background: '#0e1a0c',
            border: '1px solid rgba(172,200,162,0.12)',
            boxShadow: '0 40px 120px rgba(0,0,0,0.9)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[rgba(172,200,162,0.08)]">
            <h2 className="font-bold text-lg text-[#ACC8A2]">
              {isLoading ? 'Loading...' : person?.name}
            </h2>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
              className="p-2 rounded-full hover:bg-[rgba(172,200,162,0.1)] transition-colors">
              <X className="w-5 h-5 text-[#ACC8A2]" />
            </motion.button>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 70px)' }}>
            {isLoading ? (
              <div className="p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="w-24 h-32 rounded-xl shimmer" />
                  <div className="flex-1 space-y-2">
                    {[1,2,3].map(i => <div key={i} className="h-4 rounded shimmer" />)}
                  </div>
                </div>
              </div>
            ) : person ? (
              <div className="p-5">
                {/* Person info */}
                <div className="flex gap-5 mb-6">
                  <div className="w-24 h-32 rounded-xl overflow-hidden border border-[rgba(172,200,162,0.15)] flex-shrink-0">
                    {person.profile_path ? (
                      <img src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} alt={person.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl bg-[rgba(172,200,162,0.05)]">👤</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-[#ACC8A2] mb-2">{person.name}</h3>
                    <div className="space-y-1.5 text-sm">
                      {person.known_for_department && (
                        <div className="text-[rgba(172,200,162,0.6)]">
                          <span className="text-[rgba(172,200,162,0.4)]">Known for:</span> {person.known_for_department}
                        </div>
                      )}
                      {person.birthday && (
                        <div className="text-[rgba(172,200,162,0.6)]">
                          <span className="text-[rgba(172,200,162,0.4)]">Born:</span> {new Date(person.birthday).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      )}
                      {person.place_of_birth && (
                        <div className="text-[rgba(172,200,162,0.6)]">
                          <span className="text-[rgba(172,200,162,0.4)]">From:</span> {person.place_of_birth}
                        </div>
                      )}
                    </div>
                    {person.biography && (
                      <p className="text-xs text-[rgba(172,200,162,0.5)] mt-3 leading-relaxed line-clamp-3">{person.biography}</p>
                    )}
                  </div>
                </div>

                {/* Known for movies */}
                {person.topMovies && person.topMovies.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-[rgba(172,200,162,0.5)] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Film className="w-4 h-4" />
                      Known For
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {person.topMovies.slice(0, 12).map((film) => (
                        <motion.div
                          key={film.id}
                          whileHover={{ scale: 1.04, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => { onMovieClick(film); }}
                          className="cursor-pointer group"
                        >
                          <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-[rgba(172,200,162,0.05)] border border-[rgba(172,200,162,0.1)] group-hover:border-[rgba(172,200,162,0.3)] transition-all">
                            {film.poster_path ? (
                              <img src={getPosterUrl(film.poster_path, 'w185')} alt={film.title || film.name || ''} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-[rgba(172,200,162,0.8)] line-clamp-2 leading-tight">
                            {film.title || film.name}
                          </p>
                          <p className="text-xs text-[rgba(172,200,162,0.4)] mt-0.5">
                            {formatDate(film.release_date || film.first_air_date)}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-[rgba(172,200,162,0.4)]">Failed to load person data</div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
