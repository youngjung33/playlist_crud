'use client';

import { useState, useEffect, useCallback } from 'react';

interface Playlist {
  id: string;
  name: string;
  song_count: number;
}

interface MigrateStatus {
  state: 'idle' | 'running' | 'done' | 'error';
  message: string;
}

const SERVICE_OPTIONS = [
  { id: 'melon', label: 'Melon', icon: '🎶', available: true },
  { id: 'spotify', label: 'Spotify', icon: '🟢', available: false },
  { id: 'apple', label: 'Apple Music', icon: '🍎', available: false },
];

const TARGET_OPTIONS = [
  { id: 'ytmusic', label: 'YouTube Music', icon: '▶️', available: true },
  { id: 'spotify', label: 'Spotify', icon: '🟢', available: false },
  { id: 'apple', label: 'Apple Music', icon: '🍎', available: false },
];

export default function Home() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<MigrateStatus>({ state: 'idle', message: '' });
  const [source, setSource] = useState('melon');
  const [target, setTarget] = useState('ytmusic');

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    setStatus({ state: 'idle', message: '' });
    try {
      const res = await fetch('/api/playlists');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPlaylists(data.playlists ?? []);
      setSelected(new Set());
    } catch {
      setStatus({ state: 'error', message: '플레이리스트를 불러오지 못했습니다.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(
      selected.size === playlists.length ? new Set() : new Set(playlists.map((p) => p.id))
    );
  }

  async function startMigration() {
    if (selected.size === 0) return;
    setStatus({ state: 'running', message: '이전을 시작합니다...' });
    try {
      const res = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistIds: Array.from(selected),
          source,
          target,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '알 수 없는 오류');
      setStatus({ state: 'done', message: data.message ?? '이전이 완료되었습니다.' });
    } catch (e) {
      setStatus({
        state: 'error',
        message: e instanceof Error ? e.message : '이전 중 오류가 발생했습니다.',
      });
    }
  }

  const selectedTracks = playlists
    .filter((p) => selected.has(p.id))
    .reduce((sum, p) => sum + p.song_count, 0);

  const allSelected = playlists.length > 0 && selected.size === playlists.length;

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b px-6 py-4"
        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'var(--color-accent)' }}
            >
              🎵
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Playlist Transfer</h1>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                음악 플레이리스트 이전 도구
              </p>
            </div>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm transition-colors hover:text-white"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            GitHub
          </a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        {/* Service Selector */}
        <section
          className="rounded-2xl p-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-muted)' }}>
            이전 경로
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Source</p>
              <div className="space-y-1.5">
                {SERVICE_OPTIONS.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => svc.available && setSource(svc.id)}
                    disabled={!svc.available}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: source === svc.id ? 'var(--color-accent)' : 'var(--color-surface-2)',
                      opacity: !svc.available ? 0.4 : 1,
                      cursor: !svc.available ? 'not-allowed' : 'pointer',
                      border: `1px solid ${source === svc.id ? 'transparent' : 'var(--color-border)'}`,
                    }}
                  >
                    <span>{svc.icon}</span>
                    <span>{svc.label}</span>
                    {!svc.available && (
                      <span className="ml-auto text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        준비 중
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 pt-6">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                →
              </div>
            </div>

            <div className="flex-1 space-y-1.5">
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Target</p>
              <div className="space-y-1.5">
                {TARGET_OPTIONS.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => svc.available && setTarget(svc.id)}
                    disabled={!svc.available}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: target === svc.id ? 'var(--color-accent)' : 'var(--color-surface-2)',
                      opacity: !svc.available ? 0.4 : 1,
                      cursor: !svc.available ? 'not-allowed' : 'pointer',
                      border: `1px solid ${target === svc.id ? 'transparent' : 'var(--color-border)'}`,
                    }}
                  >
                    <span>{svc.icon}</span>
                    <span>{svc.label}</span>
                    {!svc.available && (
                      <span className="ml-auto text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        준비 중
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Playlist List */}
        <section
          className="rounded-2xl p-5"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">
              플레이리스트
              {playlists.length > 0 && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                  {playlists.length}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-3">
              {playlists.length > 0 && (
                <button
                  onClick={toggleAll}
                  className="text-xs transition-colors"
                  style={{ color: 'var(--color-accent)' }}
                >
                  {allSelected ? '전체 해제' : '전체 선택'}
                </button>
              )}
              <button
                onClick={fetchPlaylists}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {loading ? '로딩 중...' : '새로고침'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
              />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                플레이리스트 불러오는 중...
              </p>
            </div>
          ) : playlists.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-2xl">📭</p>
              <p className="text-sm font-medium">플레이리스트가 없습니다</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                먼저 <code className="px-1 py-0.5 rounded" style={{ background: 'var(--color-surface-2)' }}>playlists.json</code>을 생성하거나 멜론에서 가져오세요
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {playlists.map((pl) => {
                const isSelected = selected.has(pl.id);
                return (
                  <label
                    key={pl.id}
                    className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--color-surface-2)',
                      border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.35)' : 'var(--color-border)'}`,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{
                        background: isSelected ? 'var(--color-accent)' : 'transparent',
                        border: `1.5px solid ${isSelected ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)'}`,
                      }}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(pl.id)}
                      className="sr-only"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{pl.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {pl.song_count.toLocaleString()}곡
                      </p>
                    </div>
                    <div
                      className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
                    >
                      #{pl.id}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </section>

        {/* Status Banner */}
        {status.state !== 'idle' && status.message && (
          <div
            className="rounded-xl px-5 py-3.5 text-sm flex items-center gap-3"
            style={{
              background:
                status.state === 'done'
                  ? 'rgba(34, 197, 94, 0.12)'
                  : status.state === 'error'
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'rgba(99, 102, 241, 0.12)',
              border: `1px solid ${
                status.state === 'done'
                  ? 'rgba(34, 197, 94, 0.3)'
                  : status.state === 'error'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(99, 102, 241, 0.3)'
              }`,
            }}
          >
            <span>
              {status.state === 'done' ? '✅' : status.state === 'error' ? '❌' : '⏳'}
            </span>
            <span>{status.message}</span>
          </div>
        )}

        {/* Footer Action Bar */}
        {playlists.length > 0 && (
          <div className="flex items-center justify-between py-2">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {selected.size > 0 ? (
                <>
                  <span className="font-medium text-white">{selected.size}개</span> 선택 ·{' '}
                  <span className="font-medium text-white">{selectedTracks.toLocaleString()}</span>곡
                </>
              ) : (
                '플레이리스트를 선택하세요'
              )}
            </p>
            <button
              onClick={startMigration}
              disabled={selected.size === 0 || status.state === 'running'}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background:
                  selected.size === 0 || status.state === 'running'
                    ? 'var(--color-surface-2)'
                    : 'var(--color-accent)',
                color:
                  selected.size === 0 || status.state === 'running'
                    ? 'var(--color-text-muted)'
                    : 'white',
                cursor:
                  selected.size === 0 || status.state === 'running' ? 'not-allowed' : 'pointer',
              }}
            >
              {status.state === 'running' ? (
                <>
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }}
                  />
                  이전 중...
                </>
              ) : (
                <>이전 시작 →</>
              )}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
