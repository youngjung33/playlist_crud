import { NextRequest, NextResponse } from 'next/server';
import { GetMyPlaylistsUseCase } from '../../../use-cases/GetMyPlaylists';
import { FilePlaylistRepository } from '../../../adapters/FilePlaylistRepository';

interface MigrateRequest {
  playlistIds: string[];
  source: string;
  target: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: MigrateRequest = await req.json();
    const { playlistIds, source, target } = body;

    if (!playlistIds || playlistIds.length === 0) {
      return NextResponse.json({ error: '이전할 플레이리스트를 선택하세요.' }, { status: 400 });
    }

    if (source !== 'melon') {
      return NextResponse.json({ error: `${source}는 아직 지원하지 않습니다.` }, { status: 400 });
    }

    if (target !== 'ytmusic') {
      return NextResponse.json({ error: `${target}는 아직 지원하지 않습니다.` }, { status: 400 });
    }

    const repo = new FilePlaylistRepository();
    const useCase = new GetMyPlaylistsUseCase(repo);
    const result = await useCase.run();

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const targets = result.playlists.filter((p) => playlistIds.includes(p.id));

    if (targets.length === 0) {
      return NextResponse.json({ error: '선택한 플레이리스트를 찾을 수 없습니다.' }, { status: 404 });
    }

    const totalTracks = targets.reduce((sum, p) => sum + p.tracks.length, 0);

    // YouTube Music 이전은 현재 Python 어댑터(src/adapters/YouTubeMusicAdapter.py)로 처리됩니다.
    return NextResponse.json({
      message: `${targets.length}개 플레이리스트 (${totalTracks.toLocaleString()}곡) 이전을 위해 Python 어댑터를 실행하세요.`,
      command: `py -3 src/adapters/YouTubeMusicAdapter.py`,
      playlists: targets.map((p) => ({ id: p.id, name: p.name })),
    });
  } catch {
    return NextResponse.json({ error: '요청 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
