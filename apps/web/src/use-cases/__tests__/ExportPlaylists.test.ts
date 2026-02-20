import { ExportPlaylistsUseCase } from '../ExportPlaylists';

describe('ExportPlaylistsUseCase (실패 케이스)', () => {
  const useCase = new ExportPlaylistsUseCase();

  it('input이 null이면 ok: false', async () => {
    const result = await useCase.run(null as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('required');
  });

  it('input이 undefined이면 ok: false', async () => {
    const result = await useCase.run(undefined as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('playlists가 null이면 ok: false', async () => {
    const result = await useCase.run({ playlists: null as unknown as [], format: 'json' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/playlists|required/);
  });

  it('playlists가 배열이 아니면 ok: false', async () => {
    const result = await useCase.run({ playlists: {} as unknown as [], format: 'json' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('format이 지원하지 않는 값이면 ok: false, error에 format 언급', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'xml' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Unsupported|format|json|csv/);
    }
  });

  it('format이 빈 문자열이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: '' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  describe('성공 케이스', () => {
    it('format json이면 ok: true, JSON 문자열과 contentType 반환', async () => {
      const result = await useCase.run({
        playlists: [
          {
            id: '1',
            name: 'P',
            tracks: [{ title: 'T', artist: 'A', album: null, duration: null, sourceId: null, position: 1 }],
            createdAt: new Date().toISOString(),
          },
        ],
        format: 'json',
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.contentType).toBe('application/json');
        const parsed = JSON.parse(result.content);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].name).toBe('P');
        expect(parsed[0].tracks[0].title).toBe('T');
      }
    });

    it('format csv이면 ok: true, CSV 문자열과 contentType 반환', async () => {
      const result = await useCase.run({
        playlists: [
          {
            id: '1',
            name: 'P',
            tracks: [{ title: 'T', artist: 'A', album: null, duration: null, sourceId: null, position: 1 }],
            createdAt: new Date().toISOString(),
          },
        ],
        format: 'csv',
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.contentType).toBe('text/csv');
        expect(result.content).toContain('name,title,artist,album,position');
        expect(result.content).toContain('P,T,A,');
      }
    });

    it('플레이리스트가 빈 배열이어도 ok: true (json)', async () => {
      const result = await useCase.run({ playlists: [], format: 'json' });
      expect(result.ok).toBe(true);
      if (result.ok) expect(JSON.parse(result.content)).toEqual([]);
    });
  });
});
