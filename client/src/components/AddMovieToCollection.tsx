import React, { useState } from 'react';
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

  return (
    <div className="absolute bottom-full right-0 mb-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0B0F1A]/98 p-2 shadow-2xl backdrop-blur-xl z-[100]" onClick={(e) => e.stopPropagation()}>
      <div className="mb-2 px-3 py-2 border-bottom border-white/5">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          Add to Collection
        </h3>
      </div>

      <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-1">
        {collections.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-[10px] font-bold text-gray-700 mb-3">No collections found</p>
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
                  "flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                  alreadyIn 
                    ? "opacity-50 cursor-not-allowed text-gray-600" 
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="truncate pr-2">{col.name}</span>
                {isAdding ? (
                  <Loader2 className="h-3 w-3 animate-spin text-[#E11D48]" />
                ) : isSuccess ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : alreadyIn ? (
                  <Check className="h-3.5 w-3.5 text-[#E11D48]" />
                ) : (
                  <Plus className="h-3.5 w-3.5 opacity-40" />
                )}
              </button>
            );
          })
        )}
      </div>

      <button
        onClick={() => { onClose(); onCreateNewCollection(); }}
        className="mt-2 flex w-full items-center gap-2 px-3 py-3 rounded-xl bg-[#E11D48]/10 border border-[#E11D48]/20 text-[10px] font-black uppercase tracking-widest text-[#E11D48] hover:bg-[#E11D48]/20 transition-all"
      >
        <ListPlus className="h-3.5 w-3.5" />
        Create New List
      </button>
    </div>
  );
}
