import { ExportPlaylistsUseCase } from '../ExportPlaylists';
import { createPlaylist } from '../../domain/entities/Playlist';

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

  it('format이 undefined이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: undefined as unknown as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Unsupported|format/);
  });

  it('format이 숫자면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 123 as unknown as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "txt"면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'txt' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('txt');
  });

  it('input에 format 필드가 없으면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
    } as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('playlists가 undefined이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: undefined as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/playlists|required/);
  });

  it('format이 "JSON" (대문자)면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'JSON' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Unsupported|JSON/);
  });

  it('format이 "CSV" (대문자)면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'CSV' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('playlists가 문자열이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: 'not-array' as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('playlists가 유사 배열(length만 있음)이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: { length: 0 } as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('input이 빈 객체면 ok: false', async () => {
    const result = await useCase.run({} as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/playlists|required/);
  });

  it('input이 배열이면 ok: false (playlists가 아님)', async () => {
    const result = await useCase.run([[]] as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/playlists|required/);
  });

  it('format이 true면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: true as unknown as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 false면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: false as unknown as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 객체면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: { type: 'json' } as unknown as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Unsupported|format/);
  });

  it('format이 "json " (공백 포함)이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'json ' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('playlists가 숫자면 ok: false', async () => {
    const result = await useCase.run({
      playlists: 0 as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('format이 배열이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: ['json'] as unknown as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 함수면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: (() => 'json') as unknown as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 Symbol이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: Symbol('json') as unknown as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Unsupported|format/);
  });

  it('format이 "Json" (일부 대문자)면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'Json' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 " csv" (앞 공백)면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: ' csv' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('playlists가 boolean이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: true as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('playlists가 함수면 ok: false', async () => {
    const result = await useCase.run({
      playlists: (() => []) as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('input이 숫자면 ok: false', async () => {
    const result = await useCase.run(1 as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('required');
  });

  it('input이 Symbol이면 ok: false', async () => {
    const result = await useCase.run(Symbol() as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('format이 "xlsx"면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'xlsx' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('xlsx');
  });

  it('format이 "yml"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'yml' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('yml');
  });

  it('format이 숫자 0이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 0 as unknown as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 NaN이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: NaN as unknown as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "csv\\n" (개행 포함)이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'csv\n' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('playlists가 Map이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: new Map() as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('playlists가 Set이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: new Set() as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('input이 Date면 ok: false', async () => {
    const result = await useCase.run(new Date() as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('input이 RegExp면 ok: false', async () => {
    const result = await useCase.run(/a/ as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('input이 함수면 ok: false', async () => {
    const result = await useCase.run((() => {}) as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('input이 Map이면 ok: false', async () => {
    const result = await useCase.run(new Map() as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('input이 true면 ok: false', async () => {
    const result = await useCase.run(true as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('format이 빈 배열이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: [] as unknown as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('playlists가 빈 문자열이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: '' as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('playlists가 RegExp면 ok: false', async () => {
    const result = await useCase.run({
      playlists: /a/ as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('playlists가 Symbol이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: Symbol('x') as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "html"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'html' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('html');
  });

  it('format이 "pdf"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'pdf' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('input이 WeakMap이면 ok: false', async () => {
    const result = await useCase.run(new WeakMap() as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('input이 Set이면 ok: false', async () => {
    const result = await useCase.run(new Set() as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('input이 false면 ok: false', async () => {
    const result = await useCase.run(false as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('input이 BigInt면 ok: false', async () => {
    const result = await useCase.run(BigInt(1) as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('format이 "jsonxxx" (잘못된 접미사)면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'jsonxxx' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('jsonxxx');
  });

  it('format이 "csv " (뒤 공백)면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'csv ' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "Csv" (일부 대문자)면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'Csv' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "tsv"면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'tsv' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('tsv');
  });

  it('format이 "excel"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'excel' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('playlists가 Date면 ok: false', async () => {
    const result = await useCase.run({
      playlists: new Date() as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('input이 NaN이면 ok: false', async () => {
    const result = await useCase.run(NaN as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('input이 Infinity이면 ok: false', async () => {
    const result = await useCase.run(Infinity as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('input이 빈 배열이면 ok: false (playlists 필드 없음)', async () => {
    const result = await useCase.run([] as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/playlists|required/);
  });

  it('playlists가 ArrayBuffer면 ok: false', async () => {
    const result = await useCase.run({
      playlists: new ArrayBuffer(0) as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "csv\t" (탭 포함)면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'csv\t' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "yaml"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'yaml' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('yaml');
  });

  it('format이 "text"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'text' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "json5"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'json5' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('playlists가 Int32Array면 ok: false', async () => {
    const result = await useCase.run({
      playlists: new Int32Array(0) as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('array');
  });

  it('playlists가 Uint8Array면 ok: false', async () => {
    const result = await useCase.run({
      playlists: new Uint8Array(0) as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('input이 0이면 ok: false', async () => {
    const result = await useCase.run(0 as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('input이 Uint8Array면 ok: false', async () => {
    const result = await useCase.run(new Uint8Array(0) as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('input에 playlists가 배열인데 format이 null이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: null as unknown as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Unsupported|format/);
  });

  it('format이 "markdown"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'markdown' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "jsonl"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'jsonl' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('jsonl');
  });

  it('format이 "ndjson"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'ndjson' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('playlists가 Float32Array면 ok: false', async () => {
    const result = await useCase.run({
      playlists: new Float32Array(0) as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "json  " (공백 두 칸)면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'json  ' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 빈 객체면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: {} as unknown as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Unsupported|format/);
  });

  it('input이 -1이면 ok: false', async () => {
    const result = await useCase.run(-1 as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('playlists가 DataView면 ok: false', async () => {
    const result = await useCase.run({
      playlists: new DataView(new ArrayBuffer(0)) as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "xml"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'xml' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('xml');
  });

  it('input이 Float64Array면 ok: false', async () => {
    const result = await useCase.run(new Float64Array(0) as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('format이 "binary"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'binary' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('binary');
  });

  it('format이 "base64"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'base64' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "json\\n" (개행 포함)이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'json\n' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('input이 Int32Array면 ok: false', async () => {
    const result = await useCase.run(new Int32Array(0) as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('playlists가 Float64Array면 ok: false', async () => {
    const result = await useCase.run({
      playlists: new Float64Array(0) as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "xml " (공백)이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'xml ' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "jsonc"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'jsonc' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('jsonc');
  });

  it('format이 "hjson"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'hjson' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "toml"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'toml' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "yaml " (공백)이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'yaml ' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('input이 ArrayBuffer면 ok: false', async () => {
    const result = await useCase.run(new ArrayBuffer(0) as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('input이 DataView면 ok: false', async () => {
    const result = await useCase.run(new DataView(new ArrayBuffer(0)) as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('format이 1 (숫자)이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 1 as unknown as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "ini"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'ini' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('ini');
  });

  it('format이 "properties"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'properties' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "env"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'env' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('input이 Promise면 ok: false', async () => {
    const result = await useCase.run(Promise.resolve() as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('required');
  });

  it('playlists가 RegExp면 ok: false', async () => {
    const result = await useCase.run({
      playlists: /a/ as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "csv," (쉼표 포함)이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'csv,' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('input이 String 객체면 ok: false', async () => {
    const result = await useCase.run(new String('{}') as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('format이 "config"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'config' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('config');
  });

  it('format이 "cfg"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'cfg' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('playlists가 Iterator 객체면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [1, 2, 3][Symbol.iterator]() as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('input이 Float32Array면 ok: false', async () => {
    const result = await useCase.run(new Float32Array(0) as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('format이 2 (숫자)이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 2 as unknown as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "json\t" (탭)이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'json\t' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('input이 Number 객체면 ok: false', async () => {
    const result = await useCase.run(new Number(1) as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('format이 "json-indent"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'json-indent' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('json-indent');
  });

  it('format이 "json-pretty"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'json-pretty' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "csv; " (세미콜론)이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'csv; ' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('playlists가 제너레이터 결과면 ok: false', async () => {
    const gen = function* () { yield 1; }();
    const result = await useCase.run({
      playlists: gen as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('input이 Boolean 객체면 ok: false', async () => {
    const result = await useCase.run(new Boolean(false) as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('format이 "jsonc " (공백)이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'jsonc ' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "json-schema"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'json-schema' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('json-schema');
  });

  it('format이 "bson"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'bson' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "json-api"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'json-api' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 3.14 (소수)이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 3.14 as unknown as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('input이 Int8Array면 ok: false', async () => {
    const result = await useCase.run(new Int8Array(0) as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('format이 "jsonl " (공백)이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'jsonl ' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('format이 "cson"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'cson' as 'json',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('cson');
  });

  it('format이 "json-ld"이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'json-ld' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('input이 async 함수면 ok: false', async () => {
    const result = await useCase.run((async () => {}) as unknown as Parameters<ExportPlaylistsUseCase['run']>[0]);
    expect(result.ok).toBe(false);
  });

  it('format이 "json " (앞 공백 없이 뒤만)이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: [],
      format: 'json ' as 'json',
    });
    expect(result.ok).toBe(false);
  });

  it('playlists가 WeakSet이면 ok: false', async () => {
    const result = await useCase.run({
      playlists: new WeakSet() as unknown as [],
      format: 'json',
    });
    expect(result.ok).toBe(false);
  });
});

describe('ExportPlaylistsUseCase (성공 케이스)', () => {
  const useCase = new ExportPlaylistsUseCase();

  it('playlists 빈 배열, format json → ok: true, contentType application/json', async () => {
    const result = await useCase.run({ playlists: [], format: 'json' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.contentType).toBe('application/json');
      expect(result.content).toMatch(/^\[\s*\]/);
    }
  });

  it('playlists 1개 트랙 0개, format json → ok: true, content에 name 포함', async () => {
    const pl = createPlaylist({ name: 'My List', tracks: [] });
    const result = await useCase.run({ playlists: [pl], format: 'json' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.contentType).toBe('application/json');
      expect(result.content).toContain('My List');
    }
  });

  it('playlists 1개 트랙 1개, format json → ok: true, content에 title·artist 포함', async () => {
    const pl = createPlaylist({
      name: 'Rock',
      tracks: [{ title: 'Song', artist: 'Band' }],
    });
    const result = await useCase.run({ playlists: [pl], format: 'json' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.content).toContain('Song');
      expect(result.content).toContain('Band');
    }
  });

  it('playlists 빈 배열, format csv → ok: true, 헤더만 한 줄', async () => {
    const result = await useCase.run({ playlists: [], format: 'csv' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.contentType).toBe('text/csv');
      expect(result.content).toBe('name,title,artist,album,position');
    }
  });

  it('playlists 1개 트랙 1개, format csv → ok: true, 헤더+데이터 한 줄', async () => {
    const pl = createPlaylist({
      name: 'A',
      tracks: [{ title: 'T', artist: 'Ar' }],
    });
    const result = await useCase.run({ playlists: [pl], format: 'csv' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.contentType).toBe('text/csv');
      expect(result.content).toContain('name,title,artist,album,position');
      expect(result.content).toContain('A');
      expect(result.content).toContain('T');
      expect(result.content).toContain('Ar');
    }
  });

  it('플레이리스트 2개 트랙 여러 개, format csv → ok: true, 여러 행', async () => {
    const pl1 = createPlaylist({
      name: 'P1',
      tracks: [
        { title: 'T1', artist: 'A1' },
        { title: 'T2', artist: 'A2' },
      ],
    });
    const pl2 = createPlaylist({ name: 'P2', tracks: [] });
    const result = await useCase.run({
      playlists: [pl1, pl2],
      format: 'csv',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const lines = result.content.split('\n');
      expect(lines[0]).toBe('name,title,artist,album,position');
      expect(lines).toHaveLength(3);
    }
  });

  it('playlists 2개, format json → ok: true, content에 두 플레이리스트 모두 포함', async () => {
    const pl1 = createPlaylist({ name: 'J1', tracks: [{ title: 'S1', artist: 'Ar1' }] });
    const pl2 = createPlaylist({ name: 'J2', tracks: [] });
    const result = await useCase.run({
      playlists: [pl1, pl2],
      format: 'json',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.content).toContain('J1');
      expect(result.content).toContain('J2');
      expect(result.content).toContain('S1');
    }
  });

  it('CSV에서 name에 쉼표 있으면 이스케이프되어 출력', async () => {
    const pl = createPlaylist({
      name: 'Hello, World',
      tracks: [{ title: 'T', artist: 'A' }],
    });
    const result = await useCase.run({ playlists: [pl], format: 'csv' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.content).toContain('"Hello, World"');
    }
  });

  it('트랙에 album 있으면 JSON·CSV 모두 내보내기 성공', async () => {
    const pl = createPlaylist({
      name: 'N',
      tracks: [{ title: 'T', artist: 'A', album: 'My Album' }],
    });
    const jsonResult = await useCase.run({ playlists: [pl], format: 'json' });
    const csvResult = await useCase.run({ playlists: [pl], format: 'csv' });
    expect(jsonResult.ok).toBe(true);
    expect(csvResult.ok).toBe(true);
    if (jsonResult.ok) expect(jsonResult.content).toContain('My Album');
    if (csvResult.ok) expect(csvResult.content).toContain('My Album');
  });
});
