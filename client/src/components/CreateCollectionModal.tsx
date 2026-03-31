import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, FolderPlus, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface CreateCollectionModalProps {
  onClose: () => void;
}

export default function CreateCollectionModal({ onClose }: CreateCollectionModalProps) {
  const { createCollection } = useStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await createCollection(name, description);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#111827]/95 p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E11D48]/20 border border-[#E11D48]/20">
              <FolderPlus className="h-5 w-5 text-[#E11D48]" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">New Collection</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
              Collection Name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekend Chill, Sci-Fi Gems..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white placeholder:text-gray-600 focus:border-[#E11D48]/50 focus:outline-none focus:ring-1 focus:ring-[#E11D48]/50"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us what this collection is about..."
              className="min-h-[100px] w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white placeholder:text-gray-600 focus:border-[#E11D48]/50 focus:outline-none focus:ring-1 focus:ring-[#E11D48]/50"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs font-bold text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E11D48] py-4 text-sm font-black text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Collection'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
