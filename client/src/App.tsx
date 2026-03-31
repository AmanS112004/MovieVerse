import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TrendingIn from './pages/TrendingIn';
import TrendingGlobal from './pages/TrendingGlobal';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import MoviesLikePage from './pages/MoviesLikePage';
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
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="dark">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/trending-in" element={<TrendingIn />} />
            <Route path="/trending-global" element={<TrendingGlobal />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collections/:id" element={<CollectionDetail />} />
            <Route path="/movies-like/:movieId" element={<MoviesLikePage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}


