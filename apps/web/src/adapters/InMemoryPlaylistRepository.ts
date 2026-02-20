import type { IPlaylistRepository } from '../domain/repositories/PlaylistRepository';
import type { Playlist } from '../domain/entities/Playlist';

/**
 * 메모리에만 플레이리스트를 보관하는 IPlaylistRepository 구현. 테스트·CLI용.
 */
export class InMemoryPlaylistRepository implements IPlaylistRepository {
  // 내부 저장 배열 (덮어쓰기 방식)
  private store: Playlist[] = [];

  /** 현재 목록을 전부 인자로 받은 목록으로 교체한다. */
  async save(playlists: Playlist[]): Promise<void> {
    this.store = [...playlists];
  }

  /** 저장된 플레이리스트 전체를 반환한다. */
  async findAll(): Promise<Playlist[]> {
    return [...this.store];
  }

  /** 저장된 목록을 비운다. */
  async clear(): Promise<void> {
    this.store = [];
  }
}
