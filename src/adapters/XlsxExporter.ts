import * as XLSX from 'xlsx';
import type { Playlist } from '../domain/entities/Playlist';

/**
 * Playlist 배열을 xlsx 바이너리 버퍼로 변환하는 어댑터.
 * - 시트 1 '목록': 플레이리스트명·곡 수 요약
 * - 시트 2~: 플레이리스트별 곡 목록
 */
export function buildXlsxBuffer(playlists: Playlist[]): Buffer {
  const wb = XLSX.utils.book_new();

  const overviewSheet = XLSX.utils.aoa_to_sheet([
    ['플레이리스트명', '곡 수'],
    ...playlists.map((p) => [p.name, p.tracks.length]),
  ]);
  overviewSheet['!cols'] = [{ wch: 40 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, overviewSheet, '목록');

  for (const pl of playlists) {
    const sheet = XLSX.utils.aoa_to_sheet([
      ['#', '제목', '아티스트', '앨범'],
      ...pl.tracks.map((t, i) => [i + 1, t.title, t.artist, t.album ?? '']),
    ]);
    sheet['!cols'] = [{ wch: 4 }, { wch: 40 }, { wch: 30 }, { wch: 30 }];
    const sheetName = pl.name.slice(0, 31).replace(/[\\/*?:[\]]/g, '_');
    XLSX.utils.book_append_sheet(wb, sheet, sheetName);
  }

  return Buffer.from(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
}

export const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
