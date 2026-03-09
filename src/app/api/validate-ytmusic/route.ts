import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { detectPython, runPythonAsync } from '../../../lib/python';

const YTMUSICAPI_CHECK_TIMEOUT_MS = 10_000;
const AUTH_CHECK_TIMEOUT_MS = 15_000;

const AUTH_CHECK_SCRIPT = `
import os
from ytmusicapi import YTMusic
path = os.environ.get("YT_AUTH_FILE")
if not path:
    raise SystemExit(2)
yt = YTMusic(path)
yt.get_library_playlists(limit=1)
`.trim();

export async function GET() {
  // 1) Python 설치 확인 (동기, 빠름)
  const py = detectPython();
  if (!py) {
    return NextResponse.json({
      ok: false,
      reason: 'Python이 설치되어 있지 않습니다. Python 3를 설치한 후 다시 시도하세요.',
    });
  }

  // 2) ytmusicapi 설치 확인 (비동기 + 타임아웃)
  const importResult = await runPythonAsync(
    py.exec,
    [...py.prefixArgs, '-c', 'import ytmusicapi'],
    { timeoutMs: YTMUSICAPI_CHECK_TIMEOUT_MS }
  );
  if (importResult.exitCode !== 0) {
    return NextResponse.json({
      ok: false,
      reason:
        'ytmusicapi가 설치되지 않았습니다. 터미널에서 "pip install ytmusicapi" 를 실행하세요.',
    });
  }

  // 3) browser.json 존재 확인
  const browserJsonPath = path.join(process.cwd(), 'src', 'adapters', 'browser.json');
  if (!fs.existsSync(browserJsonPath)) {
    return NextResponse.json({
      ok: false,
      reason:
        'src/adapters/browser.json 파일이 없습니다. 터미널에서 "py -3 -m ytmusicapi browser" 를 실행해 생성한 후 src/adapters/ 폴더에 넣어주세요.',
    });
  }

  // 4) 실제 인증 검증 (YTMusic 로드 + get_library_playlists 호출)
  const authResult = await runPythonAsync(
    py.exec,
    [...py.prefixArgs, '-c', AUTH_CHECK_SCRIPT],
    {
      timeoutMs: AUTH_CHECK_TIMEOUT_MS,
      cwd: process.cwd(),
      env: { ...process.env, YT_AUTH_FILE: browserJsonPath },
    }
  );
  if (authResult.exitCode !== 0) {
    return NextResponse.json({
      ok: false,
      reason:
        'browser.json 인증이 만료되었거나 손상되었습니다. "py -3 -m ytmusicapi browser" 로 다시 생성하세요.',
    });
  }

  return NextResponse.json({ ok: true });
}
