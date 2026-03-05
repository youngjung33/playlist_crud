"""
YouTube Music 어댑터 (IMusicService의 Python 구현체)

아키텍처 위치: src/adapters/ (Infrastructure / Adapter 계층)
인터페이스: IMusicService (src/domain/repositories/IMusicService.ts) 의 Python 대응

사전 준비:
  1. pip install ytmusicapi
  2. py -3 -m ytmusicapi browser  → browser.json 생성 (이 파일과 같은 폴더)

실행 (프로젝트 루트에서):
  py -3 src/adapters/YouTubeMusicAdapter.py
  py -3 src/adapters/YouTubeMusicAdapter.py --playlist "플레이리스트 이름"
  py -3 src/adapters/YouTubeMusicAdapter.py --dry-run
"""

import json
import time
import argparse
import html
import sys
from pathlib import Path

# UTF-8 출력 + 즉시 flush (Node.js child_process 스트리밍 지원)
sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
sys.stderr.reconfigure(encoding="utf-8", line_buffering=True)

from ytmusicapi import YTMusic

# ─── 경로 설정 ────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent          # src/adapters/
PROJECT_DIR = SCRIPT_DIR.parents[1]         # 프로젝트 루트 (src/adapters → src → 루트)
PLAYLISTS_JSON = PROJECT_DIR / "playlists.json"
AUTH_FILE = SCRIPT_DIR / "browser.json"
DATA_DIR = PROJECT_DIR / "data"
PROGRESS_FILE = DATA_DIR / "import_progress.json"

# ─── 설정 ─────────────────────────────────────────────────────────────────────
SEARCH_DELAY = 0.3
ADD_DELAY = 0.5
BATCH_SIZE = 50


def clean_text(text: str) -> str:
    return html.unescape(text).strip()


def search_song(yt: YTMusic, title: str, artist: str) -> str | None:
    query = f"{title} {artist}"
    try:
        results = yt.search(query, filter="songs", limit=3)
        if results:
            return results[0]["videoId"]
        results = yt.search(query, filter="videos", limit=3)
        if results:
            return results[0]["videoId"]
    except Exception as e:
        print(f"    검색 오류 ({title}): {e}")
    return None


