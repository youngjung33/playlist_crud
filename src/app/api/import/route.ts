import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { createPlaylist } from '../../../domain/entities/Playlist';
import { FilePlaylistRepository } from '../../../adapters/FilePlaylistRepository';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '파일을 첨부해주세요.' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    const repo = new FilePlaylistRepository();

    // ── JSON ──────────────────────────────────────────────────────────────────
    if (fileName.endsWith('.json')) {
      let raw: unknown;
      try {
        raw = JSON.parse(buf.toString('utf-8'));
      } catch {
        return NextResponse.json({ error: 'JSON 파일을 파싱할 수 없습니다.' }, { status: 400 });
      }
      if (!Array.isArray(raw)) {
        return NextResponse.json({ error: 'JSON 파일은 배열 형식이어야 합니다.' }, { status: 400 });
      }

      // Melon raw / domain 포맷 모두 지원 — FilePlaylistRepository가 자동 감지
      const playlistsPath = path.join(process.cwd(), 'playlists.json');
      fs.writeFileSync(playlistsPath, JSON.stringify(raw, null, 2), 'utf-8');

      const playlists = await repo.findAll();
      await repo.save(playlists); // 도메인 포맷으로 정규화 저장

      return NextResponse.json({
        ok: true,
        count: playlists.length,
        totalTracks: playlists.reduce((s, p) => s + p.tracks.length, 0),
        playlists: playlists.map((p) => ({ id: p.id, name: p.name, song_count: p.tracks.length })),
      });
    }

    // ── Excel ─────────────────────────────────────────────────────────────────
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const wb = XLSX.read(buf, { type: 'buffer' });
      const playlists = [];

      for (const sheetName of wb.SheetNames) {
        if (sheetName === '목록') continue; // 내보내기 개요 시트 스킵

        const sheet = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

        if (rows.length < 2) continue; // 헤더만 있으면 스킵

        const tracks = (rows.slice(1) as unknown[][])
          .map((row, i) => ({
            position: typeof row[0] === 'number' ? row[0] : i + 1,
            title: String(row[1] ?? '').trim(),
            artist: String(row[2] ?? '').trim(),
            album: row[3] ? String(row[3]).trim() : null,
          }))
          .filter((t) => t.title && t.artist);

        if (tracks.length === 0) continue;

        playlists.push(
          createPlaylist({
            name: sheetName,
            tracks: tracks as Array<Record<string, unknown>>,
          })
        );
      }

      if (playlists.length === 0) {
        return NextResponse.json(
          { error: '파일에서 플레이리스트를 찾을 수 없습니다. 내보낸 형식과 맞는지 확인해주세요.' },
          { status: 400 }
        );
      }

      await repo.save(playlists);

      return NextResponse.json({
        ok: true,
        count: playlists.length,
        totalTracks: playlists.reduce((s, p) => s + p.tracks.length, 0),
        playlists: playlists.map((p) => ({ id: p.id, name: p.name, song_count: p.tracks.length })),
      });
    }

    return NextResponse.json(
      { error: 'JSON 또는 Excel(.xlsx) 파일만 지원합니다.' },
      { status: 400 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '파일 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
