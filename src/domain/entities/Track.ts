export interface TrackInput {
  title: string;
  artist: string;
  album?: string | null;
  duration?: number | null;
  sourceId?: string | null;
  position?: number | null;
}

export interface Track {
  title: string;
  artist: string;
  album: string | null;
  duration: number | null;
  sourceId: string | null;
  position: number | null;
}

/**
 * 입력을 검증한 뒤 Track 엔티티를 만든다. title, artist는 필수이며 비어 있으면 안 된다.
 */
export function createTrack(input: TrackInput): Track {
  const { title, artist } = input;
  if (!title || typeof title !== 'string' || !String(title).trim()) {
    throw new Error('Track must have a non-empty title');
  }
  if (!artist || typeof artist !== 'string' || !String(artist).trim()) {
    throw new Error('Track must have a non-empty artist');
  }
  return {
    title: String(title).trim(),
    artist: String(artist).trim(),
    album: input.album != null ? String(input.album).trim() || null : null,
    duration: input.duration ?? null,
    sourceId: input.sourceId ?? null,
    position: input.position ?? null,
  };
}

/**
 * value가 Track 형태인지 검사한다. (타입 가드)
 */
export function isTrack(value: unknown): value is Track {
  return (
    typeof value === 'object' &&
    value !== null &&
    'title' in value &&
    'artist' in value &&
    typeof (value as Track).title === 'string' &&
    typeof (value as Track).artist === 'string'
  );
}
