'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface PlaylistSummary {
  id: string;
  name: string;
  song_count: number;
}

type AsyncState = 'idle' | 'loading' | 'done' | 'error';
type ValidateState = 'idle' | 'loading' | 'valid' | 'invalid';

interface ServiceConfig {
  id: string;
  label: string;
  icon: string;
  available: boolean;
  hint?: string;
}

const SOURCE_SERVICES: ServiceConfig[] = [
  { id: 'melon',   label: 'Melon',        icon: '🎶', available: true,  hint: '쿠키 인증' },
  { id: 'spotify', label: 'Spotify',       icon: '🟢', available: false },
  { id: 'apple',   label: 'Apple Music',   icon: '🍎', available: false },
  { id: 'bugs',    label: 'Bugs',          icon: '🎸', available: false },
  { id: 'genie',   label: 'Genie',         icon: '🎵', available: false },
  { id: 'vibe',    label: 'Vibe',          icon: '💜', available: false },
];

const TARGET_SERVICES: ServiceConfig[] = [
  { id: 'ytmusic', label: 'YouTube Music', icon: '▶️', available: true,  hint: 'browser.json 필요' },
  { id: 'spotify', label: 'Spotify',       icon: '🟢', available: false },
  { id: 'apple',   label: 'Apple Music',   icon: '🍎', available: false },
  { id: 'melon',   label: 'Melon',         icon: '🎶', available: false },
  { id: 'bugs',    label: 'Bugs',          icon: '🎸', available: false },
  { id: 'genie',   label: 'Genie',         icon: '🎵', available: false },
];

