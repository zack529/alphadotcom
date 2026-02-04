export interface PlaylistTrack {
  id: string;
  title: string;
  name?: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
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
  queue: PlaylistTrack[];
  queueIndex: number;
  repeatMode: RepeatMode;
}

export type MusicView = "playlists" | "albums" | "artists" | "songs";
