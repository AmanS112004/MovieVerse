import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Movie } from "@/types";
import { ChevronDown } from "lucide-react";
import MovieCard from "./MovieCard";

const GENRES = [
    { label: "All", value: "" },
    { label: "Action", value: 28 },
    { label: "Comedy", value: 35 },
    { label: "Horror", value: 27 },
    { label: "Thriller", value: 53 },
    { label: "Romance", value: 10749 },
];

export default function TopTenSlider({
    onMovieClick,
}: {
    onMovieClick: (movie: Movie) => void;
}) {
    const [genre, setGenre] = useState<number | "">("");
    const [index, setIndex] = useState(0);

    // 🔥 Fetch based on genre
    const { data: movies } = useQuery<Movie[]>({
        queryKey: ["top10", genre],
        queryFn: async () => {
            if (!genre) {
                const { data } = await api.get("/movies/trending");
                return data.slice(0, 10);
            } else {
                const { data } = await api.get("/movies/discover", {
                    params: { genre },
                });
                return data.results.slice(0, 10);
            }
        },
        staleTime: 5 * 60 * 1000,
    });

    // 🔥 Auto slide
    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % 10);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full overflow-hidden">

            {/* 🔥 HEADER */}
            <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-xl font-black text-white uppercase tracking-widest">
                    Top 10 in{" "}
                    <span className="text-[#E11D48]">
                        {GENRES.find((g) => g.value === genre)?.label}
                    </span>
                </h2>

                {/* 🔥 DROPDOWN */}
                <div className="relative">
                    <select
                        value={genre}
                        onChange={(e) =>
                            setGenre(e.target.value ? Number(e.target.value) : "")
                        }
                        className="bg-[#111827] text-white px-4 py-2 rounded-xl border border-white/10"
                    >
                        {GENRES.map((g) => (
                            <option key={g.label} value={g.value}>
                                {g.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 🔥 SLIDER */}
            <div className="flex gap-6 overflow-hidden relative">

                <motion.div
                    animate={{ x: `-${index * 260}px` }}
                    transition={{ ease: "easeInOut", duration: 0.8 }}
                    className="flex gap-6"
                >
                    {movies?.map((movie, i) => (
                        <div key={movie.id} className="relative flex-shrink-0 w-[200px] pl-12">

                            {/* 🔥 NETFLIX BIG NUMBER */}
                            <span
                                className="absolute left-0 top-1/2 -translate-y-1/2 
      text-[220px] font-black leading-none 
      text-black/40 z-[1] select-none pointer-events-none"
                                style={{
                                    WebkitTextStroke: "2px rgba(255,255,255,0.15)",
                                }}
                            >
                                {i + 1}
                            </span>

                            {/* 🎬 CARD */}
                            <div className="relative z-20">
                                <MovieCard
                                    movie={movie}
                                    onClick={onMovieClick}
                                    index={i}
                                />
                            </div>
                        </div>
                    ))}
                </motion.div >

            </div >
        </div >
    );
}