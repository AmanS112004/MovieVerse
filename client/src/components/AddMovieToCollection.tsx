import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, Loader2, ListPlus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Movie } from '@/types';
import { cn } from '@/lib/utils';

interface AddMovieToCollectionProps {
  movie: Movie;
  onClose: () => void;
  onCreateNewCollection: () => void;
}

export default function AddMovieToCollection({ movie, onClose, onCreateNewCollection }: AddMovieToCollectionProps) {
  const { collections, addMovieToCollection, user, setAuthModalOpen } = useStore();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const handleAdd = async (collectionId: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    console.log('Adding movie to collection:', { movie, collectionId });
    setAddingId(collectionId);
    try {
      await addMovieToCollection(collectionId, movie);
      setSuccessId(collectionId);
      setTimeout(() => {
        setSuccessId(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to add movie', err);
    } finally {
      setAddingId(null);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-45%" }}
        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
        exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-45%" }}
        style={{ left: '50%', top: '50%' }}
        className={cn(
          "z-[200] overflow-hidden rounded-[32px] border border-white/10 bg-[#0B0F1A]/95 p-3 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl",
          "fixed w-[90vw] max-w-sm"
        )} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 px-4 py-2 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#E11D48]">
              Collection
            </h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Add to your custom lists</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <ListPlus className="w-4 h-4 text-white/40" />
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1 px-1">
          {collections.length === 0 ? (
            <div className="px-4 py-8 text-center rounded-2xl bg-white/5 border border-dashed border-white/10">
              <p className="text-xs font-bold text-gray-600 mb-1">No collections yet</p>
              <p className="text-[10px] text-gray-700">Create one to start organizing</p>
            </div>
          ) : (
            collections.map((col) => {
              const alreadyIn = col.movies.some(m => String(m.movieId) === String(movie.id));
              const isAdding = addingId === col._id;
              const isSuccess = successId === col._id;

              return (
                <button
                  key={col._id}
                  disabled={alreadyIn || !!addingId}
                  onClick={() => handleAdd(col._id)}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group",
                    alreadyIn 
                      ? "opacity-50 cursor-not-allowed text-gray-600 bg-white/2" 
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span className="truncate pr-4 uppercase tracking-tighter">{col.name}</span>
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#E11D48]" />
                  ) : isSuccess ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : alreadyIn ? (
                    <div className="flex items-center gap-1">
                       <span className="text-[9px] font-black text-[#E11D48] opacity-60">ADDED</span>
                       <Check className="h-4 w-4 text-[#E11D48]" />
                    </div>
                  ) : (
                    <Plus className="h-4 w-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="mt-4 p-1">
          <button
            onClick={() => { onClose(); onCreateNewCollection(); }}
            className="flex w-full items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-[#E11D48] text-xs font-black uppercase tracking-widest text-white hover:bg-[#F43F5E] shadow-[0_10px_20px_rgba(225,29,72,0.3)] transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Create New List
          </button>
        </div>
      </motion.div>
    </>,
    document.body
  );
}
