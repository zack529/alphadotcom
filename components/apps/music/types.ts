export interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  url?: string;
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
  currentTime: number;
  duration: number;
}

export type MusicView = "playlists" | "albums" | "artists" | "songs";
