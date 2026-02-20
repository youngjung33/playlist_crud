import { createTrack, isTrack, type Track } from './Track';

export interface PlaylistInput {
  id?: string | null;
  name: string;
  tracks?: Array<Record<string, unknown>>;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: string;
}

/**
 * 입력을 검증한 뒤 Playlist 엔티티를 만든다. name은 필수이며, tracks는 createTrack으로 검증한다.
 */
export function createPlaylist(input: PlaylistInput): Playlist {
  const name = input.name != null ? String(input.name).trim() : '';
  if (!name) {
    throw new Error('Playlist must have a non-empty name');
  }
  const rawTracks = Array.isArray(input.tracks) ? input.tracks : [];
  const tracks = rawTracks.map((t, i) => {
    if (isTrack(t) && t.title.trim() !== '' && t.artist.trim() !== '') return t;
    const pos = (t as { position?: number }).position ?? i + 1;
    return createTrack({ ...(t as Record<string, unknown>), position: pos } as Parameters<typeof createTrack>[0]);
  });
  return {
    id: input.id ?? `playlist_${Date.now()}`,
    name: name || 'Untitled',
    tracks,
    createdAt: new Date().toISOString(),
  };
}

/**
 * value가 Playlist 형태인지 검사한다. (타입 가드)
 */
export function isPlaylist(value: unknown): value is Playlist {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'tracks' in value &&
    typeof (value as Playlist).name === 'string' &&
    Array.isArray((value as Playlist).tracks)
  );
}
