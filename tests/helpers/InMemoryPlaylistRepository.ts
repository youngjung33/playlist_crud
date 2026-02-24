import type { IPlaylistRepository } from '../../src/domain/repositories/PlaylistRepository';
import type { Playlist } from '../../src/domain/entities/Playlist';

/**
 * 메모리에만 플레이리스트를 보관하는 IPlaylistRepository 구현. 테스트용.
 */
export class InMemoryPlaylistRepository implements IPlaylistRepository {
  private store: Playlist[] = [];

  async save(playlists: Playlist[]): Promise<void> {
    this.store = [...playlists];
  }

  async findAll(): Promise<Playlist[]> {
    return [...this.store];
  }

  async clear(): Promise<void> {
    this.store = [];
  }
}
