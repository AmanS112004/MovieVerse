export interface Movie {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  genres?: Genre[];
  runtime?: number;
  status?: string;
  tagline?: string;
  media_type?: 'movie' | 'tv';
  original_language?: string;
  _score?: number;
  similarity_score?: number;
  vibe_tags?: string[];
  reason?: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
  order?: number;
  popularity?: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface Video {
  key: string;
  name: string;
}

export interface VibeScores {
  action: number;
  comedy: number;
  dark: number;
  romance: number;
  violence: number;
  story?: number;
  pacing?: number;
}

export interface WatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface WatchProviderRegion {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

export interface OMDBData {
  imdbRating?: string;
  imdbVotes?: string;
  Metascore?: string;
  Ratings?: Array<{ Source: string; Value: string }>;
  Awards?: string;
}

export interface MovieDetail extends Movie {
  credits: Credits;
  trailer: Video | null;
  watchProviders: Record<string, WatchProviderRegion>;
  omdb: OMDBData | null;
  vibe: VibeScores;
  star_power?: number;
  external_ids?: { imdb_id?: string };
  keywords?: { keywords?: Array<{ id: number; name: string }> };
  production_companies?: Array<{ id: number; name: string; logo_path: string | null }>;
  production_countries?: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages?: Array<{ iso_639_1: string; name: string }>;
}

export interface Person {
  id: number;
  name: string;
  biography?: string;
  birthday?: string;
  deathday?: string;
  place_of_birth?: string;
  profile_path: string | null;
  known_for_department?: string;
  popularity?: number;
  topMovies: Movie[];
}

export interface AdvancedComparisonInsight {
  winner_id: number;
  recommendation: string;
  watch_a_if: string;
  watch_b_if: string;
  pros_a: string[];
  cons_a: string[];
  pros_b: string[];
  cons_b: string[];
  audience_sentiment: string;
  audience_type: string;
  scoring_explanation: string;
}

export interface CompareResult {
  movie1: MovieDetail;
  movie2: MovieDetail;
  audienceOverlap: number;
  genreOverlap: number;
  sharedCast: CastMember[];
  scores: {
    movie1: number;
    movie2: number;
    breakdown: {
      rating: [number, number];
      popularity: [number, number];
      vibe: [number, number];
      awards: [number, number];
      audience: [number, number];
    };
  };
  insights: AdvancedComparisonInsight | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CollectionMovie {
  movieId: number;
  title: string;
  poster_path?: string;
  media_type: string;
  addedAt: string;
}

export interface Collection {
  _id: string;
  userId: string;
  name: string;
  description: string;
  movies: CollectionMovie[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

