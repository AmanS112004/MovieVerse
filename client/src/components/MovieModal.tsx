import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Clock, Calendar, Play, Bookmark, BookmarkCheck, Globe, ChevronDown, ExternalLink, Award, Users, Sparkles, ListPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import VibeChart from './VibeChart';
import { getPosterUrl, getBackdropUrl, formatRuntime, formatFullDate, cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { Movie, MovieDetail, CastMember } from '@/types';
import AddMovieToCollection from './AddMovieToCollection';

interface MovieModalProps {
  movie: Movie;
  onClose: () => void;
  onCastClick: (personId: number) => void;
}

const OTT_LOGO = 'https://image.tmdb.org/t/p/original';
const REGIONS = [
  { code: 'IN', label: '🇮🇳 India' },
  { code: 'US', label: '🌍 USA' },
  { code: 'GB', label: '🇬🇧 UK' },
  { code: 'JP', label: '🇯🇵 Japan' },
  { code: 'KR', label: '🇰🇷 Korea' },
];

export default function MovieModal({ movie, onClose, onCastClick }: MovieModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'cast' | 'streaming' | 'vibe' | 'reviews'>('overview');
  const [watchRegion, setWatchRegion] = useState('IN');
  const [showTrailer, setShowTrailer] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const { 
    isBookmarked, toggleBookmark, addToRecent, 
    user, setOopsModalOpen, setAuthModalOpen, setCreateCollectionModalOpen 
  } = useStore();

  const mediaType = movie.media_type || 'movie';

  const { data: detail, isLoading } = useQuery<MovieDetail>({
    queryKey: ['movie-detail', movie.id, mediaType],
    queryFn: async () => {
      const { data } = await api.get(`/movies/detail/${movie.id}`, { params: { media_type: mediaType } });
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch Enhanced Streaming Data (RapidAPI)
  const { data: rapidStreaming } = useQuery({
    queryKey: ['streaming-rapid', movie.id, watchRegion],
    queryFn: async () => {
      const { data } = await api.get(`/movies/streaming/${movie.id}`, { 
        params: { media_type: mediaType, country: watchRegion.toLowerCase() } 
      });
      return data?.result;
    },
    enabled: !!detail && activeTab === 'streaming',
    staleTime: 30 * 60 * 1000,
  });

  // Fetch User Reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', movie.id, mediaType],
    queryFn: async () => {
      const { data } = await api.get(`/movies/reviews/${movie.id}`, { params: { media_type: mediaType } });
      return data;
    },
    enabled: activeTab === 'reviews',
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    addToRecent(movie);
    // Sync with backend history
    if (user) {
      api.post('/bookmarks/history', { movieId: movie.id }).catch(err => console.error('History sync error:', err));
    }
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [movie.id, user, addToRecent]);

  const bookmarked = isBookmarked(movie.id);
  const title = detail?.title || detail?.name || movie.title || movie.name || 'Unknown';
  const year = (detail?.release_date || detail?.first_air_date || '').slice(0, 4);
  const backdropUrl = getBackdropUrl(detail?.backdrop_path || movie.backdrop_path);
  const posterUrl = getPosterUrl(detail?.poster_path || movie.poster_path, 'w500');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'cast', label: 'Cast' },
    { id: 'streaming', label: 'Streaming' },
    { id: 'vibe', label: 'Vibe Chart' },
    { id: 'reviews', label: 'Reviews' },
  ] as const;

  const watchProviderRegion = detail?.watchProviders?.[watchRegion];
  const tmdbProviders = [
    ...(watchProviderRegion?.flatrate || []),
    ...(watchProviderRegion?.rent || []),
    ...(watchProviderRegion?.buy || []),
  ].filter((p, i, arr) => arr.findIndex(x => x.provider_id === p.provider_id) === i);

  // Combine providers from both sources
  const streams = rapidStreaming?.streamingInfo?.[watchRegion.toLowerCase()] || [];

  const topCast = detail?.credits?.cast?.slice(0, 20) || [];
  const director = detail?.credits?.crew?.find(c => c.job === 'Director');
  const writers = detail?.credits?.crew?.filter(c => ['Writer', 'Screenplay', 'Story'].includes(c.job)).slice(0, 3) || [];

  const imdbRating = detail?.omdb?.imdbRating;
  const tmdbRating = detail?.vote_average;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        style={{ background: 'rgba(11,15,26,0.85)', backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-t-3xl sm:rounded-3xl"
          style={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <AnimatePresence>
            {showCollections && (
              <div 
                className="absolute top-20 right-6 z-[110]"
                onClick={(e) => e.stopPropagation()}
              >
                <AddMovieToCollection 
                  movie={movie}
                  onClose={() => setShowCollections(false)}
                  onCreateNewCollection={() => setCreateCollectionModalOpen(true)}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Backdrop */}
          <div className="relative h-52 sm:h-72 overflow-hidden flex-shrink-0">
            {backdropUrl && (
              <img src={backdropUrl} alt={title} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 overlay-gradient" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(17,24,39,0.8) 0%, transparent 60%)' }} />

            {/* Close */}
            {/* Trailer button - Centered hit area */}
            {detail?.trailer && !showTrailer && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/5 hover:bg-black/20 transition-colors group/trailer"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTrailer(true)}
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-white text-lg shadow-2xl transition-all"
                  style={{ background: '#E11D48', boxShadow: '0 0 40px rgba(225,29,72,0.4)' }}
                >
                  <Play className="w-6 h-6 fill-current" />
                  Watch Trailer
                </motion.button>
              </motion.div>
            )}

            {/* Close Modal - Higher Z-index and listed after trailer to ensure clickability */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md z-50 transition-all hover:bg-white/10"
              style={{ background: 'rgba(11,15,26,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <X className="w-5 h-5 text-white" />
            </motion.button>
          </div>

          {/* Trailer embed */}
          <AnimatePresence>
            {showTrailer && detail?.trailer && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-0 left-0 right-0 z-[60]"
                style={{ height: '100%', background: '#000' }}
              >
                <button 
                  onClick={() => setShowTrailer(false)} 
                  className="absolute top-4 right-4 z-[70] p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <iframe
                  src={`https://www.youtube.com/embed/${detail.trailer.key}?autoplay=1&rel=0`}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={detail.trailer.name}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(95vh - 13rem)' }}>
            <div className="flex gap-4 sm:gap-6 p-4 sm:p-6">
              {/* Poster */}
              <div className="hidden sm:flex flex-shrink-0">
                <div className="w-32 h-48 rounded-xl overflow-hidden -mt-16 relative z-10 shadow-2xl border border-white/10">
                  <img src={posterUrl} alt={title} className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{title}</h1>
                    {detail?.tagline && (
                      <p className="text-sm text-gray-400 italic mt-1">"{detail.tagline}"</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (!user) {
                          setAuthModalOpen(true);
                        } else {
                          setShowCollections(!showCollections);
                        }
                      }}
                      className={cn('p-2.5 rounded-xl transition-all',
                        showCollections ? 'bg-[#E11D48] text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      )}
                      title="Add to Collection"
                    >
                      <ListPlus className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (!user) {
                          setOopsModalOpen(true);
                        } else {
                          toggleBookmark(movie.id, mediaType);
                        }
                      }}
                      className={cn('p-2.5 rounded-xl transition-all flex-shrink-0',
                        bookmarked ? 'bg-[#E11D48] text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      )}
                    >
                      {bookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                    </motion.button>
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  {year && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {year}
                    </div>
                  )}
                  {detail?.runtime && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      {formatRuntime(detail.runtime)}
                    </div>
                  )}
                  {detail?.original_language && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <Globe className="w-4 h-4" />
                      {detail.original_language.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Genres & Vibe Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {detail?.genres?.map(g => (
                    <div className="bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-xs font-black text-gray-300 uppercase tracking-widest">
                      {g.name}
                    </div>
                  ))}
                  {movie.vibe_tags?.map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                      #{tag.replace(/\s+/g, '-')}
                    </span>
                  ))}
                </div>

                {/* Similarity Reason (AI Explanation) */}
                {movie.similarity_score !== undefined && movie.reason && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-5 p-4 rounded-2xl border border-[#E11D48]/20 relative overflow-hidden group"
                    style={{ background: 'linear-gradient(135deg, rgba(225,29,72,0.1) 0%, transparent 100%)' }}
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Sparkles className="w-8 h-8 text-[#E11D48]" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                       <div className="px-1.5 py-0.5 rounded bg-[#E11D48] text-white text-[10px] font-black uppercase">AI Match</div>
                       <span className="text-xs font-black text-[#E11D48] uppercase tracking-widest">{movie.similarity_score}% Similar Vibe</span>
                    </div>
                    <p className="text-sm text-gray-200 font-medium leading-relaxed italic">
                      "{movie.reason}"
                    </p>
                  </motion.div>
                )}

                {/* Ratings */}
                <div className="flex gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{tmdbRating?.toFixed(1) || 'N/A'}</div>
                    <div className="text-xs text-gray-500 mt-0.5 uppercase tracking-tighter">TMDB</div>
                  </div>
                  {imdbRating && imdbRating !== 'N/A' && (
                    <div className="text-center">
                      <div className="text-2xl font-black text-white">{imdbRating}</div>
                      <div className="text-xs text-gray-500 mt-0.5 uppercase tracking-tighter">IMDb</div>
                    </div>
                  )}
                  {detail?.omdb?.Metascore && detail.omdb.Metascore !== 'N/A' && (
                    <div className="text-center">
                      <div className="text-2xl font-black text-white">{detail.omdb.Metascore}</div>
                      <div className="text-xs text-gray-500 mt-0.5 uppercase tracking-tighter">Meta</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{Math.round(detail?.popularity || movie.popularity || 0)}</div>
                    <div className="text-xs text-gray-500 mt-0.5 uppercase tracking-tighter font-black">Popularity</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 sm:px-6">
              <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex-1 py-1 px-3 rounded-lg text-[10px] sm:text-xs font-black transition-all uppercase tracking-widest',
                      activeTab === tab.id
                        ? 'bg-[#E11D48] text-white shadow-lg'
                        : 'text-gray-500 hover:text-gray-300'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {isLoading ? (
                <div className="space-y-3 pb-6">
                  {[1,2,3].map(i => <div key={i} className="h-4 rounded shimmer" />)}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="pb-6"
                  >
                    {/* OVERVIEW */}
                    {activeTab === 'overview' && (
                      <div className="space-y-5">
                        <p className="text-gray-400 leading-relaxed text-sm sm:text-base font-medium">
                          {detail?.overview || movie.overview || 'No description available.'}
                        </p>
                        {director && (
                          <div className="p-3 rounded-xl border border-white/5 bg-white/5">
                            <div className="text-[10px] text-gray-600 mb-0.5 uppercase font-black">Director</div>
                            <div className="font-bold text-white uppercase tracking-tighter">{director.name}</div>
                          </div>
                        )}
                        {writers.length > 0 && (
                          <div className="p-3 rounded-xl border border-white/5 bg-white/5">
                            <div className="text-[10px] text-gray-600 mb-1 uppercase font-black">Writers</div>
                            <div className="font-bold text-white uppercase tracking-tighter">{writers.map(w => w.name).join(', ')}</div>
                          </div>
                        )}
                        {detail?.omdb?.Awards && detail.omdb.Awards !== 'N/A' && (
                          <div className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/5">
                            <Award className="w-5 h-5 text-[#E11D48] flex-shrink-0 mt-0.5" />
                            <div>
                               <div className="text-[10px] text-gray-600 mb-0.5 uppercase font-black">Awards</div>
                               <div className="text-sm text-gray-300 font-bold italic">"{detail.omdb.Awards}"</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CAST & CREW */}
                    {activeTab === 'cast' && (
                      <div>
                        <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Leading Talent</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {topCast.map((member: CastMember) => (
                            <motion.div
                              key={member.id}
                              whileHover={{ scale: 1.03, y: -2 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => onCastClick(member.id)}
                              className="flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer transition-all border border-white/5 bg-white/5 hover:border-[#E11D48]/30 group"
                            >
                              <div className="w-14 h-14 rounded-full overflow-hidden bg-white/5 border border-white/10 group-hover:border-[#E11D48]/50">
                                {member.profile_path ? (
                                  <img src={`https://image.tmdb.org/t/p/w185${member.profile_path}`} alt={member.name} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                                )}
                              </div>
                              <div className="text-center">
                                <div className="text-xs font-black text-white uppercase tracking-tighter line-clamp-1">{member.name}</div>
                                {member.character && (
                                  <div className="text-[10px] text-gray-500 font-bold line-clamp-1 mt-0.5 uppercase">{member.character}</div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STREAMING */}
                    {activeTab === 'streaming' && (
                      <div className="space-y-6">
                        {/* Region selector */}
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
                          {REGIONS.map(r => (
                            <button
                              key={r.code}
                              onClick={() => setWatchRegion(r.code)}
                              className={cn(
                                'px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all uppercase tracking-widest',
                                watchRegion === r.code
                                  ? 'bg-[#E11D48] text-white border border-[#E11D48]/20 shadow-lg'
                                  : 'text-gray-500 bg-white/5 hover:bg-white/10 hover:text-gray-300'
                              )}
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>

                        {/* Enhanced Streaming (RapidAPI) */}
                        {streams.length > 0 && (
                          <div className="p-4 rounded-2xl border border-white/10 mb-6 bg-white/5">
                             <div className="flex items-center gap-2 mb-4">
                               <Sparkles className="w-4 h-4 text-[#E11D48]" />
                               <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Premium Streaming Info</span>
                             </div>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                               {streams.map((s: any, idx: number) => (
                                 <a key={idx} href={s.link} target="_blank" rel="noopener noreferrer" 
                                   className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-all group">
                                   <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center p-1">
                                      {/* Try to show service icon, fallback to text logo if needed */}
                                      <div className="text-[10px] font-black text-white uppercase">{s.service}</div>
                                   </div>
                                   <div>
                                      <div className="text-[11px] font-bold text-white capitalize">{s.service}</div>
                                      <div className="text-[9px] text-gray-500 uppercase font-black">{s.streamingType}</div>
                                   </div>
                                 </a>
                               ))}
                             </div>
                          </div>
                        )}

                        {tmdbProviders.length > 0 ? (
                          <div>
                            {watchProviderRegion?.flatrate && watchProviderRegion.flatrate.length > 0 && (
                              <div className="mb-4">
                                <div className="text-[10px] text-gray-600 mb-2 font-black uppercase tracking-widest leading-none">Stream (Standard)</div>
                                <div className="flex flex-wrap gap-4">
                                  {watchProviderRegion.flatrate.map(p => (
                                    <div key={p.provider_id} className="flex flex-col items-center gap-2">
                                     <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-2xl transition-transform hover:scale-110">
                                        <img src={`${OTT_LOGO}${p.logo_path}`} alt={p.provider_name} className="w-full h-full object-cover" />
                                      </div>
                                      <span className="text-[9px] text-gray-500 text-center w-16 truncate font-black uppercase tracking-tighter">{p.provider_name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {watchProviderRegion?.link && (
                              <a href={watchProviderRegion.link} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors mt-2">
                                <ExternalLink className="w-3.5 h-3.5" />
                                Full TMDB Provider List
                              </a>
                            )}
                          </div>
                        ) : !streams.length && (
                          <div className="flex flex-col items-center justify-center py-10 text-[rgba(253,251,212,0.3)]">
                            <Globe className="w-8 h-8 mb-3 opacity-30" />
                            <p className="text-sm">Not available in {REGIONS.find(r => r.code === watchRegion)?.label || watchRegion}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* VIBE CHART */}
                    {activeTab === 'vibe' && detail?.vibe && (
                      <div className="flex flex-col items-center">
                        <p className="text-[10px] text-gray-600 mb-8 text-center uppercase tracking-[0.3em] font-black">Atmospheric Signature</p>
                        <VibeChart vibe={detail.vibe} size={250} />
                        <div className="grid grid-cols-5 gap-2 mt-10 w-full px-4">
                          {Object.entries(detail.vibe).map(([key, val]) => (
                            <div key={key} className="text-center p-3 rounded-2xl border border-white/5 bg-white/5">
                              <div className="text-xl font-black text-white">{val}</div>
                              <div className="text-[9px] text-gray-600 uppercase font-black tracking-tighter mt-1">{key}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* REVIEWS */}
                    {activeTab === 'reviews' && (
                      <div className="space-y-4">
                         {reviewsLoading ? (
                           <div className="space-y-4">
                             {[1,2,3].map(i => (
                               <div key={i} className="p-4 rounded-2xl bg-[rgba(253,251,212,0.03)] space-y-2">
                                 <div className="h-4 w-32 rounded shimmer opacity-30" />
                                 <div className="h-20 w-full rounded shimmer opacity-30" />
                               </div>
                             ))}
                           </div>
                         ) : reviewsData?.results?.length > 0 ? (
                           <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                             {reviewsData.results.map((rev: any) => (
                               <div key={rev.id} className="p-5 rounded-2xl border border-[rgba(253,251,212,0.08)]" style={{ background: 'rgba(253,251,212,0.02)' }}>
                                 <div className="flex items-center justify-between mb-3">
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-[rgba(253,251,212,0.1)] flex items-center justify-center text-xs font-bold text-[#FDFBD4]">
                                        {rev.author[0].toUpperCase()}
                                      </div>
                                      <span className="text-sm font-black text-[#FDFBD4]">{rev.author}</span>
                                   </div>
                                   {rev.author_details?.rating && (
                                     <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#E11D48]/10 border border-[#E11D48]/20">
                                       <Star className="w-3 h-3 text-[#E11D48] fill-current" />
                                       <span className="text-xs font-black text-[#E11D48]">{rev.author_details.rating}</span>
                                     </div>
                                   )}
                                 </div>
                                 <p className="text-sm text-[rgba(253,251,212,0.7)] leading-relaxed italic">
                                   "{rev.content.slice(0, 600)}{rev.content.length > 600 ? '...' : ''}"
                                 </p>
                                 <div className="mt-3 text-[10px] font-bold text-[rgba(253,251,212,0.3)] uppercase tracking-widest">
                                   {new Date(rev.created_at).toLocaleDateString()}
                                 </div>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="flex flex-col items-center justify-center py-16 text-[rgba(253,251,212,0.3)]">
                             <Users className="w-10 h-10 mb-3 opacity-30" />
                             <p className="text-sm font-black uppercase tracking-widest">No expert or fan reviews yet</p>
                           </div>
                         )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
