import type { IPlaylistRepository } from '../domain/repositories/PlaylistRepository';
import { createPlaylist, type Playlist } from '../domain/entities/Playlist';

export type ImportPlaylistsInput = unknown;

export type ImportPlaylistsResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

/**
 * 원시 입력(배열)을 검증·정규화한 뒤 저장소에 저장하는 유스케이스.
 */
export class ImportPlaylistsUseCase {
  constructor(private readonly repo: IPlaylistRepository) {}

  /**
   * 입력 배열을 플레이리스트로 변환해 저장하고, 성공 시 개수를 반환한다.
   */
  async run(input: ImportPlaylistsInput): Promise<ImportPlaylistsResult> {
    if (input == null) {
      return { ok: false, error: 'Input is required' };
    }
    if (!Array.isArray(input)) {
      return { ok: false, error: 'Input must be an array of playlists' };
    }
    const playlists: Playlist[] = [];
    for (let i = 0; i < input.length; i++) {
      const raw = input[i];
      try {
        const name = raw != null && typeof raw === 'object' && 'name' in raw
          ? String((raw as { name: unknown }).name).trim()
          : '';
        if (!name) {
          return { ok: false, error: `Playlist at index ${i} must have a non-empty name` };
        }
        playlists.push(createPlaylist({
          id: (raw as { id?: string }).id,
          name,
          tracks: (raw as { tracks?: unknown }).tracks,
        } as { id?: string; name: string; tracks?: unknown }));
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return { ok: false, error: `Playlist at index ${i}: ${message}` };
      }
    }
    await this.repo.save(playlists);
    return { ok: true, count: playlists.length };
  }
}
