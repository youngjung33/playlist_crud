import { execSync } from 'child_process';

/**
 * Python 실행 명령어 검출. validate-ytmusic, migrate 등에서 공통 사용.
 */
export function detectPython(): { exec: string; prefixArgs: string[] } | null {
  const candidates: [string, string[]][] =
    process.platform === 'win32'
      ? [
          ['py', ['-3']],
          ['python', []],
          ['python3', []],
        ]
      : [
          ['python3', []],
          ['python', []],
        ];

  for (const [exec, prefixArgs] of candidates) {
    try {
      execSync(`${exec} --version`, { stdio: 'pipe' });
      return { exec, prefixArgs };
    } catch {
      /* try next */
    }
  }
  return null;
}
