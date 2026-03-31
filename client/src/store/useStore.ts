import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Movie, User, Collection } from '../types';
import api from '../lib/api';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;

  // Collections
  collections: Collection[];
  fetchCollections: () => Promise<void>;
  createCollection: (name: string, description: string) => Promise<Collection>;
  addMovieToCollection: (collectionId: string, movie: Movie) => Promise<void>;
  removeMovieFromCollection: (collectionId: string, movieId: number) => Promise<void>;
  deleteCollection: (collectionId: string) => Promise<void>;

  // Bookmarks (local cache, synced with backend)
// ... (rest of interface)

  bookmarks: { id: number; media_type: string }[];
  setBookmarks: (items: { id: number; media_type: string }[]) => void;
  toggleBookmark: (id: number, media_type: string) => void;
  isBookmarked: (id: number) => boolean;

  // Recently viewed
  recentlyViewed: Movie[];
  addToRecent: (movie: Movie) => void;

  // Comparison queue
  compareQueue: Movie[];
  addToCompare: (movie: Movie) => void;
  removeFromCompare: (id: number) => void;
  clearCompare: () => void;

  // Selected movie for modal
  selectedMovie: Movie | null;
  setSelectedMovie: (movie: Movie | null) => void;

  // Global UI states
  compareModalOpen: boolean;
  setCompareModalOpen: (open: boolean) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  oopsModalOpen: boolean;
  setOopsModalOpen: (open: boolean) => void;
  createCollectionModalOpen: boolean;
  setCreateCollectionModalOpen: (open: boolean) => void;
  compareWarning: string | null;
  setCompareWarning: (msg: string | null) => void;
}


export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('cineverse_token', token);
        set({ user, token, compareWarning: null });
        get().fetchCollections();
      },
      clearAuth: () => {
        localStorage.removeItem('cineverse_token');
        set({ user: null, token: null, bookmarks: [], collections: [], compareWarning: null });
      },

      // Collections
      collections: [],
      fetchCollections: async () => {
        if (!get().token) return;
        try {
          const { data } = await api.get('/collections');
          set({ collections: data });
        } catch (e) {
          console.error('Fetch collections failed', e);
        }
      },
      createCollection: async (name, description) => {
        const { data } = await api.post('/collections/create', { name, description });
        set(state => ({ collections: [data, ...state.collections] }));
        return data;
      },
      addMovieToCollection: async (collectionId, movie) => {
        // Only send necessary fields to avoid PayloadTooLargeError
        const moviePayload = {
          id: movie.id,
          title: movie.title,
          name: movie.name,
          poster_path: movie.poster_path,
          media_type: movie.media_type
        };
        const { data } = await api.post('/collections/add-movie', { collectionId, movie: moviePayload });
        set(state => ({
          collections: state.collections.map(c => c._id === collectionId ? data : c)
        }));
      },
      removeMovieFromCollection: async (collectionId, movieId) => {
        const { data } = await api.delete(`/collections/${collectionId}/remove-movie/${movieId}`);
        set(state => ({
          collections: state.collections.map(c => c._id === collectionId ? data : c)
        }));
      },
      deleteCollection: async (collectionId) => {
        await api.delete(`/collections/${collectionId}`);
        set(state => ({
          collections: state.collections.filter(c => c._id !== collectionId)
        }));
      },

      // Bookmarks

      bookmarks: [],
      setBookmarks: (items) => set({ bookmarks: items }),
      toggleBookmark: (id, media_type) => {
        const { bookmarks } = get();
        const exists = bookmarks.find(b => b.id === id);
        const next = exists
          ? bookmarks.filter(b => b.id !== id)
          : [...bookmarks, { id, media_type }];
        set({ bookmarks: next });
      },
      isBookmarked: (id) => get().bookmarks.some(b => b.id === id),

      // Recently viewed
      recentlyViewed: [],
      addToRecent: (movie) => {
        const { recentlyViewed } = get();
        const filtered = recentlyViewed.filter(m => m.id !== movie.id);
        set({ recentlyViewed: [movie, ...filtered].slice(0, 100) });
      },

      // Comparison
      compareQueue: [],
      addToCompare: (movie) => {
        const { compareQueue } = get();
        if (compareQueue.find(m => m.id === movie.id)) return;
        
        if (compareQueue.length >= 2) {
          // FIFO: Remove oldest, add new, and show warning
          set({ 
            compareQueue: [compareQueue[1], movie],
            compareWarning: "Only 2 movies can be compared. Replaced oldest with newest!"
          });
          // Auto-clear warning after 3s
          setTimeout(() => set({ compareWarning: null }), 3000);
        } else {
          set({ compareQueue: [...compareQueue, movie], compareWarning: null });
        }
      },
      removeFromCompare: (id) => {
        set(s => ({ compareQueue: s.compareQueue.filter(m => m.id !== id) }));
      },
      clearCompare: () => set({ compareQueue: [], compareWarning: null }),

      // Modals
      selectedMovie: null,
      setSelectedMovie: (movie) => set({ selectedMovie: movie }),
      compareModalOpen: false,
      setCompareModalOpen: (open) => set({ compareModalOpen: open }),
      authModalOpen: false,
      setAuthModalOpen: (open) => set({ authModalOpen: open }),
      oopsModalOpen: false,
      setOopsModalOpen: (open) => set({ oopsModalOpen: open }),
      createCollectionModalOpen: false,
      setCreateCollectionModalOpen: (open) => set({ createCollectionModalOpen: open }),
      compareWarning: null,

      setCompareWarning: (msg) => set({ compareWarning: msg }),
    }),
    {
      name: 'cineverse-storage',
      partialize: (s) => ({ bookmarks: s.bookmarks, recentlyViewed: s.recentlyViewed, user: s.user, token: s.token }),
    }
  )
);
