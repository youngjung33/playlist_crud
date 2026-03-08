import fs from 'fs';
import { FilePlaylistRepository } from '../../src/adapters/FilePlaylistRepository';

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

const FAKE_PATH = '/fake/playlists.json';

function makeRepo() {
  return new FilePlaylistRepository(FAKE_PATH);
}

describe('FilePlaylistRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── findAll ─────────────────────────────────────────────────
  describe('findAll()', () => {
    it('파일이 없으면 빈 배열을 반환한다', async () => {
      mockFs.existsSync.mockReturnValue(false);
      expect(await makeRepo().findAll()).toEqual([]);
    });

    it('도메인 포맷(tracks) 파일을 읽어 Playlist 배열로 반환한다', async () => {
      const data = JSON.stringify([
        {
          id: 'pl1',
          name: '내 플레이리스트',
          tracks: [
            { title: 'Song A', artist: 'Artist A', album: 'Album A', sourceId: '100', position: 1 },
          ],
        },
      ]);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(data);

      const result = await makeRepo().findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pl1');
      expect(result[0].name).toBe('내 플레이리스트');
      expect(result[0].tracks).toHaveLength(1);
      expect(result[0].tracks[0].title).toBe('Song A');
      expect(result[0].tracks[0].artist).toBe('Artist A');
      expect(result[0].tracks[0].sourceId).toBe('100');
    });

    it('멜론 원본 포맷(songs) 파일을 읽어 Playlist 배열로 반환한다', async () => {
      const data = JSON.stringify([
        {
          id: 'pl2',
          name: '멜론 플레이리스트',
          songs: [
            { id: '999', title: '멜론 노래', artist: '멜론 아티스트', album: '멜론 앨범' },
          ],
        },
      ]);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(data);

      const result = await makeRepo().findAll();

      expect(result).toHaveLength(1);
      expect(result[0].tracks[0].title).toBe('멜론 노래');
      expect(result[0].tracks[0].sourceId).toBe('999');
    });

    it('album이 없는 track도 null로 처리한다', async () => {
      const data = JSON.stringify([
        {
          id: 'pl3',
          name: '앨범 없는 목록',
          tracks: [{ title: 'No Album', artist: 'Artist' }],
        },
      ]);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(data);

      const result = await makeRepo().findAll();
      expect(result[0].tracks[0].album).toBeNull();
    });

    it('여러 플레이리스트를 모두 반환한다', async () => {
      const data = JSON.stringify([
        { id: 'a', name: 'A', tracks: [] },
        { id: 'b', name: 'B', tracks: [] },
        { id: 'c', name: 'C', tracks: [] },
      ]);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(data);

      const result = await makeRepo().findAll();
      expect(result).toHaveLength(3);
      expect(result.map((p) => p.name)).toEqual(['A', 'B', 'C']);
    });
  });

  // ─── save ─────────────────────────────────────────────────────
  describe('save()', () => {
    it('플레이리스트 배열을 JSON 파일로 저장한다', async () => {
      mockFs.writeFileSync.mockImplementation(() => {});

      await makeRepo().save([]);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(FAKE_PATH, '[]', 'utf-8');
    });

    it('저장 시 writeFileSync에 올바른 경로를 사용한다', async () => {
      const customPath = '/custom/path.json';
      mockFs.writeFileSync.mockImplementation(() => {});

      await new FilePlaylistRepository(customPath).save([]);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(customPath, expect.any(String), 'utf-8');
    });
  });

  // ─── clear ────────────────────────────────────────────────────
  describe('clear()', () => {
    it('파일을 빈 배열로 덮어쓴다', async () => {
      mockFs.writeFileSync.mockImplementation(() => {});

      await makeRepo().clear();

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(FAKE_PATH, '[]', 'utf-8');
    });
  });
});
