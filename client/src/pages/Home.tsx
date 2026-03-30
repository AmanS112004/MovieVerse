import React, { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { SlidersHorizontal, TrendingUp, Sparkles, ChevronDown } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import MovieCard from '@/components/MovieCard';
import Navbar from '@/components/Navbar';
import TextRoll from '@/components/ui/text-roll';
import api from '@/lib/api';
import { useStore } from '@/store/useStore';
import { GENRE_MAP, cn } from '@/lib/utils';
import type { Movie } from '@/types';

// Lazy load heavy modals
const MovieModal = lazy(() => import('@/components/MovieModal'));
const ActorModal = lazy(() => import('@/components/ActorModal'));
const CompareModal = lazy(() => import('@/components/CompareModal'));
const AuthModal = lazy(() => import('@/components/AuthModal'));
const Dashboard = lazy(() => import('@/components/Dashboard'));
const HeroCanvas = lazy(() => import('@/components/HeroCanvas'));
const OopsModal = lazy(() => import('@/components/OopsModal'));

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'primary_release_date.desc', label: 'Recently Released' },
];

const LANG_OPTIONS = [
  { value: '', label: 'All Languages' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ko', label: 'Korean' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
];

export default function Home() {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedMovieId, setSearchedMovieId] = useState<number | null>(null);
  const [searchedMovieType, setSearchedMovieType] = useState<string>('movie');
  const [actorId, setActorId] = useState<number | null>(null);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [language, setLanguage] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'similar' | 'discover' | 'search' | 'trending-in' | 'trending-intl' | 'collections'>('discover');
  const [stagedMovie, setStagedMovie] = useState<Movie | null>(null);

  // Generic Trending (Global)
  const { data: trendingGlobal, isLoading: trendingGlobalLoading } = useQuery<Movie[]>({
    queryKey: ['trending-global'],
    queryFn: async () => {
      const { data } = await api.get('/movies/trending', { params: { time_window: 'week' } });
      return data;
    },
    enabled: viewMode === 'trending-intl' || viewMode === 'discover',
    staleTime: 5 * 60 * 1000,
  });

  // Trending India
  const { data: trendingIndia, isLoading: trendingIndiaLoading } = useQuery<Movie[]>({
    queryKey: ['trending-india'],
    queryFn: async () => {
      // For India trending, we use discover with region and primary_release_year/sort
      const { data } = await api.get('/movies/discover', { 
        params: { 
          sort_by: 'popularity.desc', 
          language: 'hi', // Hindi as a proxy or just region IN
          region: 'IN',
          with_original_language: 'hi|ta|te|kn|ml' 
        } 
      });
      return data.results;
    },
    enabled: viewMode === 'trending-in',
    staleTime: 10 * 60 * 1000,
  });

  // Collections (Highly rated gems)
  const { data: collections, isLoading: collectionsLoading } = useQuery<Movie[]>({
    queryKey: ['collections'],
    queryFn: async () => {
      const { data } = await api.get('/movies/discover', { 
        params: { 
          sort_by: 'vote_average.desc', 
          'vote_count.gte': 500,
          page: 1
        } 
      });
      return data.results;
    },
    enabled: viewMode === 'collections',
    staleTime: 20 * 60 * 1000,
  });

  // Similar movies
  const { data: similarMovies, isLoading: similarLoading } = useQuery<Movie[]>({
    queryKey: ['similar', searchedMovieId, searchedMovieType],
    queryFn: async () => {
      const { data } = await api.get(`/movies/similar/${searchedMovieId}`, { params: { media_type: searchedMovieType } });
      return data;
    },
    enabled: !!searchedMovieId,
    staleTime: 10 * 60 * 1000,
  });

  // Search results
  const { data: searchResults, isLoading: searchLoading } = useQuery<Movie[]>({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      const { data } = await api.get('/movies/search', { params: { q: searchQuery } });
      return data.results;
    },
    enabled: !!(searchQuery && viewMode === 'search'),
    staleTime: 30_000,
  });

  // Discover with filters
  const { data: discoveredMovies, isLoading: discoverLoading } = useQuery<Movie[]>({
    queryKey: ['discover', sortBy, language, selectedGenre],
    queryFn: async () => {
      const { data } = await api.get('/movies/discover', {
        params: { sort_by: sortBy, language, genre: selectedGenre || undefined }
      });
      return data.results;
    },
    enabled: viewMode === 'discover',
    staleTime: 5 * 60 * 1000,
  });

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setSearchedMovieId(movie.id);
    setSearchedMovieType(movie.media_type || 'movie');
    setViewMode('similar');
    setStagedMovie(null);
  };

  const handleSuggestionSelect = (movie: Movie) => {
    setSearchQuery(movie.title || movie.name || '');
    setStagedMovie(movie);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Check if the search query matches a staged movie from suggestions
    if (stagedMovie && (stagedMovie.title === query || stagedMovie.name === query)) {
      setSearchedMovieId(stagedMovie.id);
      setSearchedMovieType(stagedMovie.media_type || 'movie');
      setViewMode('similar');
    } else {
      setSearchedMovieId(null);
      setStagedMovie(null);
      setViewMode('search');
    }
  };

  const handleCategorySelect = (id: string) => {
    setViewMode(id as any);
    if (id === 'discover') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Scroll to results section 
      const resultsSection = document.getElementById('results-section');
      resultsSection?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const movies = viewMode === 'similar' ? similarMovies :
                 viewMode === 'search' ? searchResults :
                 viewMode === 'trending-in' ? trendingIndia :
                 viewMode === 'trending-intl' ? trendingGlobal :
                 viewMode === 'collections' ? collections :
                 (trendingGlobal || discoveredMovies || []);

  const isLoading = viewMode === 'similar' ? similarLoading :
                    viewMode === 'search' ? searchLoading :
                    viewMode === 'trending-in' ? trendingIndiaLoading :
                    viewMode === 'trending-intl' ? trendingGlobalLoading :
                    viewMode === 'collections' ? collectionsLoading :
                    (trendingGlobalLoading && discoverLoading);

  const heroTitle = viewMode === 'similar' && selectedMovie
    ? `Movies like "${selectedMovie.title || selectedMovie.name}"`
    : viewMode === 'search'
    ? `Results for "${searchQuery}"`
    : viewMode === 'trending-in'
    ? 'Trending in India'
    : viewMode === 'trending-intl'
    ? 'Trending Globally'
    : viewMode === 'collections'
    ? 'Premium Collections'
    : 'Discover What to Watch';

  const topGenres = Object.entries(GENRE_MAP).slice(0, 10);

  return (
    <div className="min-h-screen bg-[#1A2517] relative">
      {/* Navbar */}
      <Navbar
        onAuthClick={() => setAuthModalOpen(true)}
        onDashboardClick={() => { if (user) setDashboardOpen(true); else setAuthModalOpen(true); }}
        onCompareClick={() => setCompareModalOpen(true)}
        onCategoryClick={handleCategorySelect}
      />

      {/* HERO SECTION */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden px-4">
        {/* Three.js canvas */}
        <Suspense fallback={null}>
          <HeroCanvas />
        </Suspense>

        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(172,200,162,0.06) 0%, transparent 70%)', transform: 'translate(-50%, -50%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(172,200,162,0.04) 0%, transparent 70%)', transform: 'translate(50%, 50%)' }} />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 text-center max-w-4xl w-full"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'rgba(172,200,162,0.08)', border: '1px solid rgba(172,200,162,0.2)' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#ACC8A2]" />
            <span className="text-xs font-semibold text-[rgba(172,200,162,0.8)] tracking-wide">30+ Smart Recommendations</span>
          </motion.div>

          {/* Main headline using TextRoll */}
          <h1 className="mb-4" style={{ lineHeight: 1 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <TextRoll
                center
                className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-[#ACC8A2] dark:text-[#ACC8A2]"
              >
                CINEVERSE
              </TextRoll>
            </motion.div>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-base sm:text-xl text-[rgba(172,200,162,0.55)] mb-10 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            Search any movie and discover 30+ similar titles from across the world —<br className="hidden sm:block" />
            by vibe, theme, audience, and tone.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <SearchBar
              onSelectMovie={handleSuggestionSelect}
              onSearch={handleSearch}
              placeholder="Search Deadpool, Parasite, Attack on Titan..."
              large
            />
          </motion.div>

          {/* Quick genre chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-2 mt-6"
          >
            {['Action', 'Comedy', 'Horror', 'Sci-Fi', 'K-Drama', 'Anime', 'Thriller', 'Romance'].map(genre => (
              <motion.button
                key={genre}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: 'rgba(172,200,162,0.06)',
                  border: '1px solid rgba(172,200,162,0.15)',
                  color: 'rgba(172,200,162,0.65)',
                }}
                onMouseEnter={e => {
                  (e.target as HTMLElement).style.background = 'rgba(172,200,162,0.12)';
                  (e.target as HTMLElement).style.borderColor = 'rgba(172,200,162,0.35)';
                  (e.target as HTMLElement).style.color = '#ACC8A2';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.background = 'rgba(172,200,162,0.06)';
                  (e.target as HTMLElement).style.borderColor = 'rgba(172,200,162,0.15)';
                  (e.target as HTMLElement).style.color = 'rgba(172,200,162,0.65)';
                }}
                onClick={() => { handleSearch(genre); }}
              >
                {genre}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown className="w-5 h-5 text-[rgba(172,200,162,0.4)]" />
          </motion.div>
        </motion.div>
      </section>

      {/* RESULTS SECTION */}
      <section id="results-section" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <motion.h2
              key={heroTitle}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl sm:text-2xl font-black text-[#ACC8A2]"
            >
              {heroTitle}
            </motion.h2>
            {movies && (
              <p className="text-sm text-[rgba(172,200,162,0.4)] mt-0.5">{movies.length} titles found</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Discover switch */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('discover')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                viewMode === 'discover'
                  ? 'bg-[rgba(172,200,162,0.15)] text-[#ACC8A2] border border-[rgba(172,200,162,0.3)]'
                  : 'text-[rgba(172,200,162,0.5)] hover:bg-[rgba(172,200,162,0.08)]'
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Discover
            </motion.button>

            {/* Filters toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(f => !f)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                showFilters
                  ? 'bg-[rgba(172,200,162,0.15)] text-[#ACC8A2] border border-[rgba(172,200,162,0.3)]'
                  : 'bg-[rgba(172,200,162,0.06)] text-[rgba(172,200,162,0.6)] hover:bg-[rgba(172,200,162,0.1)]'
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </motion.button>
          </div>
        </div>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-6"
            >
              <div className="p-4 sm:p-5 rounded-2xl space-y-4" style={{ background: 'rgba(172,200,162,0.04)', border: '1px solid rgba(172,200,162,0.08)' }}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Sort */}
                  <div>
                    <label className="text-xs font-bold text-[rgba(172,200,162,0.5)] uppercase tracking-wider mb-2 block">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={e => { setSortBy(e.target.value); setViewMode('discover'); }}
                      className="w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#ACC8A2] outline-none cursor-pointer"
                      style={{ background: 'rgba(172,200,162,0.08)', border: '1px solid rgba(172,200,162,0.15)' }}
                    >
                      {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#1A2517' }}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="text-xs font-bold text-[rgba(172,200,162,0.5)] uppercase tracking-wider mb-2 block">Language</label>
                    <select
                      value={language}
                      onChange={e => { setLanguage(e.target.value); setViewMode('discover'); }}
                      className="w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#ACC8A2] outline-none cursor-pointer"
                      style={{ background: 'rgba(172,200,162,0.08)', border: '1px solid rgba(172,200,162,0.15)' }}
                    >
                      {LANG_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#1A2517' }}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* Genre */}
                  <div>
                    <label className="text-xs font-bold text-[rgba(172,200,162,0.5)] uppercase tracking-wider mb-2 block">Genre</label>
                    <select
                      value={selectedGenre || ''}
                      onChange={e => { setSelectedGenre(e.target.value ? Number(e.target.value) : null); setViewMode('discover'); }}
                      className="w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#ACC8A2] outline-none cursor-pointer"
                      style={{ background: 'rgba(172,200,162,0.08)', border: '1px solid rgba(172,200,162,0.15)' }}
                    >
                      <option value="" style={{ background: '#1A2517' }}>All Genres</option>
                      {topGenres.map(([id, name]) => <option key={id} value={id} style={{ background: '#1A2517' }}>{name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl shimmer" />
            ))}
          </div>
        ) : movies && movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((movie: Movie, i: number) => (
              <MovieCard
                key={`${movie.id}-${i}`}
                movie={movie}
                onClick={handleMovieSelect}
                index={i}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-[rgba(172,200,162,0.4)]">
            <div className="text-5xl mb-4">🎬</div>
            <p className="text-lg font-semibold mb-2">No results found</p>
            <p className="text-sm">Try a different search or explore trending movies</p>
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
          {oopsModalOpen && (
            <OopsModal />
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
                background: 'rgba(26,37,23,0.95)', 
                borderColor: 'rgba(172,200,162,0.4)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
            >
              <div className="w-2 h-2 rounded-full bg-[#ACC8A2] animate-pulse" />
              <span className="text-sm font-bold text-[#ACC8A2] whitespace-nowrap">{compareWarning}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}
