import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { detectPython } from '../../../lib/python';

export async function GET() {
  // 1) Python 설치 확인
  const py = detectPython();
  if (!py) {
    return NextResponse.json({
      ok: false,
      reason: 'Python이 설치되어 있지 않습니다. Python 3를 설치한 후 다시 시도하세요.',
    });
  }

  // 2) ytmusicapi 설치 확인
  try {
    const checkCmd = `${py.exec} ${[...py.prefixArgs, '-c', 'import ytmusicapi'].join(' ')}`;
    execSync(checkCmd, { stdio: 'pipe' });
  } catch {
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

  return NextResponse.json({ ok: true });
}
