import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { GetMyPlaylistsUseCase } from '../../../use-cases/GetMyPlaylists';
import { FilePlaylistRepository } from '../../../adapters/FilePlaylistRepository';

export const maxDuration = 300;

type SseEvent =
  | { type: 'log'; message: string }
  | { type: 'error'; message: string }
  | { type: 'done'; code: number | null; success: boolean };

export async function POST(req: NextRequest) {
  try {
    const { playlistIds, source, target } = (await req.json()) as {
      playlistIds: string[];
      source: string;
      target: string;
    };

    if (!playlistIds?.length) {
      return NextResponse.json({ error: '이전할 플레이리스트를 선택하세요.' }, { status: 400 });
    }
    if (source !== 'melon') {
      return NextResponse.json({ error: `${source}는 아직 지원하지 않습니다.` }, { status: 400 });
    }
    if (target !== 'ytmusic') {
      return NextResponse.json({ error: `${target}는 아직 지원하지 않습니다.` }, { status: 400 });
    }

    // 플레이리스트 존재 여부 검증
    const repo = new FilePlaylistRepository();
    const result = await new GetMyPlaylistsUseCase(repo).run();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    const targets = result.playlists.filter((p) => playlistIds.includes(p.id));
    if (!targets.length) {
      return NextResponse.json(
        { error: '선택한 플레이리스트를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const scriptPath = path.join(process.cwd(), 'src', 'adapters', 'YouTubeMusicAdapter.py');
    const encoder = new TextEncoder();
    const encode = (evt: SseEvent) => encoder.encode(`data: ${JSON.stringify(evt)}\n\n`);

    const [pyExec, pyPrefixArgs]: [string, string[]] =
      process.platform === 'win32' ? ['py', ['-3']] : ['python3', []];

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const child = spawn(pyExec, [...pyPrefixArgs, scriptPath, '--ids', playlistIds.join(',')], {
          cwd: process.cwd(),
          env: { ...process.env, PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8' },
        });

        child.stdout.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n');
          for (const line of lines) {
            if (line.trim()) controller.enqueue(encode({ type: 'log', message: line }));
          }
        });

        child.stderr.on('data', (chunk: Buffer) => {
          const text = chunk.toString().trim();
          if (text) controller.enqueue(encode({ type: 'error', message: text }));
        });

        child.on('close', (code) => {
          controller.enqueue(encode({ type: 'done', code, success: code === 0 }));
          controller.close();
        });

        child.on('error', (err) => {
          controller.enqueue(
            encode({
              type: 'error',
              message: `Python 실행 오류: ${err.message}\n"py -3 --version" 으로 Python 설치를 확인하세요.`,
            }),
          );
          controller.enqueue(encode({ type: 'done', code: 1, success: false }));
          controller.close();
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch {
    return NextResponse.json({ error: '요청 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
