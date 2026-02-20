import { GetMyPlaylistsUseCase } from '../GetMyPlaylists';
import type { IPlaylistRepository } from '../../domain/repositories/PlaylistRepository';

describe('GetMyPlaylistsUseCase (실패 케이스)', () => {
  it('리포지토리에서 예외가 나면 ok: false, error 반환', async () => {
    const throwingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: async () => {
        throw new Error('DB connection failed');
      },
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(throwingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('DB connection failed');
  });

  it('리포지토리가 문자열을 throw하면 error에 그 내용 반환', async () => {
    const throwingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: async () => {
        throw 'something wrong';
      },
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(throwingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('something wrong');
  });

  describe('성공 케이스', () => {
    it('저장된 플레이리스트가 없으면 ok: true, playlists 빈 배열', async () => {
      const { InMemoryPlaylistRepository } = await import('../../adapters/InMemoryPlaylistRepository');
      const repo = new InMemoryPlaylistRepository();
      const useCase = new GetMyPlaylistsUseCase(repo);
      const result = await useCase.run();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.playlists).toEqual([]);
    });

    it('저장된 플레이리스트가 있으면 ok: true, playlists 반환', async () => {
      const { InMemoryPlaylistRepository } = await import('../../adapters/InMemoryPlaylistRepository');
      const repo = new InMemoryPlaylistRepository();
      await repo.save([
        {
          id: '1',
          name: 'My List',
          tracks: [{ title: 'T', artist: 'A', album: null, duration: null, sourceId: null, position: 1 }],
          createdAt: new Date().toISOString(),
        },
      ]);
      const useCase = new GetMyPlaylistsUseCase(repo);
      const result = await useCase.run();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.playlists).toHaveLength(1);
        expect(result.playlists[0].name).toBe('My List');
      }
    });
  });
});
