import type { Playlist } from '../entities/Playlist';

/**
 * 플레이리스트 저장소 계약. save / findAll / clear를 구현한다.
 */
export interface IPlaylistRepository {
  save(playlists: Playlist[]): Promise<void>;
  findAll(): Promise<Playlist[]>;
  clear(): Promise<void>;
}
