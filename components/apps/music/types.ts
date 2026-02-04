export interface PlaylistTrack {
  id: string;
  title?: string;
  name?: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  url?: string;
  previewUrl?: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: PlaylistTrack[];
}

export type RepeatMode = "off" | "all" | "one";

export interface PlaybackState {
  isPlaying: boolean;
  currentTrack: PlaylistTrack | null;
  currentTime?: number;
  duration: number;
  queue: PlaylistTrack[];
  originalQueue: PlaylistTrack[];
  queueIndex: number;
  repeatMode: RepeatMode;
  volume: number;
  isShuffle: boolean;
  progress: number;
  error: string | null;
}

export type MusicView = "home" | "browse" | "playlists" | "albums" | "artists" | "songs" | "playlist";