def load_progress() -> dict:
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_progress(progress: dict):
    DATA_DIR.mkdir(exist_ok=True)
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def import_playlist(yt: YTMusic, playlist: dict, dry_run: bool, progress: dict):
    name = clean_text(playlist["name"])
    # playlists.json 이 원본 Melon 포맷("songs") 또는 도메인 포맷("tracks") 모두 지원
    songs = playlist.get("songs") or playlist.get("tracks", [])
    total = len(songs)

    print(f"\n{'='*60}")
    print(f"플레이리스트: {name} ({total}곡)")
    print(f"{'='*60}")

    if progress.get(playlist["id"], {}).get("done"):
        print(f"  이미 완료됨. 스킵합니다.")
        return

    if dry_run:
        print("  [dry-run] 처음 5곡만 검색 테스트합니다.")
        for song in songs[:5]:
            title = clean_text(song["title"])
            artist = clean_text(song["artist"])
            video_id = search_song(yt, title, artist)
            status = f"OK {video_id}" if video_id else "MISS"
            print(f"  {status} | {title} - {artist}")
            time.sleep(SEARCH_DELAY)
        return

    pl_progress = progress.get(playlist["id"], {"yt_playlist_id": None, "done_indices": []})
    yt_playlist_id = pl_progress.get("yt_playlist_id")
    done_indices = set(pl_progress.get("done_indices", []))

    if not yt_playlist_id:
        print(f"  YouTube Music에 플레이리스트 생성 중...")
        yt_playlist_id = yt.create_playlist(
            title=name,
            description=f"멜론에서 가져온 플레이리스트 ({total}곡)",
            privacy_status="PRIVATE",
        )
        pl_progress["yt_playlist_id"] = yt_playlist_id
        progress[playlist["id"]] = pl_progress
        save_progress(progress)
        print(f"  생성 완료: {yt_playlist_id}")

    found_ids = []
    not_found = []

    for i, song in enumerate(songs):
        if i in done_indices:
            continue

        title = clean_text(song["title"])
        artist = clean_text(song["artist"])
        video_id = search_song(yt, title, artist)
        time.sleep(SEARCH_DELAY)

        if video_id:
            found_ids.append(video_id)
            print(f"  [{i+1}/{total}] OK {title} - {artist}")
        else:
            not_found.append({"index": i, "title": title, "artist": artist})
            print(f"  [{i+1}/{total}] MISS {title} - {artist}")

        if len(found_ids) >= BATCH_SIZE:
            yt.add_playlist_items(yt_playlist_id, found_ids, duplicates=False)
            done_indices.update(range(i - len(found_ids) + 1, i + 1))
            pl_progress["done_indices"] = list(done_indices)
            save_progress(progress)
            print(f"  -> {len(found_ids)}곡 추가 완료 (누적 {len(done_indices)}곡)")
            found_ids = []
            time.sleep(ADD_DELAY)

    if found_ids:
        yt.add_playlist_items(yt_playlist_id, found_ids, duplicates=False)
        print(f"  -> 나머지 {len(found_ids)}곡 추가 완료")
        time.sleep(ADD_DELAY)

    pl_progress["done"] = True
    pl_progress["not_found"] = not_found
    progress[playlist["id"]] = pl_progress
    save_progress(progress)

    found_count = total - len(not_found)
    print(f"\n  완료: {found_count}/{total}곡 추가됨")
    if not_found:
        print(f"  못 찾은 곡 ({len(not_found)}개):")
        for nf in not_found[:10]:
            print(f"    - {nf['title']} - {nf['artist']}")
        if len(not_found) > 10:
            print(f"    ... 외 {len(not_found)-10}곡 (import_progress.json 참고)")


def main():
    parser = argparse.ArgumentParser(description="멜론 -> YouTube Music 플레이리스트 임포터")
    parser.add_argument("--playlist", help="특정 플레이리스트 이름만 처리")
    parser.add_argument("--ids", help="쉼표로 구분된 플레이리스트 ID 목록만 처리 (웹 UI 전달용)")
    parser.add_argument("--dry-run", action="store_true", help="실제 추가 없이 검색만 테스트")
    args = parser.parse_args()

    ids_filter: set[str] | None = set(args.ids.split(",")) if args.ids else None

    if not PLAYLISTS_JSON.exists():
        print(f"MISS {PLAYLISTS_JSON} 파일이 없습니다. 먼저 멜론 추출을 실행하세요.")
        return

    if not AUTH_FILE.exists() and not args.dry_run:
        print(f"MISS {AUTH_FILE} 파일이 없습니다.")
        print("아래 명령어로 인증 파일을 먼저 생성하세요:")
        print("  py -3 -m ytmusicapi browser")
        return

    print("YouTube Music 인증 중...")
    if args.dry_run and not AUTH_FILE.exists():
        yt = YTMusic()
    else:
        yt = YTMusic(str(AUTH_FILE))
    print("인증 완료\n")

    with open(PLAYLISTS_JSON, encoding="utf-8") as f:
        playlists = json.load(f)

    print(f"총 {len(playlists)}개 플레이리스트 발견:")
    for p in playlists:
        songs = p.get("songs") or p.get("tracks", [])
        print(f"  - {clean_text(p['name'])}: {p.get('song_count') or len(songs)}곡")

    progress = load_progress()

    for playlist in playlists:
        if args.playlist and clean_text(playlist["name"]) != args.playlist:
            continue
        if ids_filter and str(playlist.get("id", "")) not in ids_filter:
            continue
        import_playlist(yt, playlist, args.dry_run, progress)

    print("\n\n모든 작업 완료!")
    if args.dry_run:
        print("실제 임포트를 하려면 --dry-run 없이 실행하세요.")


if __name__ == "__main__":
    main()
