import { NextRequest, NextResponse } from 'next/server';
import { MelonAdapter } from '../../../adapters/MelonAdapter';
import { FilePlaylistRepository } from '../../../adapters/FilePlaylistRepository';

// 멜론 추출은 시간이 오래 걸릴 수 있어 타임아웃을 넉넉히 설정
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const cookie = process.env.MELON_COOKIE;
  const memberKey = process.env.MELON_MEMBER_KEY;

  if (!cookie || !memberKey) {
    return NextResponse.json(
      { error: '.env 파일에 MELON_COOKIE 와 MELON_MEMBER_KEY 를 설정해주세요.' },
      { status: 400 }
    );
  }

  let playlistIds: string[] | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body.playlistIds) && body.playlistIds.length > 0) {
      playlistIds = body.playlistIds;
    }
  } catch {
    /* body 없으면 전체 추출 */
  }

  try {
    const adapter = new MelonAdapter({ cookie, memberKey });
    const playlists = await adapter.fetchAll(playlistIds);

    const repo = new FilePlaylistRepository();
    await repo.save(playlists);

    return NextResponse.json({
      ok: true,
      count: playlists.length,
      totalTracks: playlists.reduce((s, p) => s + p.tracks.length, 0),
      playlists: playlists.map((p) => ({
        id: p.id,
        name: p.name,
        song_count: p.tracks.length,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '추출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