export default function Home() {
  const [step, setStep] = useState<1 | 2>(1);
  const [sourceService, setSourceService] = useState('melon');
  const [targetService, setTargetService] = useState('ytmusic');

  // Step 1 공통 결과
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [resultTotal, setResultTotal] = useState(0);

  // Step 1 — 멜론 쿠키 검증
  const [validateState, setValidateState] = useState<ValidateState>('idle');
  const [validateMessage, setValidateMessage] = useState('');

  // Step 1 — 멜론 추출
  const [fetchState, setFetchState] = useState<AsyncState>('idle');
  const [fetchMessage, setFetchMessage] = useState('');

  // Step 1 — 파일 업로드
  const [uploadState, setUploadState] = useState<AsyncState>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 — 이전
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [migrateState, setMigrateState] = useState<AsyncState>('idle');
  const [migrateMessage, setMigrateMessage] = useState('');
  const [migrateLogs, setMigrateLogs] = useState<{ text: string; isError: boolean }[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Step 2 — YouTube Music 인증 검증
  const [ytValidateState, setYtValidateState] = useState<ValidateState>('idle');
  const [ytValidateMessage, setYtValidateMessage] = useState('');

  const isStep1Done = fetchState === 'done' || uploadState === 'done';

  // ── 멜론 쿠키 검증 ─────────────────────────────────────────────
  const validate = useCallback(async () => {
    setValidateState('loading');
    setValidateMessage('');
    try {
      const res = await fetch('/api/validate');
      const data = await res.json();
      if (data.ok) {
        setValidateState('valid');
      } else {
        setValidateState('invalid');
        setValidateMessage(data.reason ?? '인증 실패');
      }
    } catch {
      setValidateState('invalid');
      setValidateMessage('검증 요청 중 오류가 발생했습니다.');
    }
  }, []);

  // ── YouTube Music 인증 검증 ────────────────────────────────────
  const validateYTMusic = useCallback(async () => {
    setYtValidateState('loading');
    setYtValidateMessage('');
    try {
      const res = await fetch('/api/validate-ytmusic');
      const data = await res.json();
      if (data.ok) {
        setYtValidateState('valid');
      } else {
        setYtValidateState('invalid');
        setYtValidateMessage(data.reason ?? '인증 실패');
      }
    } catch {
      setYtValidateState('invalid');
      setYtValidateMessage('검증 요청 중 오류가 발생했습니다.');
    }
  }, []);

  // 2단계 진입 시 YT Music 인증 자동 검증
  useEffect(() => {
    if (step === 2 && ytValidateState === 'idle') validateYTMusic();
  }, [step, ytValidateState, validateYTMusic]);

  // 로그 추가 시 자동 스크롤
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [migrateLogs]);

  // 기존 playlists.json 자동 로드 + 쿠키 검증 동시 실행
  const loadExisting = useCallback(async () => {
    try {
      const res = await fetch('/api/playlists');
      const data = await res.json();
      if (data.playlists?.length > 0) {
        setPlaylists(data.playlists);
        setResultCount(data.playlists.length);
        setResultTotal(data.playlists.reduce((s: number, p: PlaylistSummary) => s + p.song_count, 0));
        setFetchState('done');
      }
    } catch { /* 파일 없으면 무시 */ }
  }, []);

  useEffect(() => {
    loadExisting();
    validate(); // 페이지 로드 시 자동 검증
  }, [loadExisting, validate]);

  // ── 공통: 결과 적용 ────────────────────────────────────────────
  function applyResult(data: { playlists: PlaylistSummary[]; count: number; totalTracks: number }) {
    setPlaylists(data.playlists);
    setResultCount(data.count);
    setResultTotal(data.totalTracks);
    setSelected(new Set());
  }

  // ── 멜론 추출 ─────────────────────────────────────────────────
  async function handleFetch() {
    setFetchState('loading');
    setFetchMessage('');
    setUploadState('idle'); // 다른 경로 초기화
    try {
      const res = await fetch('/api/fetch', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFetchState('done');
      applyResult(data);
    } catch (e) {
      setFetchState('error');
      setFetchMessage(e instanceof Error ? e.message : '추출 중 오류가 발생했습니다.');
    }
  }

  // ── 파일 업로드 ───────────────────────────────────────────────
  async function handleFileUpload(file: File) {
    setUploadState('loading');
    setUploadMessage('');
    setFetchState('idle'); // 다른 경로 초기화
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUploadState('done');
      applyResult(data);
    } catch (e) {
      setUploadState('error');
      setUploadMessage(e instanceof Error ? e.message : '파일 처리 중 오류가 발생했습니다.');
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }

  function handleDownload(format: 'json' | 'xlsx') {
    window.open(`/api/export?format=${format}`, '_blank');
  }

  // ── Step 2 ────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(selected.size === playlists.length ? new Set() : new Set(playlists.map((p) => p.id)));
  }

  async function handleMigrate() {
    if (selected.size === 0) return;
    setMigrateState('loading');
    setMigrateMessage('');
    setMigrateLogs([]);

    const addLog = (text: string, isError = false) =>
      setMigrateLogs((prev) => [...prev, { text, isError }]);

    try {
      const res = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistIds: Array.from(selected),
          source: sourceService,
          target: targetService,
        }),
      });

      // 일반 JSON 오류 응답 처리
      if (!res.ok || !res.headers.get('content-type')?.includes('text/event-stream')) {
        const data = await res.json();
        throw new Error(data.error ?? '이전 요청 실패');
      }

      // SSE 스트림 수신
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let gotDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === 'log') addLog(evt.message);
            else if (evt.type === 'error') addLog(evt.message, true);
            else if (evt.type === 'done') {
              gotDone = true;
              if (evt.success) {
                setMigrateState('done');
                setMigrateMessage('이전이 완료되었습니다.');
              } else {
                setMigrateState('error');
                setMigrateMessage('이전 중 오류가 발생했습니다. 아래 로그를 확인하세요.');
              }
            }
          } catch { /* JSON parse error */ }
        }
      }

      // 연결이 끊겼는데 done 이벤트가 안 왔으면 (재시작·타임아웃 등) loading 탈출
      if (!gotDone) {
        setMigrateState('error');
        setMigrateMessage('연결이 끊겼습니다. 페이지를 새로고침하고 다시 시도하세요.');
      }
    } catch (e) {
      setMigrateState('error');
      setMigrateMessage(e instanceof Error ? e.message : '이전 중 오류가 발생했습니다.');
    }
  }

  const selectedTracks = playlists.filter((p) => selected.has(p.id)).reduce((s, p) => s + p.song_count, 0);

  // ── 스타일 헬퍼 ───────────────────────────────────────────────
  const card = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
  };

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b px-6 py-4"
        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
              style={{ background: 'var(--color-accent)' }}>🎵</div>
            <span className="font-bold text-base">Playlist Transfer</span>
          </div>
          <a href="https://github.com/youngjung33/playlist_crud" target="_blank" rel="noopener noreferrer"
            className="text-xs hover:text-white transition-colors"
            style={{ color: 'var(--color-text-muted)' }}>GitHub</a>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">

        {/* Stepper */}
        <div className="flex items-center gap-3">
          {[
            { num: 1, label: '1단계', sub: `${SOURCE_SERVICES.find(s => s.id === sourceService)?.label ?? ''} 추출` },
            { num: 2, label: '2단계', sub: `${TARGET_SERVICES.find(s => s.id === targetService)?.label ?? ''} 이전` },
          ].map(({ num, label, sub }, idx) => {
            const isActive = step === num;
            const isDone = num === 1 ? isStep1Done : migrateState === 'done';
            const disabled = num === 2 && !isStep1Done;
            return (
              <div key={num} className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => !disabled && setStep(num as 1 | 2)}
                  disabled={disabled}
                  className="flex items-center gap-3 flex-1 p-4 rounded-2xl text-left transition-all"
                  style={{
                    background: isActive ? 'var(--color-surface)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    opacity: disabled ? 0.4 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: isDone ? '#22c55e' : isActive ? 'var(--color-accent)' : 'var(--color-surface-2)' }}>
                    {isDone ? '✓' : num}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>
                  </div>
                </button>
                {idx === 0 && <span className="text-lg flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>→</span>}
              </div>
            );
          })}
        </div>

        {/* ════════════════ STEP 1 ════════════════ */}
        {step === 1 && (
          <div className="space-y-3">

            {/* 옵션 A: 소스 서비스 선택 후 추출 */}
            <div className="rounded-2xl p-5 space-y-3" style={card}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--color-accent)' }}>방법 1</span>
                <span className="text-sm font-semibold">스트리밍 서비스에서 직접 추출</span>
              </div>

              {/* 소스 서비스 그리드 */}
              <div className="grid grid-cols-3 gap-2">
                {SOURCE_SERVICES.map((svc) => {
                  const isSelected = sourceService === svc.id;
                  return (
                    <button
                      key={svc.id}
                      onClick={() => svc.available && setSourceService(svc.id)}
                      disabled={!svc.available}
                      className="relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: isSelected ? 'rgba(99,102,241,0.15)' : 'var(--color-surface-2)',
                        border: `1.5px solid ${isSelected ? 'var(--color-accent)' : 'transparent'}`,
                        opacity: svc.available ? 1 : 0.45,
                        cursor: svc.available ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <span className="text-xl">{svc.icon}</span>
                      <span className="truncate w-full text-center">{svc.label}</span>
                      {!svc.available && (
                        <span className="absolute top-1.5 right-1.5 text-[9px] px-1 py-0.5 rounded font-bold"
                          style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--color-text-muted)' }}>
                          준비 중
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 선택된 서비스의 인증 상태 (Melon만 해당) */}
              {sourceService === 'melon' && (
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--color-surface-2)' }}>
                <div className="flex items-center gap-2">
                  <span>🔑</span>
                  <span className="font-medium">Melon 쿠키</span>
                </div>
                <div className="flex items-center gap-2">
                  {validateState === 'loading' && (
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <span className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin inline-block"
                        style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }} />
                      검증 중...
                    </span>
                  )}
                  {validateState === 'valid' && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
                      ✓ 인증됨
                    </span>
                  )}
                  {validateState === 'invalid' && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                      ✗ 인증 실패
                    </span>
                  )}
                  {validateState === 'idle' && (
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>미확인</span>
                  )}
                  <button
                    onClick={validate}
                    disabled={validateState === 'loading'}
                    className="text-xs px-2 py-0.5 rounded-lg transition-colors"
                    style={{
                      background: 'var(--color-surface)',
                      color: 'var(--color-text-muted)',
                      border: '1px solid var(--color-border)',
                      cursor: validateState === 'loading' ? 'not-allowed' : 'pointer',
                    }}>
                    재검증
                  </button>
                </div>
              </div>
              )}

              {/* 인증 실패 메시지 */}
              {sourceService === 'melon' && validateState === 'invalid' && validateMessage && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>
                  ⚠️ {validateMessage}
                </p>
              )}

              {/* 추출 버튼 — 인증 완료 시에만 활성화 */}
              <button
                onClick={handleFetch}
                disabled={fetchState === 'loading' || validateState !== 'valid'}
                className="w-full py-2.5 rounded-xl font-medium text-sm transition-all"
                style={{
                  background: fetchState === 'loading' || validateState !== 'valid'
                    ? 'var(--color-surface-2)' : 'var(--color-accent)',
                  color: fetchState === 'loading' || validateState !== 'valid'
                    ? 'var(--color-text-muted)' : 'white',
                  cursor: fetchState === 'loading' || validateState !== 'valid' ? 'not-allowed' : 'pointer',
                }}>
                {fetchState === 'loading'
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin inline-block"
                        style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }} />
                      추출 중... (수 분 소요될 수 있습니다)
                    </span>
                  : validateState !== 'valid'
                    ? '🔒 인증 확인 후 추출 가능'
                    : fetchState === 'done' ? '다시 추출하기' : '추출 시작'}
              </button>
              {fetchState === 'error' && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                  ❌ {fetchMessage}
                </p>
              )}
            </div>

            {/* 구분선 */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>또는</span>
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            </div>

            {/* 옵션 B: 파일 업로드 */}
            <div className="rounded-2xl p-5 space-y-3" style={card}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>방법 2</span>
                <span className="text-sm font-semibold">파일로 불러오기</span>
              </div>

              {/* 드래그 앤 드롭 영역 */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl flex flex-col items-center justify-center gap-2 py-8 cursor-pointer transition-all"
                style={{
                  border: `2px dashed ${isDragging ? 'var(--color-accent)' : 'rgba(255,255,255,0.12)'}`,
                  background: isDragging ? 'rgba(99,102,241,0.08)' : 'var(--color-surface-2)',
                }}
              >
                <span className="text-2xl">{uploadState === 'loading' ? '⏳' : '📂'}</span>
                <p className="text-sm font-medium">
                  {uploadState === 'loading' ? '처리 중...' : '파일을 드래그하거나 클릭하여 선택'}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  JSON · Excel (.xlsx) 지원
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.xlsx,.xls"
                  className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ''; }}
                />
              </div>
              {uploadState === 'error' && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                  ❌ {uploadMessage}
                </p>
              )}
            </div>

            {/* 공통 결과 카드 */}
            {isStep1Done && (
              <div className="rounded-2xl p-5 space-y-4"
                style={{ background: 'var(--color-surface)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <div>
                    <p className="font-semibold text-sm">준비 완료</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {resultCount}개 플레이리스트 · 총 {resultTotal.toLocaleString()}곡
                    </p>
                  </div>
                </div>

                {/* 미리보기 */}
                <div className="space-y-1.5 max-h-44 overflow-y-auto scrollbar-hidden">
                  {playlists.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'var(--color-surface-2)' }}>
                      <span className="truncate">{p.name}</span>
                      <span className="text-xs ml-3 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                        {p.song_count.toLocaleString()}곡
                      </span>
                    </div>
                  ))}
                </div>

                {/* 내보내기 */}
                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>파일로 내보내기</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleDownload('json')}
                      className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
                      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                      📄 JSON
                    </button>
                    <button onClick={() => handleDownload('xlsx')}
                      className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
                      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                      📊 Excel
                    </button>
                  </div>
                </div>

                <button onClick={() => setStep(2)}
                  className="w-full py-3 rounded-xl font-semibold text-sm"
                  style={{ background: 'var(--color-accent)', color: 'white' }}>
                  2단계로 이전하기 →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════ STEP 2 ════════════════ */}
        {step === 2 && (
          <div className="space-y-4">

            {/* 플레이리스트 선택 */}
            <div className="rounded-2xl p-5" style={card}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-sm">플레이리스트 선택</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>이전할 항목을 선택하세요</p>
                </div>
                <button onClick={toggleAll} className="text-xs" style={{ color: 'var(--color-accent)' }}>
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
                      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
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

            {/* 대상 서비스 */}
            <div className="rounded-2xl p-5 space-y-3" style={card}>
              <p className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}>대상 서비스</p>
              <div className="grid grid-cols-3 gap-2">
                {TARGET_SERVICES.map((svc) => {
                  const isSelected = targetService === svc.id;
                  return (
                    <button
                      key={svc.id}
                      onClick={() => svc.available && setTargetService(svc.id)}
                      disabled={!svc.available}
                      className="relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: isSelected ? 'rgba(99,102,241,0.15)' : 'var(--color-surface-2)',
                        border: `1.5px solid ${isSelected ? 'var(--color-accent)' : 'transparent'}`,
                        opacity: svc.available ? 1 : 0.45,
                        cursor: svc.available ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <span className="text-xl">{svc.icon}</span>
                      <span className="truncate w-full text-center">{svc.label}</span>
                      {!svc.available && (
                        <span className="absolute top-1.5 right-1.5 text-[9px] px-1 py-0.5 rounded font-bold"
                          style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--color-text-muted)' }}>
                          준비 중
                        </span>
                      )}
                      {svc.available && svc.hint && (
                        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          {svc.hint}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* YouTube Music 인증 상태 */}
              {targetService === 'ytmusic' && (
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--color-surface-2)' }}>
                  <div className="flex items-center gap-2">
                    <span>🔑</span>
                    <span className="font-medium">YouTube Music 인증</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ytValidateState === 'loading' && (
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        <span className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin inline-block"
                          style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }} />
                        검증 중...
                      </span>
                    )}
                    {ytValidateState === 'valid' && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
                        ✓ 인증됨
                      </span>
                    )}
                    {ytValidateState === 'invalid' && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                        ✗ 미인증
                      </span>
                    )}
                    {ytValidateState === 'idle' && (
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>미확인</span>
                    )}
                    <button
                      onClick={validateYTMusic}
                      disabled={ytValidateState === 'loading'}
                      className="text-xs px-2 py-0.5 rounded-lg transition-colors"
                      style={{
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-muted)',
                        border: '1px solid var(--color-border)',
                        cursor: ytValidateState === 'loading' ? 'not-allowed' : 'pointer',
                      }}>
                      재검증
                    </button>
                  </div>
                </div>
              )}

              {/* 인증 실패 안내 */}
              {targetService === 'ytmusic' && ytValidateState === 'invalid' && ytValidateMessage && (
                <p className="text-xs px-3 py-2 rounded-lg leading-relaxed"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>
                  ⚠️ {ytValidateMessage}
                </p>
              )}
            </div>

            {/* 실시간 로그 */}
            {migrateLogs.length > 0 && (
              <div className="rounded-xl p-4 font-mono text-xs overflow-y-auto max-h-64 space-y-0.5"
                style={{ background: '#0d1117', border: '1px solid var(--color-border)' }}>
                {migrateLogs.map((log, i) => (
                  <div key={i} className="leading-relaxed whitespace-pre-wrap break-all"
                    style={{ color: log.isError ? '#f87171' : '#d1d5db' }}>
                    {log.isError ? '⚠ ' : ''}{log.text}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            )}

            {/* 상태 배너 */}
            {migrateState !== 'idle' && migrateMessage && (
              <div className="rounded-xl px-5 py-3.5 text-sm flex items-center gap-3"
                style={{
                  background: migrateState === 'done' ? 'rgba(34,197,94,0.1)' : migrateState === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                  border: `1px solid ${migrateState === 'done' ? 'rgba(34,197,94,0.3)' : migrateState === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`,
                }}>
                <span>{migrateState === 'done' ? '✅' : migrateState === 'error' ? '❌' : '⏳'}</span>
                <span>{migrateMessage}</span>
              </div>
            )}

            {/* Action bar */}
            {(() => {
              const isDisabled =
                selected.size === 0 ||
                migrateState === 'loading' ||
                ytValidateState !== 'valid';
              const btnLabel =
                migrateState === 'loading'
                  ? '이전 중...'
                  : ytValidateState !== 'valid'
                  ? '🔒 인증 확인 후 이전 가능'
                  : selected.size === 0
                  ? '플레이리스트를 선택하세요'
                  : '이전 시작 →';
              return (
                <div className="flex items-center justify-between py-1">
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {selected.size > 0
                      ? <><span className="font-medium text-white">{selected.size}개</span> 선택 · <span className="font-medium text-white">{selectedTracks.toLocaleString()}</span>곡</>
                      : '플레이리스트를 선택하세요'}
                  </p>
                  <button onClick={handleMigrate}
                    disabled={isDisabled}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: isDisabled ? 'var(--color-surface-2)' : 'var(--color-accent)',
                      color: isDisabled ? 'var(--color-text-muted)' : 'white',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                    }}>
                    {migrateState === 'loading'
                      ? <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin inline-block"
                            style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }} />
                          {btnLabel}
                        </span>
                      : btnLabel}
                  </button>
                </div>
              );
            })()}

          </div>
        )}
      </div>
    </main>
  );
}
