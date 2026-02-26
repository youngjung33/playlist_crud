import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { GetMyPlaylistsUseCase } from '../../../use-cases/GetMyPlaylists';
import { ExportPlaylistsUseCase } from '../../../use-cases/ExportPlaylists';
import { FilePlaylistRepository } from '../../../adapters/FilePlaylistRepository';
import type { Playlist } from '../../../domain/entities/Playlist';

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get('format') ?? 'json';

  const repo = new FilePlaylistRepository();
  const result = await new GetMyPlaylistsUseCase(repo).run();

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  if (result.playlists.length === 0) {
    return NextResponse.json({ error: '내보낼 플레이리스트가 없습니다.' }, { status: 404 });
  }

  if (format === 'xlsx') {
    return exportExcel(result.playlists);
  }

  // JSON 내보내기 (ExportPlaylistsUseCase 활용)
  const exported = await new ExportPlaylistsUseCase().run({
    playlists: result.playlists,
    format: 'json',
  });

  if (!exported.ok) {
    return NextResponse.json({ error: exported.error }, { status: 500 });
  }

  return new NextResponse(exported.content, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="playlists.json"',
    },
  });
}

function exportExcel(playlists: Playlist[]): NextResponse {
  const wb = XLSX.utils.book_new();

  // 시트 1: 플레이리스트 목록
  const overviewRows = [
    ['플레이리스트명', '곡 수'],
    ...playlists.map((p) => [p.name, p.tracks.length]),
  ];
  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewRows);
  overviewSheet['!cols'] = [{ wch: 40 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, overviewSheet, '목록');

  // 시트 2+: 플레이리스트별 곡 목록 (시트명 31자 제한)
  for (const pl of playlists) {
    const rows = [
      ['#', '제목', '아티스트', '앨범'],
      ...pl.tracks.map((t, i) => [i + 1, t.title, t.artist, t.album ?? '']),
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet['!cols'] = [{ wch: 4 }, { wch: 40 }, { wch: 30 }, { wch: 30 }];
    const sheetName = pl.name.slice(0, 31).replace(/[\\/*?:[\]]/g, '_');
    XLSX.utils.book_append_sheet(wb, sheet, sheetName);
  }

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="playlists.xlsx"',
    },
  });
}
