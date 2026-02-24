import type { Playlist } from '../domain/entities/Playlist';

export type ExportFormat = 'json' | 'csv';

export interface ExportPlaylistsInput {
  playlists: Playlist[];
  format: ExportFormat;
}

export type ExportPlaylistsResult =
  | { ok: true; content: string; contentType: string }
  | { ok: false; error: string };

/**
 * 플레이리스트 목록을 JSON 또는 CSV 문자열로 내보내는 유스케이스.
 */
export class ExportPlaylistsUseCase {
  /**
   * format에 따라 playlists를 직렬화한 content와 contentType을 반환한다.
   */
  async run(input: ExportPlaylistsInput): Promise<ExportPlaylistsResult> {
    if (input == null) {
      return { ok: false, error: 'Input is required' };
    }
    if (input.playlists == null) {
      return { ok: false, error: 'playlists is required' };
    }
    if (!Array.isArray(input.playlists)) {
      return { ok: false, error: 'playlists must be an array' };
    }
    const format = input.format;
    if (format !== 'json' && format !== 'csv') {
      return { ok: false, error: `Unsupported format: ${String(format)}. Use json or csv` };
    }
    if (format === 'json') {
      const content = JSON.stringify(input.playlists, null, 2);
      return { ok: true, content, contentType: 'application/json' };
    }
    const lines: string[] = ['name,title,artist,album,position'];
    for (const pl of input.playlists) {
      for (const t of pl.tracks) {
        const name = escapeCsv(pl.name);
        const title = escapeCsv(t.title);
        const artist = escapeCsv(t.artist);
        const album = escapeCsv(t.album ?? '');
        const pos = String(t.position ?? '');
        lines.push(`${name},${title},${artist},${album},${pos}`);
      }
    }
    return { ok: true, content: lines.join('\n'), contentType: 'text/csv' };
  }
}

/**
 * CSV 필드에 쉼표·줄바꿈·따옴표가 있으면 따옴표로 감싸고 내부 "는 ""로 이스케이프한다.
 */
function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
