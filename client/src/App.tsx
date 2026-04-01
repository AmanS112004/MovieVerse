import React, { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { useStore } from './store/useStore';
import Home from './pages/Home';
import TrendingIn from './pages/TrendingIn';
import TrendingGlobal from './pages/TrendingGlobal';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import MoviesLikePage from './pages/MoviesLikePage';
import AddMovieToCollection from './components/AddMovieToCollection';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const { 
    activeCollectionMovie, 
    setActiveCollectionMovie,
    setCreateCollectionModalOpen 
  } = useStore();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="dark bg-[#0B0F1A] min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/trending-in" element={<TrendingIn />} />
            <Route path="/trending-global" element={<TrendingGlobal />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collections/:id" element={<CollectionDetail />} />
            <Route path="/movies-like/:movieId" element={<MoviesLikePage />} />
          </Routes>

          {/* Global Modals */}
          <AnimatePresence>
            {activeCollectionMovie && (
              <AddMovieToCollection
                movie={activeCollectionMovie}
                onClose={() => setActiveCollectionMovie(null)}
                onCreateNewCollection={() => {
                  setActiveCollectionMovie(null);
                  setCreateCollectionModalOpen(true);
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}


