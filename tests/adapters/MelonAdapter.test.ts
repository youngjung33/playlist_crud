import { MelonAdapter } from '../../src/adapters/MelonAdapter';

// 멜론 플레이리스트 목록 페이지 HTML 샘플
// 실제 멜론 HTML처럼 title 속성이 goPlaylistDetail 호출보다 앞에 위치해야 파싱됨
function makePlaylistHtml(items: Array<{ id: string; name: string; count: number }>): string {
  return items
    .map(
      ({ id, name, count }) =>
        `<a title="${name} - 페이지 이동" onclick="goPlaylistDetail('', '${id}')">` +
        `${name}</a><em>총 ${count}곡</em>`,
    )
    .join('\n');
}

// 멜론 곡 목록 페이지 HTML 샘플 (최소 구조)
function makeSongHtml(
  songs: Array<{ id: string; title: string; artist: string; album: string }>,
): string {
  return songs
    .map(
      ({ id, title, artist, album }) => `
      <tr>
        <td onclick="goSongDetail('${id}')">
          <a title="${title} 곡정보 - 페이지 이동">${title}</a>
        </td>
        <td>
          <a onclick="goArtistDetail('ar1')" href="#">${artist}</a>
        </td>
        <td>
          <a onclick="goAlbumDetail('al1')" href="#">${album}</a>
        </td>
      </tr>
    `,
    )
    .join('\n');
}

describe('MelonAdapter', () => {
  let adapter: MelonAdapter;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    adapter = new MelonAdapter({ cookie: 'test_cookie', memberKey: 'test_key', pageSize: 50 });
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── fetchAll 성공 ───────────────────────────────────────────
  it('플레이리스트 목록이 없으면 빈 배열을 반환한다', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      text: async () => '<html>목록 없음</html>',
    } as Response);

    const result = await adapter.fetchAll();
    expect(result).toEqual([]);
  });

  it('플레이리스트 1개와 곡 2개를 정상적으로 파싱한다', async () => {
    const playlistHtml = makePlaylistHtml([{ id: '123456', name: '내 플레이리스트', count: 2 }]);
    const songHtml = makeSongHtml([
      { id: '1001', title: '노래 A', artist: '아티스트 A', album: '앨범 A' },
      { id: '1002', title: '노래 B', artist: '아티스트 B', album: '앨범 B' },
    ]);

    fetchSpy
      .mockResolvedValueOnce({ ok: true, text: async () => playlistHtml } as Response) // 목록 1페이지
      .mockResolvedValueOnce({ ok: true, text: async () => songHtml } as Response);    // 곡 목록

    const result = await adapter.fetchAll();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('내 플레이리스트');
    expect(result[0].tracks).toHaveLength(2);
    expect(result[0].tracks[0].title).toBe('노래 A');
    expect(result[0].tracks[0].artist).toBe('아티스트 A');
    expect(result[0].tracks[0].position).toBe(1);
    expect(result[0].tracks[1].position).toBe(2);
  });

  it('여러 플레이리스트를 순서대로 반환한다', async () => {
    const playlistHtml = makePlaylistHtml([
      { id: '111111', name: '봄 리스트', count: 1 },
      { id: '222222', name: '여름 리스트', count: 1 },
    ]);
    const song1Html = makeSongHtml([{ id: '1', title: '봄 노래', artist: 'A', album: '' }]);
    const song2Html = makeSongHtml([{ id: '2', title: '여름 노래', artist: 'B', album: '' }]);

    fetchSpy
      .mockResolvedValueOnce({ ok: true, text: async () => playlistHtml } as Response)
      .mockResolvedValueOnce({ ok: true, text: async () => song1Html } as Response)
      .mockResolvedValueOnce({ ok: true, text: async () => song2Html } as Response);

    const result = await adapter.fetchAll();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('봄 리스트');
    expect(result[1].name).toBe('여름 리스트');
  });

  it('sourceId가 곡 원본 id와 일치한다', async () => {
    const playlistHtml = makePlaylistHtml([{ id: '999999', name: 'PL', count: 1 }]);
    const songHtml = makeSongHtml([{ id: '7777', title: 'T', artist: 'A', album: '' }]);

    fetchSpy
      .mockResolvedValueOnce({ ok: true, text: async () => playlistHtml } as Response)
      .mockResolvedValueOnce({ ok: true, text: async () => songHtml } as Response);

    const result = await adapter.fetchAll();
    expect(result[0].tracks[0].sourceId).toBe('7777');
  });

  // ─── fetchAll 오류 ───────────────────────────────────────────
  it('HTTP 오류 시 Error를 throw한다', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 403, text: async () => '' } as Response);

    await expect(adapter.fetchAll()).rejects.toThrow('HTTP 403');
  });

  it('네트워크 오류(fetch reject) 시 Error가 전파된다', async () => {
    fetchSpy.mockRejectedValue(new Error('Network error'));

    await expect(adapter.fetchAll()).rejects.toThrow('Network error');
  });

  // ─── 생성자 기본값 ────────────────────────────────────────────
  it('pageSize를 지정하지 않으면 기본값 50을 사용한다', () => {
    const defaultAdapter = new MelonAdapter({ cookie: 'c', memberKey: 'k' });
    // pageSize 는 private이지만 pageSize=50 기본값으로 URL 파라미터에 반영됨
    // 실제로는 fetch 호출 시 pageSize=50 이 URL에 포함되는지 검증
    fetchSpy.mockResolvedValue({ ok: true, text: async () => '' } as Response);

    // fetchAll 호출 후 fetch에 전달된 URL에 pageSize=50 포함 여부 확인
    return defaultAdapter.fetchAll().then(() => {
      const calledUrl = String((fetchSpy.mock.calls[0][0] as string) ?? '');
      expect(calledUrl).toContain('pageSize=50');
    });
  });
});
