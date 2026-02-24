import type { Playlist } from '../entities/Playlist';

/**
 * 외부 음악 서비스(예: YouTube Music)에 플레이리스트를 가져오는 서비스의 계약.
 */
export interface IMusicService {
  createPlaylist(playlist: Playlist): Promise<string>;
  addTracks(playlistId: string, videoIds: string[]): Promise<void>;
}
