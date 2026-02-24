import type { IPlaylistRepository } from '../domain/repositories/PlaylistRepository';
import type { Playlist } from '../domain/entities/Playlist';

export type GetMyPlaylistsResult =
  | { ok: true; playlists: Playlist[] }
  | { ok: false; error: string };

/**
 * 저장소에서 플레이리스트 전체를 조회하는 유스케이스.
 */
export class GetMyPlaylistsUseCase {
  constructor(private readonly repo: IPlaylistRepository) {}

  /**
   * 저장된 플레이리스트 목록을 반환한다. 저장소 예외 시 ok: false로 에러 메시지를 반환한다.
   */
  async run(): Promise<GetMyPlaylistsResult> {
    try {
      const playlists = await this.repo.findAll();
      return { ok: true, playlists };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { ok: false, error: message };
    }
  }
}
