import type { Playlist } from '../entities/Playlist';

/**
 * 외부 음악 서비스(예: 멜론)에서 플레이리스트를 가져오는 소스의 계약.
 */
export interface IPlaylistSource {
  fetchAll(): Promise<Playlist[]>;
}
