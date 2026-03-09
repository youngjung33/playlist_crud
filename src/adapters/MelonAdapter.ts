import { createPlaylist, type Playlist } from '../domain/entities/Playlist';
import { createTrack } from '../domain/entities/Track';
import type { IPlaylistSource } from '../domain/repositories/IPlaylistSource';

interface MelonAdapterConfig {
  cookie: string;
  memberKey: string;
  pageSize?: number;
}

interface RawSong {
  id: string;
  title: string;
  artist: string;
  album: string;
}

interface RawPlaylist {
  id: string;
  name: string;
  song_count: number;
  songs: RawSong[];
}

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  Referer: 'https://www.melon.com/',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9',
};

/**
 * 멜론 웹에서 내 플레이리스트를 가져오는 IPlaylistSource 구현체.
 * 쿠키 기반 인증으로 AJAX 엔드포인트를 호출한다.
 *
 * 참고: scripts/fetch_melon_playlists.mjs 와 동일한 로직의 TypeScript 클래스 버전.
 */
export class MelonAdapter implements IPlaylistSource {
  private readonly cookie: string;
  private readonly memberKey: string;
  private readonly pageSize: number;

  constructor(config: MelonAdapterConfig) {
    this.cookie = config.cookie;
    this.memberKey = config.memberKey;
    this.pageSize = config.pageSize ?? 50;
  }

  /**
   * 곡 목록 없이 플레이리스트 목록만 가져온다. (선택 UI용)
   */
  async fetchPlaylistListOnly(): Promise<Array<{ id: string; name: string; song_count: number }>> {
    return this.fetchRawPlaylistList();
  }

  /**
   * 플레이리스트 전체(또는 playlistIds 지정 시 해당만) 곡 목록까지 가져온다.
   * @param playlistIds 없거나 빈 배열이면 전체, 있으면 해당 id만
   */
  async fetchAll(playlistIds?: string[]): Promise<Playlist[]> {
    const rawPlaylists = await this.fetchRawPlaylistList();
    const toFetch =
      playlistIds?.length ? rawPlaylists.filter((p) => playlistIds.includes(p.id)) : rawPlaylists;
    const result: Playlist[] = [];

    for (const raw of toFetch) {
      const songs = await this.fetchRawSongs(raw.id, raw.song_count);
      const tracks = songs.map((s, i) =>
        createTrack({
          title: s.title,
          artist: s.artist,
          album: s.album || null,
          sourceId: s.id,
          position: i + 1,
        })
      );
      const playlist = createPlaylist({
        id: raw.id,
        name: raw.name,
        tracks: tracks as unknown as Array<Record<string, unknown>>,
      });
      result.push(playlist);
      await this.sleep(500);
    }

    return result;
  }

  private static readonly FETCH_TIMEOUT_MS = 20_000;

  private async fetchHtml(url: string, params: Record<string, string | number> = {}): Promise<string> {
    const u = new URL(url);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
    const res = await fetch(u.toString(), {
      headers: { ...DEFAULT_HEADERS, Cookie: this.cookie },
      signal: AbortSignal.timeout(MelonAdapter.FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${u.toString()}`);
    return res.text();
  }

  private async fetchRawPlaylistList(): Promise<Array<{ id: string; name: string; song_count: number }>> {
    const url = 'https://www.melon.com/mymusic/playlist/mymusicplaylist_listAjax.htm';
    const playlists: Array<{ id: string; name: string; song_count: number }> = [];
    let page = 1;

    while (true) {
      const html = await this.fetchHtml(url, {
        memberKey: this.memberKey,
        startIndex: (page - 1) * this.pageSize + 1,
        pageSize: this.pageSize,
      });
      const items = this.parsePlaylistList(html);
      if (items.length === 0) break;
      playlists.push(...items);
      if (items.length < this.pageSize) break;
      page++;
      await this.sleep(500);
    }

    return playlists;
  }

  private async fetchRawSongs(playlistId: string, total: number): Promise<RawSong[]> {
    const url = 'https://www.melon.com/mymusic/playlist/mymusicplaylistview_listSong.htm';
    const songs: RawSong[] = [];
    const totalPages = Math.ceil(total / this.pageSize) || 1;
    let page = 1;

    while (true) {
      const html = await this.fetchHtml(url, { plylstSeq: playlistId, page });
      const items = this.parseSongs(html);
      if (items.length === 0) break;
      songs.push(...items);
      if (items.length < this.pageSize || page >= totalPages) break;
      page++;
      await this.sleep(300);
    }

    return songs;
  }

  private parsePlaylistList(html: string): Array<{ id: string; name: string; song_count: number }> {
    const playlists: Array<{ id: string; name: string; song_count: number }> = [];
    const idRe = /goPlaylistDetail\([^)]*'(\d{6,})'\)/g;
    const seen = new Set<string>();
    let m: RegExpExecArray | null;

    while ((m = idRe.exec(html)) !== null) {
      const id = m[1];
      if (seen.has(id)) continue;
      seen.add(id);

      const block = html.slice(Math.max(0, m.index - 100), m.index + 1500);
      const nameM = /title="([^"]+) - 페이지 이동"/.exec(block);
      const name = nameM ? nameM[1].trim() : id;
      const countM = /총 (\d+)곡/.exec(block);
      const song_count = countM ? parseInt(countM[1]) : 0;

      playlists.push({ id, name, song_count });
    }

    return playlists;
  }

  private parseSongs(html: string): RawSong[] {
    const songs: RawSong[] = [];
    const rows = html.split('<tr');

    for (const row of rows) {
      const idM = /goSongDetail\('(\d+)'\)/.exec(row);
      if (!idM) continue;
      const id = idM[1];

      const titleM = /title="([^"]+) 곡정보 - 페이지 이동"/.exec(row);
      const title = titleM ? titleM[1].trim() : '';

      const artistRe = /goArtistDetail\('[^']+'\)[^>]+>([^<]+)</g;
      const artists: string[] = [];
      let am: RegExpExecArray | null;
      while ((am = artistRe.exec(row)) !== null) {
        const a = am[1].trim();
        if (a && !artists.includes(a)) artists.push(a);
      }
      const artist = artists.join(', ');

      const albumM = /goAlbumDetail\('[^']+'\)[^>]+>([^<]+)</.exec(row);
      const album = albumM ? albumM[1].trim() : '';

      if (id && title) {
        songs.push({ id, title, artist, album });
      }
    }

    return songs;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
