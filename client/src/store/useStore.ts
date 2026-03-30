import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Movie, User } from '../types';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;

  // Bookmarks (local cache, synced with backend)
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
      },
      clearAuth: () => {
        localStorage.removeItem('cineverse_token');
        set({ user: null, token: null, bookmarks: [], compareWarning: null });
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
        set({ recentlyViewed: [movie, ...filtered].slice(0, 20) });
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
      compareWarning: null,
      setCompareWarning: (msg) => set({ compareWarning: msg }),
    }),
    {
      name: 'cineverse-storage',
      partialize: (s) => ({ bookmarks: s.bookmarks, recentlyViewed: s.recentlyViewed, user: s.user, token: s.token }),
    }
  )
);
