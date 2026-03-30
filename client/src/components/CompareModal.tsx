import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Scale, Users, Sparkles, CheckCircle2, AlertCircle, TrendingUp, Award, Clock, Star, Zap, Info, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import VibeChart from './VibeChart';
import { getPosterUrl, formatDate, cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { CompareResult, Movie } from '@/types';

interface CompareModalProps {
  onClose: () => void;
}

export default function CompareModal({ onClose }: CompareModalProps) {
  const { compareQueue, clearCompare } = useStore();
  const [showScoring, setShowScoring] = useState(false);
  const [m1, m2] = compareQueue;

  const { data: result, isLoading } = useQuery<CompareResult>({
    queryKey: ['compare-advanced', m1?.id, m2?.id],
    queryFn: async () => {
      if (!m1 || !m2) throw new Error('Need 2 movies');
      const { data } = await api.get(`/movies/compare/${m1.id}/${m2.id}`);
      return data;
    },
    enabled: !!(m1 && m2),
    staleTime: 10 * 60 * 1000,
  });

  const getWinner = (v1: number, v2: number) => {
    if (v1 > v2) return 1;
    if (v2 > v1) return 2;
    return 0;
  };

  const isWinner = (idx: number) => {
    if (!result) return false;
    return (idx === 0 && result.scores.movie1 > result.scores.movie2) ||
           (idx === 1 && result.scores.movie2 > result.scores.movie1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center p-0 sm:p-4 overflow-hidden"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        style={{ background: 'rgba(5,10,4,0.95)', backdropFilter: 'blur(20px)' }}
      >
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-6xl h-full sm:h-[95vh] rounded-none sm:rounded-[40px] overflow-hidden flex flex-col"
          style={{
            background: 'linear-gradient(180deg, #121d10 0%, #0a1109 100%)',
            border: '1px solid rgba(172,200,162,0.15)',
            boxShadow: '0 50px 150px rgba(0,0,0,1)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[rgba(172,200,162,0.1)] relative z-20 bg-[#121d10]/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#ACC8A2]/10 border border-[#ACC8A2]/20">
                <Scale className="w-6 h-6 text-[#ACC8A2]" />
              </div>
              <div>
                <h2 className="font-black text-xl text-[#ACC8A2] tracking-tight uppercase">Advanced Confrontation</h2>
                <p className="text-[10px] font-bold text-[rgba(172,200,162,0.4)] tracking-[0.2em] uppercase mt-0.5">Deep Metadata & AI Sentiment Analysis</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {compareQueue.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearCompare}
                  className="px-4 py-2 rounded-xl text-xs font-black text-[rgba(172,200,162,0.6)] hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all uppercase tracking-widest"
                >
                  Clear Arena
                </motion.button>
              )}
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }} 
                whileTap={{ scale: 0.9 }} 
                onClick={onClose}
                className="p-2.5 rounded-full bg-[rgba(172,200,162,0.05)] border border-[rgba(172,200,162,0.1)] hover:bg-[rgba(172,200,162,0.15)] transition-all"
              >
                <X className="w-6 h-6 text-[#ACC8A2]" />
              </motion.button>
            </div>
          </div>

          {!m1 || !m2 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <div className="relative mb-8">
                <Scale className="w-24 h-24 text-[rgba(172,200,162,0.05)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-10 h-10 text-[#ACC8A2] animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-[#ACC8A2] mb-3 uppercase tracking-tight">The Arena is Empty</h3>
              <p className="text-[rgba(172,200,162,0.5)] max-w-sm font-medium leading-relaxed">
                Add two movies to the confrontation queue to begin the deep-layer comparison and AI analysis.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex-1 flex flex-col p-10 space-y-8">
               <div className="grid grid-cols-2 gap-20">
                  {[1,2].map(i => (
                    <div key={i} className="space-y-4">
                       <div className="aspect-[2/3] w-48 mx-auto rounded-3xl shimmer opacity-20" />
                       <div className="h-8 w-64 mx-auto rounded-xl shimmer opacity-10" />
                    </div>
                  ))}
               </div>
               <div className="space-y-4">
                  {[1,2,3,4].map(i => <div key={i} className="h-12 w-full rounded-2xl shimmer opacity-5" />)}
               </div>
            </div>
          ) : result ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Top Confrontation Bar */}
              <div className="relative pt-10 pb-20 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#ACC8A2]/5 to-transparent pointer-events-none" />
                
                <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] gap-4 sm:gap-20 items-center">
                  {[result.movie1].map((film, idx) => {
                    const win = isWinner(0);
                    return (
                      <motion.div 
                        key={film.id}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="relative flex flex-col items-center text-center group"
                      >
                        <div className="relative mb-6">
                            {win && (
                              <motion.div 
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="absolute -top-6 -right-6 z-30 bg-[#ACC8A2] text-[#1A2517] px-4 py-2 rounded-2xl font-black text-xs shadow-[0_0_40px_rgba(172,200,162,0.6)] flex items-center gap-2 uppercase"
                              >
                                <Award className="w-4 h-4" /> Recommended
                              </motion.div>
                            )}
                            <div className={cn(
                              "w-40 sm:w-56 aspect-[2/3] rounded-[32px] overflow-hidden border-2 transition-all duration-700 relative",
                              win ? "border-[#ACC8A2] shadow-[0_0_80px_rgba(172,200,162,0.2)] scale-105" : "border-white/10 opacity-60 grayscale-[0.5]"
                            )}>
                              <img src={getPosterUrl(film.poster_path, 'w500')} alt={film.title} className="w-full h-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                                 <div className="text-3xl font-black text-white">{result.scores.movie1}%</div>
                                 <div className="text-[10px] uppercase font-black text-[#ACC8A2] opacity-80 tracking-widest">Match Score</div>
                              </div>
                            </div>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-[#ACC8A2] leading-tight max-w-xs">{film.title}</h3>
                        <p className="text-xs font-bold text-[rgba(172,200,162,0.4)] mt-2 uppercase tracking-[0.3em]">{formatDate(film.release_date)}</p>
                      </motion.div>
                    );
                  })}

                  {/* VS Indicator in middle */}
                  <div className="flex flex-col items-center justify-center relative h-full">
                    <div className="w-16 h-16 rounded-full border-2 border-[#ACC8A2]/20 flex items-center justify-center bg-black/40 backdrop-blur-xl relative z-10 overflow-hidden shadow-2xl">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-2xl font-black text-[#ACC8A2]"
                      >
                        VS
                      </motion.div>
                    </div>
                    <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#ACC8A2]/20 to-transparent" />
                  </div>

                  {[result.movie2].map((film, idx) => {
                    const win = isWinner(1);
                    return (
                      <motion.div 
                        key={film.id}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="relative flex flex-col items-center text-center group"
                      >
                        <div className="relative mb-6">
                            {win && (
                              <motion.div 
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="absolute -top-6 -right-6 z-30 bg-[#ACC8A2] text-[#1A2517] px-4 py-2 rounded-2xl font-black text-xs shadow-[0_0_40px_rgba(172,200,162,0.6)] flex items-center gap-2 uppercase"
                              >
                                <Award className="w-4 h-4" /> Recommended
                              </motion.div>
                            )}
                            <div className={cn(
                              "w-40 sm:w-56 aspect-[2/3] rounded-[32px] overflow-hidden border-2 transition-all duration-700 relative",
                              win ? "border-[#ACC8A2] shadow-[0_0_80px_rgba(172,200,162,0.2)] scale-105" : "border-white/10 opacity-60 grayscale-[0.5]"
                            )}>
                              <img src={getPosterUrl(film.poster_path, 'w500')} alt={film.title} className="w-full h-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                                 <div className="text-3xl font-black text-white">{result.scores.movie2}%</div>
                                 <div className="text-[10px] uppercase font-black text-[#ACC8A2] opacity-80 tracking-widest">Match Score</div>
                              </div>
                            </div>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-[#ACC8A2] leading-tight max-w-xs">{film.title}</h3>
                        <p className="text-xs font-bold text-[rgba(172,200,162,0.4)] mt-2 uppercase tracking-[0.3em]">{formatDate(film.release_date)}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* AI DECISION LAYER */}
              <div className="px-6 mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Watch If A */}
                  <div className="p-6 rounded-[32px] border border-[#ACC8A2]/10 bg-white/[0.02] relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                       <Zap className="w-32 h-32 text-[#ACC8A2]" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-8 h-8 rounded-full bg-[#ACC8A2]/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-[#ACC8A2]" />
                       </div>
                       <h4 className="text-sm font-black text-[#ACC8A2] uppercase tracking-widest">Watch "{result.movie1.title}" if...</h4>
                    </div>
                    <p className="text-sm text-[rgba(172,200,162,0.7)] leading-relaxed font-medium">
                       {result.insights?.watch_a_if || "You're looking for a high-intensity, visually stunning experience with deep thematic undertones."}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                       {result.insights?.pros_a?.slice(0,3).map(p => (
                         <span key={p} className="text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded bg-[#ACC8A2]/5 text-[#ACC8A2]/60">+{p}</span>
                       ))}
                    </div>
                  </div>

                  {/* Watch If B */}
                  <div className="p-6 rounded-[32px] border border-[#ACC8A2]/10 bg-white/[0.02] relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                       <Zap className="w-32 h-32 text-[#ACC8A2]" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-8 h-8 rounded-full bg-[#ACC8A2]/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-[#ACC8A2]" />
                       </div>
                       <h4 className="text-sm font-black text-[#ACC8A2] uppercase tracking-widest">Watch "{result.movie2.title}" if...</h4>
                    </div>
                    <p className="text-sm text-[rgba(172,200,162,0.7)] leading-relaxed font-medium">
                       {result.insights?.watch_b_if || "You prefer a character-driven narrative with unexpected twists and a strong emotional core."}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                       {result.insights?.pros_b?.slice(0,3).map(p => (
                         <span key={p} className="text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded bg-[#ACC8A2]/5 text-[#ACC8A2]/60">+{p}</span>
                       ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* CORE METRICS TABLE */}
              <div className="px-6 mb-12">
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-[40px] overflow-hidden overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                            <tr className="border-b border-white/[0.05]">
                                <th className="p-6 text-[10px] font-black text-[rgba(172,200,162,0.4)] uppercase tracking-[0.2em] w-1/3">Metric Analysis</th>
                                <th className="p-6 text-sm font-black text-[#ACC8A2] text-center w-1/3 truncate">{result.movie1.title}</th>
                                <th className="p-6 text-sm font-black text-[#ACC8A2] text-center w-1/3 truncate">{result.movie2.title}</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {[
                                { label: 'Arena Score', icon: Zap, v1: result.scores.movie1 + '%', v2: result.scores.movie2 + '%', w: result.scores.movie1 > result.scores.movie2 ? 1 : 2 },
                                { label: 'Audience Rating', icon: Star, v1: result.movie1.vote_average.toFixed(1), v2: result.movie2.vote_average.toFixed(1), w: result.movie1.vote_average > result.movie2.vote_average ? 1 : 2 },
                                { label: 'Star Power', icon: Users, v1: Math.round(result.movie1.star_power || 0), v2: Math.round(result.movie2.star_power || 0), w: (result.movie1.star_power || 0) > (result.movie2.star_power || 0) ? 1 : 2 },
                                { label: 'Popularity Index', icon: TrendingUp, v1: Math.round(result.movie1.popularity).toLocaleString(), v2: Math.round(result.movie2.popularity).toLocaleString(), w: result.movie1.popularity > result.movie2.popularity ? 1 : 2 },
                                { label: 'Runtime', icon: Clock, v1: result.movie1.runtime + 'm', v2: result.movie2.runtime + 'm', w: 0 },
                            ].map((row, i) => (
                                <tr key={i} className="group hover:bg-[#ACC8A2]/5 transition-colors border-b border-white/[0.02]">
                                    <td className="p-5 flex items-center gap-3">
                                        <span className="text-[rgba(172,200,162,0.4)] transition-colors group-hover:text-[#ACC8A2]">
                                          <row.icon size={16} />
                                        </span>
                                        <span className="font-bold text-[rgba(172,200,162,0.7)]">{row.label}</span>
                                    </td>
                                    <td className={cn("p-5 text-center font-black", row.w === 1 ? "text-[#ACC8A2]" : "text-[rgba(172,200,162,0.4)]")}>
                                        {row.v1} {row.w === 1 && '⭐'}
                                    </td>
                                    <td className={cn("p-5 text-center font-black", row.w === 2 ? "text-[#ACC8A2]" : "text-[rgba(172,200,162,0.4)]")}>
                                        {row.w === 2 && '⭐'} {row.v2}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>

              {/* VIBE COMPARISON & RADAR */}
              <div className="px-6 mb-16 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-10 items-center">
                  <div className="flex flex-col items-center">
                    <VibeChart vibe={result.movie1.vibe as any} size={280} />
                    <p className="text-[10px] font-black text-[#ACC8A2] uppercase tracking-[0.2em] mt-6">Atmospheric Sig: A</p>
                  </div>
                  
                  <div className="hidden lg:flex flex-col items-center gap-4">
                     {['Action', 'Comedy', 'Dark', 'Story', 'Pacing'].map(v => (
                       <div key={v} className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-black text-[rgba(172,200,162,0.4)] uppercase">
                         {v}
                       </div>
                     ))}
                  </div>

                  <div className="flex flex-col items-center">
                    <VibeChart vibe={result.movie2.vibe as any} size={280} />
                    <p className="text-[10px] font-black text-[#ACC8A2] uppercase tracking-[0.2em] mt-6">Atmospheric Sig: B</p>
                  </div>
              </div>

              {/* SHARED ASSETS & SCORING EXPLAINER */}
              <div className="px-6 pb-20 space-y-12">
                 {/* Shared Cast */}
                 {result.sharedCast.length > 0 && (
                   <div>
                      <div className="flex items-center gap-2 mb-6">
                        <Users className="w-5 h-5 text-[#ACC8A2]" />
                        <h4 className="text-sm font-black text-[rgba(172,200,162,0.6)] uppercase tracking-[0.2em]">Crossover Talent Detected</h4>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        {result.sharedCast.map(actor => (
                          <div key={actor.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                             <div className="w-10 h-10 rounded-full overflow-hidden border border-[#ACC8A2]/20">
                                <img src={getPosterUrl(actor.profile_path, 'w185')} alt={actor.name} className="w-full h-full object-cover" />
                             </div>
                             <div>
                                <p className="text-xs font-black text-[#ACC8A2] uppercase tracking-tighter">{actor.name}</p>
                                <p className="text-[10px] text-[rgba(172,200,162,0.4)] font-bold">Appears in Both</p>
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>
                 )}

                 {/* Scoring Explainer Toggle */}
                 <div className="pt-10 border-t border-white/5">
                    <button 
                      onClick={() => setShowScoring(!showScoring)}
                      className="flex items-center gap-2 text-[10px] font-black text-[rgba(172,200,162,0.3)] hover:text-[#ACC8A2] transition-colors uppercase tracking-[0.2em]"
                    >
                      <Info className="w-4 h-4" />
                      How the Arena matches are scored
                      <ChevronDown className={cn("w-4 h-4 transition-transform", showScoring && "rotate-180")} />
                    </button>
                    <AnimatePresence>
                      {showScoring && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-4"
                        >
                          <div className="p-6 rounded-[32px] bg-[#ACC8A2]/5 text-xs text-[rgba(172,200,162,0.6)] font-medium leading-relaxed max-w-3xl">
                             Our algorithm uses a weighted system to provide a definitive recommendation:
                             <ul className="mt-4 space-y-2">
                                <li>• <span className="font-bold text-[#ACC8A2]">25% Critical Rating:</span> Sourced from TMDB & IMDb community consensus.</li>
                                <li>• <span className="font-bold text-[#ACC8A2]">20% Popularity & Buzz:</span> Real-time trending data and global search volume.</li>
                                <li>• <span className="font-bold text-[#ACC8A2]">20% Atmospheric Match:</span> Thematic alignment between genres, keywords, and mood.</li>
                                <li>• <span className="font-bold text-[#ACC8A2]">15% Award Recognition:</span> Star power and critical accolades (Oscars, major wins).</li>
                                <li>• <span className="font-bold text-[#ACC8A2]">20% Audience Sentiment:</span> AI-driven analysis of user reviews and common pros/cons.</li>
                             </ul>
                             <p className="mt-4 italic opacity-70">"{result.insights?.scoring_explanation || "The winner was chosen based on superior critical consensus and audience sentiment matching."}"</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
              </div>
            </div>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ReviewSummary({ id, title, mediaType }: { id: number; title: string; mediaType: string }) {
  const { data, isLoading } = useQuery<{ summary: string }>({
    queryKey: ['reviews-summary', id, mediaType],
    queryFn: async () => {
      const { data } = await api.get(`/movies/reviews-summary/${id}`, { params: { title, media_type: mediaType } });
      return data;
    },
    staleTime: 30 * 60 * 1000,
  });

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-[#ACC8A2] uppercase tracking-[0.1em]">{title}</p>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-3 w-full rounded shimmer opacity-30" />
          <div className="h-3 w-4/5 rounded shimmer opacity-30" />
        </div>
      ) : (
        <p className="text-[11px] leading-relaxed text-[rgba(172,200,162,0.7)] font-medium italic">
          "{data?.summary || 'Consensus building... Check back soon!'}"
        </p>
      )}
    </div>
  );
}
