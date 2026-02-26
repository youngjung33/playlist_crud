'use client';

import { useState, useEffect, useCallback } from 'react';

interface PlaylistSummary {
  id: string;
  name: string;
  song_count: number;
}

type FetchState = 'idle' | 'loading' | 'done' | 'error';
type MigrateState = 'idle' | 'loading' | 'done' | 'error';

export default function Home() {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [fetchMessage, setFetchMessage] = useState('');
  const [fetchedCount, setFetchedCount] = useState(0);
  const [fetchedTotal, setFetchedTotal] = useState(0);

  // Step 2
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [migrateState, setMigrateState] = useState<MigrateState>('idle');
  const [migrateMessage, setMigrateMessage] = useState('');

  // 기존 playlists.json이 있으면 Step 2에서 바로 로드
  const loadPlaylists = useCallback(async () => {
    try {
      const res = await fetch('/api/playlists');
      const data = await res.json();
      if (data.playlists?.length > 0) {
        setPlaylists(data.playlists);
        setFetchState('done');
        setFetchedCount(data.playlists.length);
        setFetchedTotal(data.playlists.reduce((s: number, p: PlaylistSummary) => s + p.song_count, 0));
      }
    } catch {
      // 파일 없으면 무시
    }
  }, []);

  useEffect(() => { loadPlaylists(); }, [loadPlaylists]);

  // ── Step 1: 멜론 추출 ─────────────────────────────
  async function handleFetch() {
    setFetchState('loading');
    setFetchMessage('멜론에서 플레이리스트를 가져오는 중입니다...');
    try {
      const res = await fetch('/api/fetch', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFetchState('done');
      setFetchedCount(data.count);
      setFetchedTotal(data.totalTracks);
      setPlaylists(data.playlists);
      setFetchMessage('');
    } catch (e) {
      setFetchState('error');
      setFetchMessage(e instanceof Error ? e.message : '추출 중 오류가 발생했습니다.');
    }
  }

  function handleDownload(format: 'json' | 'xlsx') {
    window.open(`/api/export?format=${format}`, '_blank');
  }

  // ── Step 2: 이전 ───────────────────────────────────
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

  async function handleMigrate() {
    if (selected.size === 0) return;
    setMigrateState('loading');
    setMigrateMessage('이전 요청 중...');
    try {
      const res = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistIds: Array.from(selected), source: 'melon', target: 'ytmusic' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMigrateState('done');
      setMigrateMessage(data.message);
    } catch (e) {
      setMigrateState('error');
      setMigrateMessage(e instanceof Error ? e.message : '이전 중 오류가 발생했습니다.');
    }
  }

  const selectedTracks = playlists
    .filter((p) => selected.has(p.id))
    .reduce((s, p) => s + p.song_count, 0);

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b px-6 py-4"
        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
              style={{ background: 'var(--color-accent)' }}>🎵</div>
            <span className="font-bold text-base">Playlist Transfer</span>
          </div>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer"
            className="text-xs transition-colors hover:text-white"
            style={{ color: 'var(--color-text-muted)' }}>GitHub</a>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Stepper */}
        <div className="flex items-center gap-3">
          {[
            { num: 1, label: '추출', sub: 'Melon → 파일' },
            { num: 2, label: '이전', sub: '파일 → YouTube Music' },
          ].map(({ num, label, sub }, idx) => {
            const isActive = step === num;
            const isDone = (num === 1 && fetchState === 'done') || (num === 2 && migrateState === 'done');
            return (
              <div key={num} className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => (num === 2 && fetchState !== 'done') ? null : setStep(num as 1 | 2)}
                  className="flex items-center gap-3 flex-1 p-4 rounded-2xl transition-all text-left"
                  style={{
                    background: isActive ? 'var(--color-surface)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    opacity: num === 2 && fetchState !== 'done' ? 0.4 : 1,
                    cursor: num === 2 && fetchState !== 'done' ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                      background: isDone ? '#22c55e' : isActive ? 'var(--color-accent)' : 'var(--color-surface-2)',
                    }}
                  >
                    {isDone ? '✓' : num}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>
                  </div>
                </button>
                {idx === 0 && (
                  <div className="text-lg flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>→</div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Source info */}
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: 'var(--color-text-muted)' }}>소스 서비스</p>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'var(--color-surface-2)' }}>
                  <span>🎶</span>
                  <span className="font-medium">Melon</span>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--color-accent)' }}>
                    {process.env.NEXT_PUBLIC_HAS_COOKIE ? '인증됨' : '쿠키 필요'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleFetch}
                disabled={fetchState === 'loading'}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: fetchState === 'loading' ? 'var(--color-surface-2)' : 'var(--color-accent)',
                  color: fetchState === 'loading' ? 'var(--color-text-muted)' : 'white',
                  cursor: fetchState === 'loading' ? 'not-allowed' : 'pointer',
                }}
              >
                {fetchState === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin inline-block"
                      style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }} />
                    추출 중... (플레이리스트 수에 따라 수 분 소요)
                  </span>
                ) : fetchState === 'done' ? '다시 추출하기' : '멜론에서 추출 시작'}
              </button>
            </div>

            {/* 추출 결과 */}
            {fetchState === 'done' && (
              <div className="rounded-2xl p-5 space-y-4"
                style={{ background: 'var(--color-surface)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <div>
                    <p className="font-semibold text-sm">추출 완료</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {fetchedCount}개 플레이리스트 · 총 {fetchedTotal.toLocaleString()}곡
                    </p>
                  </div>
                </div>

                {/* 플레이리스트 미리보기 */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-hidden">
                  {playlists.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'var(--color-surface-2)' }}>
                      <span className="truncate max-w-xs">{p.name}</span>
                      <span className="text-xs ml-3 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                        {p.song_count.toLocaleString()}곡
                      </span>
                    </div>
                  ))}
                </div>

                {/* 다운로드 버튼 */}
                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>파일로 내보내기</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload('json')}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                    >
                      📄 JSON 다운로드
                    </button>
                    <button
                      onClick={() => handleDownload('xlsx')}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                    >
                      📊 Excel 다운로드
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3 rounded-xl font-semibold text-sm"
                  style={{ background: 'var(--color-accent)', color: 'white' }}
                >
                  2단계로 이전하기 →
                </button>
              </div>
            )}

            {/* 에러 */}
            {fetchState === 'error' && (
              <div className="rounded-xl px-5 py-4 text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                ❌ {fetchMessage}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* 플레이리스트 선택 */}
            <div className="rounded-2xl p-5"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-sm">플레이리스트 선택</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    이전할 항목을 선택하세요
                  </p>
                </div>
                <button onClick={toggleAll} className="text-xs transition-colors"
                  style={{ color: 'var(--color-accent)' }}>
                  {selected.size === playlists.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-hidden">
                {playlists.map((pl) => {
                  const isSelected = selected.has(pl.id);
                  return (
                    <label key={pl.id}
                      className="flex items-center gap-4 p-3.5 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: isSelected ? 'rgba(99,102,241,0.12)' : 'var(--color-surface-2)',
                        border: `1px solid ${isSelected ? 'rgba(99,102,241,0.35)' : 'var(--color-border)'}`,
                      }}>
                      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{
                          background: isSelected ? 'var(--color-accent)' : 'transparent',
                          border: `1.5px solid ${isSelected ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)'}`,
                        }}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                          </svg>
                        )}
                      </div>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(pl.id)} className="sr-only" />
                      <span className="flex-1 text-sm font-medium truncate">{pl.name}</span>
                      <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                        {pl.song_count.toLocaleString()}곡
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Target */}
            <div className="rounded-2xl p-5"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--color-text-muted)' }}>대상 서비스</p>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-accent)' }}>
                <span>▶️</span>
                <span className="font-medium text-sm">YouTube Music</span>
                <span className="ml-auto text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  browser.json 필요
                </span>
              </div>
            </div>

            {/* 상태 배너 */}
            {migrateState !== 'idle' && (
              <div className="rounded-xl px-5 py-3.5 text-sm flex items-center gap-3"
                style={{
                  background: migrateState === 'done' ? 'rgba(34,197,94,0.1)'
                    : migrateState === 'error' ? 'rgba(239,68,68,0.1)'
                    : 'rgba(99,102,241,0.1)',
                  border: `1px solid ${migrateState === 'done' ? 'rgba(34,197,94,0.3)'
                    : migrateState === 'error' ? 'rgba(239,68,68,0.3)'
                    : 'rgba(99,102,241,0.3)'}`,
                }}>
                <span>{migrateState === 'done' ? '✅' : migrateState === 'error' ? '❌' : '⏳'}</span>
                <span>{migrateMessage}</span>
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center justify-between py-1">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {selected.size > 0 ? (
                  <><span className="font-medium text-white">{selected.size}개</span> 선택 ·{' '}
                  <span className="font-medium text-white">{selectedTracks.toLocaleString()}</span>곡</>
                ) : '플레이리스트를 선택하세요'}
              </p>
              <button
                onClick={handleMigrate}
                disabled={selected.size === 0 || migrateState === 'loading'}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: selected.size === 0 || migrateState === 'loading'
                    ? 'var(--color-surface-2)' : 'var(--color-accent)',
                  color: selected.size === 0 || migrateState === 'loading'
                    ? 'var(--color-text-muted)' : 'white',
                  cursor: selected.size === 0 || migrateState === 'loading' ? 'not-allowed' : 'pointer',
                }}
              >
                {migrateState === 'loading' ? '이전 중...' : '이전 시작 →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
