import { NextResponse } from 'next/server';
import { MelonAdapter } from '../../../../adapters/MelonAdapter';

/** 멜론 플레이리스트 목록만 가져온다. 곡 목록은 받지 않음. (선택 UI용) */
export async function GET() {
  const cookie = process.env.MELON_COOKIE;
  const memberKey = process.env.MELON_MEMBER_KEY;

  if (!cookie || !memberKey) {
    return NextResponse.json(
      { error: '.env 파일에 MELON_COOKIE 와 MELON_MEMBER_KEY 를 설정해주세요.' },
      { status: 400 }
    );
  }

  try {
    const adapter = new MelonAdapter({ cookie, memberKey });
    const list = await adapter.fetchPlaylistListOnly();
    return NextResponse.json({
      ok: true,
      playlists: list.map((p) => ({ id: p.id, name: p.name, song_count: p.song_count })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
