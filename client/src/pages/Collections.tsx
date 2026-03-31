import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, FolderOpen, MoreVertical, Trash2, Calendar, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import CreateCollectionModal from '@/components/CreateCollectionModal';
import { useStore } from '@/store/useStore';
import { getPosterUrl, cn } from '@/lib/utils';

export default function Collections() {
  const navigate = useNavigate();
  const { collections, fetchCollections, deleteCollection, user, setAuthModalOpen, createCollectionModalOpen, setCreateCollectionModalOpen } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAuthModalOpen(true);
      navigate('/');
      return;
    }
    fetchCollections().finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#38240D] relative overflow-x-hidden">
      <Navbar
        onAuthClick={() => setAuthModalOpen(true)}
        onDashboardClick={() => {}} // User is already in their space
        onCompareClick={() => {}}
        onCategoryClick={(id) => id === 'discover' && navigate('/')}
      />

      <main className="pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl sm:text-6xl font-black text-[#FDFBD4] tracking-tighter"
            >
              Your <span className="text-[#C05800] italic">Collections</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[rgba(253,251,212,0.5)] font-bold mt-4 tracking-widest uppercase text-xs"
            >
              Curate your personal cinematic universe
            </motion.p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCreateCollectionModalOpen(true)}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#C05800] text-sm font-black text-white shadow-2xl transition-all"
            style={{ boxShadow: '0 20px 40px rgba(192,88,0,0.3)' }}
          >
            <Plus className="w-5 h-5" />
            Create Collection
          </motion.button>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-3xl shimmer" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-[rgba(253,251,212,0.05)] border border-[rgba(253,251,212,0.1)] flex items-center justify-center mb-6">
              <FolderOpen className="w-10 h-10 text-[rgba(253,251,212,0.2)]" />
            </div>
            <h2 className="text-2xl font-black text-[#FDFBD4] mb-2 uppercase tracking-widest">No collections yet</h2>
            <p className="text-[rgba(253,251,212,0.4)] font-medium mb-8 max-w-sm">
              Start organizing your favorite movies by creating your first custom collection.
            </p>
            <button
              onClick={() => setCreateCollectionModalOpen(true)}
              className="text-[#C05800] font-black uppercase text-sm tracking-widest hover:underline"
            >
              + Create your first list
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((col, idx) => (
              <motion.div
                key={col._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer border border-[rgba(253,251,212,0.1)] bg-[rgba(56,36,13,0.5)] backdrop-blur-md hover:border-[#C05800]/50 transition-all"
                onClick={() => navigate(`/collections/${col._id}`)}
              >
                {/* Cover Image */}
                <div className="absolute inset-0 z-0">
                  {col.movies.length > 0 ? (
                    <img 
                      src={getPosterUrl(col.movies[0].poster_path || '', 'w500')} 
                      alt={col.name}
                      className="w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-[rgba(253,251,212,0.05)] flex items-center justify-center">
                      <Film className="w-12 h-12 text-[rgba(253,251,212,0.1)]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#38240D] via-[#38240D]/80 to-transparent" />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6 z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#C05800] text-white">
                      {col.movies.length} {col.movies.length === 1 ? 'Movie' : 'Movies'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-[#FDFBD4] leading-tight mb-2 group-hover:text-[#C05800] transition-colors">
                    {col.name}
                  </h3>
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[rgba(253,251,212,0.4)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(col.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); deleteCollection(col._id); }}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-black/20 hover:bg-red-500/20 text-[rgba(253,251,212,0.4)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {createCollectionModalOpen && (
          <CreateCollectionModal onClose={() => setCreateCollectionModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
