import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TMDB_IMG = 'https://image.tmdb.org/t/p';
export const IMG_W500 = `${TMDB_IMG}/w500`;
export const IMG_W780 = `${TMDB_IMG}/w780`;
export const IMG_ORIGINAL = `${TMDB_IMG}/original`;

export function getPosterUrl(path: string | null | undefined, size = 'w500') {
  if (!path) return '/placeholder-poster.svg';
  return `${TMDB_IMG}/${size}${path}`;
}

export function getBackdropUrl(path: string | null | undefined) {
  if (!path) return '';
  return `${TMDB_IMG}/original${path}`;
}

export function formatRuntime(minutes: number | null | undefined) {
  if (!minutes) return 'N/A';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatDate(date: string | null | undefined) {
  if (!date) return 'N/A';
  return new Date(date).getFullYear();
}

export function formatFullDate(date: string | null | undefined) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function truncate(text: string, length: number) {
  if (!text) return '';
  return text.length > length ? text.slice(0, length) + '...' : text;
}

export function getRatingColor(rating: number) {
  if (rating >= 7.5) return '#ACC8A2';
  if (rating >= 6) return 'rgba(172, 200, 162, 0.7)';
  return 'rgba(172, 200, 162, 0.4)';
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
};

export const OTT_ICONS: Record<string, string> = {
  'Netflix': '🎬',
  'Amazon Prime Video': '📦',
  'Disney+ Hotstar': '✨',
  'Zee5': '🔵',
  'SonyLIV': '🟠',
  'Voot': '🟣',
  'MX Player': '▶️',
  'Apple TV': '🍎',
  'Hulu': '🟢',
  'HBO Max': '🔷',
  'Peacock': '🦚',
  'Paramount+': '⭐',
};
