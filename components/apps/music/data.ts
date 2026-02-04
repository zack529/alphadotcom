import { Playlist, PlaylistTrack } from "./types";

export const playlists: Playlist[] = [];
export const tracks: PlaylistTrack[] = [];
export const albums: string[] = [];
export const artists: string[] = [];

export const DEFAULT_PLAYLISTS: Playlist[] = [];

export function getAlbumsFromPlaylists(playlists?: Playlist[]) {
  return [] as { name: string; artist: string; artwork: string; tracks: PlaylistTrack[] }[];
}

export function getArtistsFromPlaylists(playlists?: Playlist[]) {
  return [] as { name: string; artwork: string; tracks: PlaylistTrack[] }[];
}

export function getAllSongs(playlists?: Playlist[]) {
  return [] as PlaylistTrack[];
}

export function getFeaturedPlaylist(): Playlist {
  return { id: "", name: "", tracks: [] };
}
