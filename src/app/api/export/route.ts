import { NextRequest, NextResponse } from 'next/server';
import { GetMyPlaylistsUseCase } from '../../../use-cases/GetMyPlaylists';
import { ExportPlaylistsUseCase } from '../../../use-cases/ExportPlaylists';
import { FilePlaylistRepository } from '../../../adapters/FilePlaylistRepository';
import { buildXlsxBuffer, XLSX_CONTENT_TYPE } from '../../../adapters/XlsxExporter';

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
    const buf = buildXlsxBuffer(result.playlists);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': XLSX_CONTENT_TYPE,
        'Content-Disposition': 'attachment; filename="playlists.xlsx"',
      },
    });
  }

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
