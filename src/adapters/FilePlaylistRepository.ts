import fs from 'fs';
import path from 'path';
import { createPlaylist, type Playlist } from '../domain/entities/Playlist';
import type { IPlaylistRepository } from '../domain/repositories/PlaylistRepository';

/**
 * playlists.json 파일 기반 IPlaylistRepository 구현체.
 * 멜론 원본 포맷(songs[])과 도메인 포맷(tracks[]) 모두 읽을 수 있다.
 */

interface RawTrack {
  id?: string;
  title?: string;
  artist?: string;
  album?: string | null;
  sourceId?: string | null;
  position?: number | null;
}

interface RawEntry {
  id: string;
  name: string;
  songs?: RawTrack[];   // 멜론 원본 포맷
  tracks?: RawTrack[];  // 도메인 저장 포맷
}

export class FilePlaylistRepository implements IPlaylistRepository {
  private readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath ?? path.join(process.cwd(), 'playlists.json');
  }

  async findAll(): Promise<Playlist[]> {
    if (!fs.existsSync(this.filePath)) return [];

    const raw: RawEntry[] = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));

    return raw.map((entry) => {
      const rawTracks = (entry.tracks ?? entry.songs ?? []).map((t) => ({
        title: t.title ?? '',
        artist: t.artist ?? '',
        album: t.album ?? null,
        sourceId: t.sourceId ?? t.id ?? null,
        position: t.position ?? null,
      }));

      return createPlaylist({
        id: entry.id,
        name: entry.name,
        tracks: rawTracks as Array<Record<string, unknown>>,
      });
    });
  }

  async save(playlists: Playlist[]): Promise<void> {
    fs.writeFileSync(this.filePath, JSON.stringify(playlists, null, 2), 'utf-8');
  }

  async clear(): Promise<void> {
    fs.writeFileSync(this.filePath, '[]', 'utf-8');
  }
}
