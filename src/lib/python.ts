import { execSync, spawn } from 'child_process';

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

/**
 * 비동기로 Python 명령 실행. 타임아웃 시 프로세스 종료. (이벤트 루프 블로킹 방지)
 */
export function runPythonAsync(
  exec: string,
  args: string[],
  options: { timeoutMs: number; cwd?: string; env?: NodeJS.ProcessEnv }
): Promise<{ exitCode: number | null; killed?: boolean }> {
  return new Promise((resolve, reject) => {
    const signal = AbortSignal.timeout(options.timeoutMs);
    const child = spawn(exec, args, {
      cwd: options.cwd ?? process.cwd(),
      env: options.env ?? process.env,
      stdio: 'pipe',
      signal,
    });
    child.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code !== 'ABORT_ERR') reject(err);
    });
    child.on('close', (code, signalCode) => {
      resolve({
        exitCode: code,
        killed: signalCode === 'SIGTERM' || signalCode === 'SIGKILL',
      });
    });
  });
}
