import { ImportPlaylistsUseCase } from '../ImportPlaylists';
import { InMemoryPlaylistRepository } from '../../adapters/InMemoryPlaylistRepository';

describe('ImportPlaylistsUseCase (실패 케이스)', () => {
  const repo = new InMemoryPlaylistRepository();
  const useCase = new ImportPlaylistsUseCase(repo);

  beforeEach(async () => {
    await repo.clear();
  });

  it('input이 null이면 ok: false, error 반환', async () => {
    const result = await useCase.run(null as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('required');
  });

  it('input이 undefined이면 ok: false, error 반환', async () => {
    const result = await useCase.run(undefined as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('required');
  });

  it('input이 배열이 아니면 ok: false, error 반환', async () => {
    const result = await useCase.run({} as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('input이 문자열이면 ok: false', async () => {
    const result = await useCase.run('hello' as unknown);
    expect(result.ok).toBe(false);
  });

  it('플레이리스트 항목에 name이 없으면 ok: false, error에 인덱스 포함', async () => {
    const result = await useCase.run([{ tracks: [] }] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/index 0|name/);
    }
  });

  it('플레이리스트 name이 빈 문자열이면 ok: false', async () => {
    const result = await useCase.run([{ name: '', tracks: [] }] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/name|index/);
  });

  it('트랙에 title이 없으면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'My List', tracks: [{ artist: 'Artist' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('트랙에 artist가 없으면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'My List', tracks: [{ title: 'Song' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('트랙 title이 빈 문자열이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'My List', tracks: [{ title: '', artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
  });

  it('트랙 artist가 빈 문자열이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'My List', tracks: [{ title: 'T', artist: '' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
  });

  describe('성공 케이스', () => {
    it('유효한 플레이리스트 배열이면 ok: true, count 반환', async () => {
      const result = await useCase.run([
        { name: 'My List', tracks: [{ title: 'Song', artist: 'Artist' }] },
      ] as unknown);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.count).toBe(1);
    });

    it('여러 플레이리스트면 count가 개수와 같음', async () => {
      const result = await useCase.run([
        { name: 'A', tracks: [{ title: 'T1', artist: 'A1' }] },
        { name: 'B', tracks: [] },
      ] as unknown);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.count).toBe(2);
    });

    it('저장 후 GetMyPlaylists로 조회 가능', async () => {
      await useCase.run([
        { name: 'Saved', tracks: [{ title: 'S', artist: 'Ar' }] },
      ] as unknown);
      const { GetMyPlaylistsUseCase } = await import('../GetMyPlaylists');
      const getUseCase = new GetMyPlaylistsUseCase(repo);
      const got = await getUseCase.run();
      expect(got.ok).toBe(true);
      if (got.ok) {
        expect(got.playlists).toHaveLength(1);
        expect(got.playlists[0].name).toBe('Saved');
        expect(got.playlists[0].tracks[0].title).toBe('S');
        expect(got.playlists[0].tracks[0].artist).toBe('Ar');
      }
    });
  });
});
