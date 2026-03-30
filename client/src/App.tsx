import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
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
            <Route path="/movies-like/:movieId" element={<MoviesLikePage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
