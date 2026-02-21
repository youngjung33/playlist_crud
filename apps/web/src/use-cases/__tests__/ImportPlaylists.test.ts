import { ImportPlaylistsUseCase } from '../ImportPlaylists';
import { GetMyPlaylistsUseCase } from '../GetMyPlaylists';
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

  it('플레이리스트 항목이 null이면 ok: false, error에 인덱스 포함', async () => {
    const result = await useCase.run([null] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|name/);
  });

  it('플레이리스트 항목이 숫자면 ok: false', async () => {
    const result = await useCase.run([42] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|name/);
  });

  it('플레이리스트 name이 공백만이면 ok: false', async () => {
    const result = await useCase.run([{ name: '   ', tracks: [] }] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/name|index/);
  });

  it('tracks가 배열이 아니면 ok: false (createPlaylist에서 예외)', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: 'not-array' },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0/);
  });

  it('두 번째 플레이리스트에서 name 없으면 ok: false, index 1 언급', async () => {
    const result = await useCase.run([
      { name: 'Good', tracks: [] },
      { tracks: [] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 1');
  });

  it('두 번째 플레이리스트 트랙에 title 없으면 ok: false, index 1', async () => {
    const result = await useCase.run([
      { name: 'A', tracks: [] },
      { name: 'B', tracks: [{ artist: 'Only' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 1');
  });

  it('트랙이 객체가 아니면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: ['string-track'] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|title|artist/);
  });

  it('input이 숫자면 ok: false', async () => {
    const result = await useCase.run(0 as unknown);
    expect(result.ok).toBe(false);
  });

  it('input이 boolean이면 ok: false', async () => {
    const result = await useCase.run(true as unknown);
    expect(result.ok).toBe(false);
  });

  it('input이 함수면 ok: false', async () => {
    const result = await useCase.run((() => {}) as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('input이 Symbol이면 ok: false', async () => {
    const result = await useCase.run(Symbol('x') as unknown);
    expect(result.ok).toBe(false);
  });

  it('플레이리스트 항목이 undefined면 ok: false', async () => {
    const result = await useCase.run([undefined] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|name/);
  });

  it('플레이리스트 항목이 빈 배열이면 ok: false (객체 아님)', async () => {
    const result = await useCase.run([[]] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|name/);
  });

  it('트랙 title이 null이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: null, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('트랙 artist가 null이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: null }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('트랙 title이 undefined면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('트랙 artist가 undefined면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('tracks에 null이 포함되면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [null] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|title|artist/);
  });

  it('tracks가 객체면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: { 0: { title: 'T', artist: 'A' } } },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|array/);
  });

  it('세 번째 플레이리스트(index 2)에서 name 없으면 error에 index 2', async () => {
    const result = await useCase.run([
      { name: 'A', tracks: [] },
      { name: 'B', tracks: [] },
      { tracks: [] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 2');
  });

  it('트랙이 숫자면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [123] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|title|artist/);
  });

  it('트랙이 boolean이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [true] },
    ] as unknown);
    expect(result.ok).toBe(false);
  });

  it('input이 Date 객체면 ok: false', async () => {
    const result = await useCase.run(new Date() as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('input이 RegExp면 ok: false', async () => {
    const result = await useCase.run(/abc/ as unknown);
    expect(result.ok).toBe(false);
  });

  it('input이 Map이면 ok: false', async () => {
    const result = await useCase.run(new Map() as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('input이 Set이면 ok: false', async () => {
    const result = await useCase.run(new Set() as unknown);
    expect(result.ok).toBe(false);
  });

  it('트랙 title이 숫자 0이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 0, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('트랙 artist가 숫자 0이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: 0 }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('트랙 title이 NaN이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: NaN, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('트랙이 빈 객체면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{}] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|artist|index/);
  });

  it('같은 플레이리스트 내 두 번째 트랙에 title 없으면 ok: false', async () => {
    const result = await useCase.run([
      {
        name: 'P',
        tracks: [
          { title: 'T1', artist: 'A1' },
          { artist: 'A2' },
        ],
      },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|title/);
  });

  it('tracks가 null이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: null },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|array/);
  });

  it('네 번째 플레이리스트(index 3)에서 name 없으면 error에 index 3', async () => {
    const result = await useCase.run([
      { name: 'A', tracks: [] },
      { name: 'B', tracks: [] },
      { name: 'C', tracks: [] },
      { tracks: [] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 3');
  });

  it('플레이리스트에 name 필드가 없고 id만 있으면 ok: false', async () => {
    const result = await useCase.run([
      { id: 'only-id', tracks: [] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|name/);
  });

  it('트랙에 title이 배열이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: [], artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('트랙에 artist가 객체면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: {} }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('input이 BigInt면 ok: false', async () => {
    const result = await useCase.run(BigInt(1) as unknown);
    expect(result.ok).toBe(false);
  });

  it('플레이리스트 항목이 Symbol이면 ok: false', async () => {
    const result = await useCase.run([Symbol('x')] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|name/);
  });

  it('플레이리스트가 Object.create(null)이면 name 없어서 ok: false', async () => {
    const result = await useCase.run([Object.create(null)] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|name/);
  });

  it('트랙 title이 Infinity이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: Infinity, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('트랙 artist가 배열이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: ['A'] }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('트랙 artist가 NaN이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: NaN }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('tracks가 숫자면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: 99 },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|array/);
  });

  it('tracks가 true면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: true },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|array/);
  });

  it('다섯 번째 플레이리스트(index 4)에서 name 없으면 error에 index 4', async () => {
    const result = await useCase.run([
      { name: 'A', tracks: [] },
      { name: 'B', tracks: [] },
      { name: 'C', tracks: [] },
      { name: 'D', tracks: [] },
      { tracks: [] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 4');
  });

  it('같은 플레이리스트 내 세 번째 트랙에 artist 없으면 ok: false', async () => {
    const result = await useCase.run([
      {
        name: 'P',
        tracks: [
          { title: 'T1', artist: 'A1' },
          { title: 'T2', artist: 'A2' },
          { title: 'T3' },
        ],
      },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|artist/);
  });

  it('트랙에 title이 함수면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: (() => {}) as unknown, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('트랙에 artist가 Symbol이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: Symbol('a') as unknown }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('input이 WeakSet이면 ok: false', async () => {
    const result = await useCase.run(new WeakSet() as unknown);
    expect(result.ok).toBe(false);
  });

  it('input이 NaN이면 ok: false', async () => {
    const result = await useCase.run(NaN as unknown);
    expect(result.ok).toBe(false);
  });

  it('input이 Infinity이면 ok: false', async () => {
    const result = await useCase.run(Infinity as unknown);
    expect(result.ok).toBe(false);
  });

  it('input이 빈 슬롯 배열 Array(2)면 항목이 undefined라 ok: false', async () => {
    const result = await useCase.run(Array(2) as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|name/);
  });

  it('플레이리스트 name이 빈 배열이면 ok: false', async () => {
    const result = await useCase.run([{ name: [], tracks: [] }] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/name|index/);
  });

  it('플레이리스트 name이 탭만 있으면 ok: false', async () => {
    const result = await useCase.run([{ name: '\t\t', tracks: [] }] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/name|index/);
  });

  it('플레이리스트 name이 개행만 있으면 ok: false', async () => {
    const result = await useCase.run([{ name: '\n\r', tracks: [] }] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/name|index/);
  });

  it('트랙 title이 -1이면 ok: false (숫자)', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: -1, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('트랙 artist가 -1이면 ok: false (숫자)', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: -1 }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('트랙 title이 RegExp면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: /regex/ as unknown, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('트랙 title이 Date 객체면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: new Date() as unknown, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('tracks가 false면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: false },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|array/);
  });

  it('input이 Uint8Array면 ok: false (배열 아님)', async () => {
    const result = await useCase.run(new Uint8Array(0) as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('많은 항목 중 50번째(index 49)에서 name 없으면 error에 index 49', async () => {
    const arr = Array(50).fill(null).map((_, i) =>
      i === 49 ? { tracks: [] } : { name: `List${i}`, tracks: [] }
    );
    const result = await useCase.run(arr as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 49');
  });

  it('플레이리스트에 tracks만 있고 name 없으면 ok: false', async () => {
    const result = await useCase.run([
      { tracks: [{ title: 'T', artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|name/);
  });

  it('트랙에 artist가 null이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: null }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('트랙에 title이 undefined이고 artist만 있으면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: undefined, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('트랙에 title이 BigInt면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: BigInt(1) as unknown, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('트랙에 artist가 BigInt면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: BigInt(2) as unknown }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('트랙에 title이 Symbol이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: Symbol('t') as unknown, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('tracks가 Map이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: new Map() },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|array/);
  });

  it('tracks가 Set이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: new Set() },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|array/);
  });

  it('input이 ArrayBuffer면 ok: false', async () => {
    const result = await useCase.run(new ArrayBuffer(0) as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('input이 Int32Array면 ok: false', async () => {
    const result = await useCase.run(new Int32Array(0) as unknown);
    expect(result.ok).toBe(false);
  });

  it('첫 번째는 유효하고 두 번째 플레이리스트 tracks가 null이면 ok: false, index 1', async () => {
    const result = await useCase.run([
      { name: 'A', tracks: [] },
      { name: 'B', tracks: null },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 1');
  });

  it('트랙에 title과 artist 둘 다 undefined면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{}] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|artist|index/);
  });

  it('tracks 배열 안에 undefined가 섞여 있으면 ok: false', async () => {
    const result = await useCase.run([
      {
        name: 'P',
        tracks: [
          { title: 'T1', artist: 'A1' },
          undefined,
        ],
      },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|title|artist/);
  });

  it('같은 플레이리스트 내 네 번째 트랙에 title 빈 문자열이면 ok: false', async () => {
    const result = await useCase.run([
      {
        name: 'P',
        tracks: [
          { title: 'T1', artist: 'A1' },
          { title: 'T2', artist: 'A2' },
          { title: 'T3', artist: 'A3' },
          { title: '', artist: 'A4' },
        ],
      },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|title/);
  });

  it('name이 100자 공백이면 ok: false', async () => {
    const result = await useCase.run([
      { name: ' '.repeat(100), tracks: [] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/name|index/);
  });

  it('플레이리스트 항목이 함수면 ok: false', async () => {
    const result = await useCase.run([function fn() {}] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|name/);
  });

  it('input이 Float32Array면 ok: false', async () => {
    const result = await useCase.run(new Float32Array(0) as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('트랙에 artist가 RegExp면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: /a/ as unknown }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('트랙에 artist가 Date면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: new Date() as unknown }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('세 번째 플레이리스트(index 2) tracks가 문자열이면 ok: false, index 2', async () => {
    const result = await useCase.run([
      { name: 'A', tracks: [] },
      { name: 'B', tracks: [] },
      { name: 'C', tracks: 'invalid' },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 2');
  });

  it('같은 플레이리스트 내 두 번째 트랙에 artist 빈 문자열이면 ok: false', async () => {
    const result = await useCase.run([
      {
        name: 'P',
        tracks: [
          { title: 'T1', artist: 'A1' },
          { title: 'T2', artist: '' },
        ],
      },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|artist/);
  });

  it('input이 arguments 유사 배열이면 ok: false', async () => {
    const args = (function (...a: unknown[]) {
      return arguments;
    })();
    const result = await useCase.run(args as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('여섯 번째 플레이리스트(index 5)에서 name 공백만이면 error에 index 5', async () => {
    const result = await useCase.run([
      { name: 'A', tracks: [] },
      { name: 'B', tracks: [] },
      { name: 'C', tracks: [] },
      { name: 'D', tracks: [] },
      { name: 'E', tracks: [] },
      { name: '   ', tracks: [] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 5');
  });

  it('트랙에 title이 공백만이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: '   ', artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('tracks가 TypedArray면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: new Float64Array(0) },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|array/);
  });

  it('input이 DataView면 ok: false', async () => {
    const result = await useCase.run(new DataView(new ArrayBuffer(0)) as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('트랙에 title이 Map이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: new Map() as unknown, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('트랙에 artist가 함수면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: (() => {}) as unknown }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('tracks가 제너레이터 결과(이터러블)면 ok: false', async () => {
    const gen = function* () { yield { title: 'T', artist: 'A' }; }();
    const result = await useCase.run([
      { name: 'P', tracks: gen },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|array/);
  });

  it('일곱 번째 플레이리스트(index 6)에서 tracks가 객체면 error에 index 6', async () => {
    const result = await useCase.run([
      { name: 'A', tracks: [] },
      { name: 'B', tracks: [] },
      { name: 'C', tracks: [] },
      { name: 'D', tracks: [] },
      { name: 'E', tracks: [] },
      { name: 'F', tracks: [] },
      { name: 'G', tracks: {} },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 6');
  });

  it('input이 -1이면 ok: false', async () => {
    const result = await useCase.run(-1 as unknown);
    expect(result.ok).toBe(false);
  });

  it('name이 \\r\\n만 있으면 ok: false', async () => {
    const result = await useCase.run([{ name: '\r\n', tracks: [] }] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/name|index/);
  });

  it('트랙 두 개 중 두 번째에 title·artist 둘 다 없으면 ok: false', async () => {
    const result = await useCase.run([
      {
        name: 'P',
        tracks: [
          { title: 'T1', artist: 'A1' },
          {},
        ],
      },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|title|artist/);
  });

  it('input이 BigInt(0)면 ok: false', async () => {
    const result = await useCase.run(BigInt(0) as unknown);
    expect(result.ok).toBe(false);
  });

  it('플레이리스트 name이 \t\n 조합만 있으면 ok: false', async () => {
    const result = await useCase.run([{ name: '\t\n \t', tracks: [] }] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/name|index/);
  });

  it('input이 Promise면 ok: false', async () => {
    const result = await useCase.run(Promise.resolve() as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('트랙에 title이 Set이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: new Set() as unknown, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('트랙에 artist가 Set이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: new Set() as unknown }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('tracks가 WeakMap이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: new WeakMap() as unknown },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|array/);
  });

  it('여덟 번째 플레이리스트(index 7)에서 name 없으면 error에 index 7', async () => {
    const result = await useCase.run([
      { name: 'A', tracks: [] },
      { name: 'B', tracks: [] },
      { name: 'C', tracks: [] },
      { name: 'D', tracks: [] },
      { name: 'E', tracks: [] },
      { name: 'F', tracks: [] },
      { name: 'G', tracks: [] },
      { tracks: [] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 7');
  });

  it('input이 3.14 (소수)면 ok: false', async () => {
    const result = await useCase.run(3.14 as unknown);
    expect(result.ok).toBe(false);
  });

  it('플레이리스트 항목이 빈 class 인스턴스면 name 없어서 ok: false', async () => {
    class Empty {}
    const result = await useCase.run([new Empty()] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|name/);
  });

  it('트랙에 title이 Error 객체면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: new Error('x') as unknown, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('tracks가 Iterator 객체면 ok: false', async () => {
    const iter = [1, 2, 3][Symbol.iterator]();
    const result = await useCase.run([
      { name: 'P', tracks: iter as unknown },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|array/);
  });

  it('트랙에 artist가 Error 객체면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: new Error('e') as unknown }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('tracks가 ArrayBuffer면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: new ArrayBuffer(0) },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|array/);
  });

  it('아홉 번째 플레이리스트(index 8)에서 tracks가 숫자면 error에 index 8', async () => {
    const result = await useCase.run([
      { name: 'A', tracks: [] },
      { name: 'B', tracks: [] },
      { name: 'C', tracks: [] },
      { name: 'D', tracks: [] },
      { name: 'E', tracks: [] },
      { name: 'F', tracks: [] },
      { name: 'G', tracks: [] },
      { name: 'H', tracks: [] },
      { name: 'I', tracks: 999 },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 8');
  });

  it('input이 String 객체면 ok: false', async () => {
    const result = await useCase.run(new String('[]') as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('트랙에 title이 Promise면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: Promise.resolve() as unknown, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('플레이리스트 두 개 모두 name이 빈 문자열이면 첫 번째에서 ok: false', async () => {
    const result = await useCase.run([
      { name: '', tracks: [] },
      { name: '', tracks: [] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 0');
  });

  it('input이 async 함수면 ok: false', async () => {
    const result = await useCase.run((async () => {}) as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('트랙에 artist가 Map이면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: new Map() as unknown }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('input이 Number 객체면 ok: false', async () => {
    const result = await useCase.run(new Number(5) as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('열 번째 플레이리스트(index 9)에서 name 없으면 error에 index 9', async () => {
    const result = await useCase.run([
      { name: 'A', tracks: [] },
      { name: 'B', tracks: [] },
      { name: 'C', tracks: [] },
      { name: 'D', tracks: [] },
      { name: 'E', tracks: [] },
      { name: 'F', tracks: [] },
      { name: 'G', tracks: [] },
      { name: 'H', tracks: [] },
      { name: 'I', tracks: [] },
      { tracks: [] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 9');
  });

  it('tracks가 RegExp면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: /a/ as unknown },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|array/);
  });

  it('input이 1e10 (과학적 표기)면 ok: false', async () => {
    const result = await useCase.run(1e10 as unknown);
    expect(result.ok).toBe(false);
  });

  it('트랙 세 개 중 두 번째가 빈 객체면 ok: false', async () => {
    const result = await useCase.run([
      {
        name: 'P',
        tracks: [
          { title: 'T1', artist: 'A1' },
          {},
          { title: 'T3', artist: 'A3' },
        ],
      },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|title|artist/);
  });

  it('input이 Object.create(Array.prototype)면 배열 아니므로 ok: false', async () => {
    const arrLike = Object.create(Array.prototype);
    const result = await useCase.run(arrLike as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('트랙에 title이 DataView면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: new DataView(new ArrayBuffer(0)) as unknown, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('name이 빈 객체이고 tracks가 없으면 name이 [object Object]로 통과하므로, name이 공백만 있는 문자열이면 실패', async () => {
    const result = await useCase.run([
      { name: '\u00A0\u2003', tracks: [] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/name|index/);
  });

  it('input이 Boolean 객체면 ok: false', async () => {
    const result = await useCase.run(new Boolean(true) as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('열한 번째 플레이리스트(index 10)에서 tracks가 null이면 error에 index 10', async () => {
    const result = await useCase.run([
      ...Array(10).fill(null).map((_, i) => ({ name: `List${i}`, tracks: [] as unknown[] })),
      { name: 'K', tracks: null },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 10');
  });

  it('트랙에 artist가 ArrayBuffer면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: new ArrayBuffer(0) as unknown }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('input이 -Infinity면 ok: false', async () => {
    const result = await useCase.run(-Infinity as unknown);
    expect(result.ok).toBe(false);
  });

  it('tracks가 Date면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: new Date() },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|array/);
  });

  it('플레이리스트 3개 중 2번째만 name 빈 문자열이면 error에 index 1', async () => {
    const result = await useCase.run([
      { name: 'A', tracks: [] },
      { name: '', tracks: [] },
      { name: 'C', tracks: [] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 1');
  });

  it('트랙에 title이 Int8Array면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: new Int8Array(0) as unknown, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('input이 0n (BigInt)이면 ok: false', async () => {
    const result = await useCase.run(BigInt(0) as unknown);
    expect(result.ok).toBe(false);
  });

  it('input이 JSON 문자열 "[]"이면 배열 아니므로 ok: false', async () => {
    const result = await useCase.run('[]' as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('트랙에 title이 Uint16Array면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: new Uint16Array(0) as unknown, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('열두 번째 플레이리스트(index 11)에서 name 없으면 error에 index 11', async () => {
    const result = await useCase.run([
      ...Array(11).fill(null).map((_, i) => ({ name: `L${i}`, tracks: [] as unknown[] })),
      { tracks: [] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 11');
  });

  it('input이 1e-10 (과학적 표기)면 ok: false', async () => {
    const result = await useCase.run(1e-10 as unknown);
    expect(result.ok).toBe(false);
  });

  it('트랙에 artist가 Uint8Array면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: new Uint8Array(0) as unknown }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('플레이리스트에 id만 있고 name·tracks 없으면 ok: false', async () => {
    const result = await useCase.run([
      { id: 'only-id' },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|name/);
  });

  it('tracks가 RegExp면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: /x/ as unknown },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|array/);
  });

  it('input이 2e2 (200)면 ok: false', async () => {
    const result = await useCase.run(2e2 as unknown);
    expect(result.ok).toBe(false);
  });

  it('트랙에 title이 Float32Array면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: new Float32Array(0) as unknown, artist: 'A' }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title|index/);
  });

  it('열세 번째 플레이리스트(index 12)에서 tracks가 숫자면 error에 index 12', async () => {
    const result = await useCase.run([
      ...Array(12).fill(null).map((_, i) => ({ name: `M${i}`, tracks: [] as unknown[] })),
      { name: 'N', tracks: 42 },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 12');
  });

  it('input이 JSON 문자열 "[1,2,3]"이면 배열 아니므로 ok: false', async () => {
    const result = await useCase.run('[1,2,3]' as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('트랙 5개 중 4번째에 title 없으면 ok: false', async () => {
    const result = await useCase.run([
      {
        name: 'P',
        tracks: [
          { title: 'T1', artist: 'A1' },
          { title: 'T2', artist: 'A2' },
          { title: 'T3', artist: 'A3' },
          { artist: 'A4' },
          { title: 'T5', artist: 'A5' },
        ],
      },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|title/);
  });

  it('tracks가 Int32Array면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: new Int32Array(0) },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|array/);
  });

  it('input이 0.5 (소수)면 ok: false', async () => {
    const result = await useCase.run(0.5 as unknown);
    expect(result.ok).toBe(false);
  });

  it('트랙에 artist가 Float64Array면 ok: false', async () => {
    const result = await useCase.run([
      { name: 'P', tracks: [{ title: 'T', artist: new Float64Array(0) as unknown }] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/artist|index/);
  });

  it('열네 번째 플레이리스트(index 13)에서 name 공백만이면 error에 index 13', async () => {
    const result = await useCase.run([
      ...Array(13).fill(null).map((_, i) => ({ name: `Q${i}`, tracks: [] as unknown[] })),
      { name: '  ', tracks: [] },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('index 13');
  });

  it('input이 일반 객체 new Object()면 ok: false', async () => {
    const result = await useCase.run(new Object() as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('트랙 2개 중 첫 번째 title 빈 문자열이면 ok: false', async () => {
    const result = await useCase.run([
      {
        name: 'P',
        tracks: [
          { title: '', artist: 'A1' },
          { title: 'T2', artist: 'A2' },
        ],
      },
    ] as unknown);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/index 0|title/);
  });

  it('input이 1e0 (1)이면 ok: false', async () => {
    const result = await useCase.run(1e0 as unknown);
    expect(result.ok).toBe(false);
  });
});

describe('ImportPlaylistsUseCase (성공 케이스)', () => {
  const repo = new InMemoryPlaylistRepository();
  const useCase = new ImportPlaylistsUseCase(repo);

  beforeEach(async () => {
    await repo.clear();
  });

  it('빈 배열 입력 시 ok: true, count 0', async () => {
    const result = await useCase.run([]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.count).toBe(0);
  });

  it('플레이리스트 1개 트랙 0개 입력 시 ok: true, count 1', async () => {
    const result = await useCase.run([{ name: 'My List', tracks: [] }]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.count).toBe(1);
  });

  it('플레이리스트 1개 트랙 1개 입력 시 ok: true, count 1', async () => {
    const result = await useCase.run([
      { name: 'Rock', tracks: [{ title: 'Song', artist: 'Band' }] },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.count).toBe(1);
  });

  it('플레이리스트 2개 입력 시 ok: true, count 2', async () => {
    const result = await useCase.run([
      { name: 'A', tracks: [] },
      { name: 'B', tracks: [{ title: 'T', artist: 'Ar' }] },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.count).toBe(2);
  });

  it('저장 후 GetMyPlaylists로 조회 시 동일한 데이터 반환', async () => {
    const getUseCase = new GetMyPlaylistsUseCase(repo);
    await useCase.run([
      { name: 'Saved', tracks: [{ title: 'Hit', artist: 'Star' }] },
    ]);
    const getResult = await getUseCase.run();
    expect(getResult.ok).toBe(true);
    if (getResult.ok) {
      expect(getResult.playlists).toHaveLength(1);
      expect(getResult.playlists[0].name).toBe('Saved');
      expect(getResult.playlists[0].tracks).toHaveLength(1);
      expect(getResult.playlists[0].tracks[0].title).toBe('Hit');
      expect(getResult.playlists[0].tracks[0].artist).toBe('Star');
    }
  });

  it('id가 있으면 저장 후 조회 시 해당 id 유지', async () => {
    const getUseCase = new GetMyPlaylistsUseCase(repo);
    await useCase.run([
      { id: 'custom-id-1', name: 'Named', tracks: [] },
    ]);
    const getResult = await getUseCase.run();
    expect(getResult.ok).toBe(true);
    if (getResult.ok) expect(getResult.playlists[0].id).toBe('custom-id-1');
  });

  it('name 앞뒤 공백은 trim 되어 저장', async () => {
    const getUseCase = new GetMyPlaylistsUseCase(repo);
    await useCase.run([{ name: '  Trimmed  ', tracks: [] }]);
    const getResult = await getUseCase.run();
    expect(getResult.ok).toBe(true);
    if (getResult.ok) expect(getResult.playlists[0].name).toBe('Trimmed');
  });

  it('플레이리스트 1개에 트랙 여러 개 입력 시 ok: true, count 1', async () => {
    const result = await useCase.run([
      {
        name: 'Many',
        tracks: [
          { title: 'T1', artist: 'A1' },
          { title: 'T2', artist: 'A2' },
          { title: 'T3', artist: 'A3' },
        ],
      },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.count).toBe(1);
  });

  it('트랙에 album, position 있으면 저장 후 조회 시 유지', async () => {
    const getUseCase = new GetMyPlaylistsUseCase(repo);
    await useCase.run([
      {
        name: 'WithMeta',
        tracks: [
          { title: 'S', artist: 'Ar', album: 'Album One', position: 1 },
        ],
      },
    ]);
    const getResult = await getUseCase.run();
    expect(getResult.ok).toBe(true);
    if (getResult.ok) {
      const t = getResult.playlists[0].tracks[0];
      expect(t.album).toBe('Album One');
      expect(t.position).toBe(1);
    }
  });
});
