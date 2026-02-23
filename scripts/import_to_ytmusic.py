"""
플레이리스트 → YouTube Music 이동

사전 준비:
  1. pip install ytmusicapi
  2. py -3 -m ytmusicapi browser  → browser.json 생성 (이 스크립트와 같은 폴더)

실행:
  py -3 scripts/import_to_ytmusic.py
  py -3 scripts/import_to_ytmusic.py --playlist "플레이리스트 이름"  # 특정 하나만
  py -3 scripts/import_to_ytmusic.py --dry-run                        # 검색만 테스트
"""

import json
import time
import argparse
import html
import os
import sys
from pathlib import Path

# Windows 터미널 UTF-8 출력 강제
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from ytmusicapi import YTMusic

# ─── 경로 설정 ────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
PLAYLISTS_JSON = PROJECT_DIR / "playlists.json"
AUTH_FILE = SCRIPT_DIR / "browser.json"
PROGRESS_FILE = SCRIPT_DIR / "import_progress.json"

# ─── 설정 ─────────────────────────────────────────────────────────────────────
SEARCH_DELAY = 0.3   # 검색 요청 간격 (초)
ADD_DELAY = 0.5      # 곡 추가 간격 (초)
BATCH_SIZE = 50      # 한 번에 추가할 곡 수


def clean_text(text: str) -> str:
    """HTML 엔티티 디코딩 및 공백 정리"""
    return html.unescape(text).strip()


def search_song(yt: YTMusic, title: str, artist: str) -> str | None:
    """YouTube Music에서 곡 검색 후 videoId 반환"""
    query = f"{title} {artist}"
    try:
        results = yt.search(query, filter="songs", limit=3)
        if results:
            return results[0]["videoId"]

        # songs 필터로 없으면 videos로 재시도
        results = yt.search(query, filter="videos", limit=3)
        if results:
            return results[0]["videoId"]
    except Exception as e:
        print(f"    ⚠ 검색 오류 ({title}): {e}")
    return None


def load_progress() -> dict:
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_progress(progress: dict):
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def import_playlist(yt: YTMusic, playlist: dict, dry_run: bool, progress: dict):
    name = clean_text(playlist["name"])
    songs = playlist["songs"]
    total = len(songs)

    print(f"\n{'='*60}")
    print(f"플레이리스트: {name} ({total}곡)")
    print(f"{'='*60}")

    # 이미 완료된 경우 스킵
    if progress.get(playlist["id"], {}).get("done"):
        print(f"  ✅ 이미 완료됨. 스킵합니다.")
        return

    if dry_run:
        # dry-run: 처음 5곡만 검색 테스트
        print("  [dry-run] 처음 5곡만 검색 테스트합니다.")
        for song in songs[:5]:
            title = clean_text(song["title"])
            artist = clean_text(song["artist"])
            video_id = search_song(yt, title, artist)
            status = f"✅ {video_id}" if video_id else "❌ 못 찾음"
            print(f"  {status} | {title} - {artist}")
            time.sleep(SEARCH_DELAY)
        return

    # 진행 상황 불러오기 (재시작 지원)
    pl_progress = progress.get(playlist["id"], {"yt_playlist_id": None, "done_indices": []})
    yt_playlist_id = pl_progress.get("yt_playlist_id")
    done_indices = set(pl_progress.get("done_indices", []))

    # YouTube Music 플레이리스트 생성 (아직 없으면)
    if not yt_playlist_id:
        print(f"  ▶ YouTube Music에 플레이리스트 생성 중...")
        yt_playlist_id = yt.create_playlist(
            title=name,
            description=f"멜론에서 가져온 플레이리스트 ({total}곡)",
            privacy_status="PRIVATE",
        )
        pl_progress["yt_playlist_id"] = yt_playlist_id
        progress[playlist["id"]] = pl_progress
        save_progress(progress)
        print(f"  ✅ 생성 완료: {yt_playlist_id}")

    # 곡 검색 및 추가
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
            print(f"  [{i+1}/{total}] ✅ {title} - {artist}")
        else:
            not_found.append({"index": i, "title": title, "artist": artist})
            print(f"  [{i+1}/{total}] ❌ {title} - {artist}")

        # BATCH_SIZE마다 일괄 추가
        if len(found_ids) >= BATCH_SIZE:
            yt.add_playlist_items(yt_playlist_id, found_ids, duplicates=False)
            done_indices.update(range(i - len(found_ids) + 1, i + 1))
            pl_progress["done_indices"] = list(done_indices)
            save_progress(progress)
            print(f"  → {len(found_ids)}곡 추가 완료 (누적 {len(done_indices)}곡)")
            found_ids = []
            time.sleep(ADD_DELAY)

    # 남은 곡 추가
    if found_ids:
        yt.add_playlist_items(yt_playlist_id, found_ids, duplicates=False)
        print(f"  → 나머지 {len(found_ids)}곡 추가 완료")
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
    parser = argparse.ArgumentParser(description="멜론 → YouTube Music 플레이리스트 임포터")
    parser.add_argument("--playlist", help="특정 플레이리스트 이름만 처리")
    parser.add_argument("--dry-run", action="store_true", help="실제 추가 없이 검색만 테스트")
    args = parser.parse_args()

    # 파일 존재 확인
    if not PLAYLISTS_JSON.exists():
        print(f"❌ {PLAYLISTS_JSON} 파일이 없습니다. 먼저 멜론 추출을 실행하세요.")
        return

    if not AUTH_FILE.exists() and not args.dry_run:
        print(f"❌ {AUTH_FILE} 파일이 없습니다.")
        print("아래 명령어로 인증 파일을 먼저 생성하세요:")
        print("  py -3 -m ytmusicapi browser")
        return

    # ytmusicapi 초기화
    print("YouTube Music 인증 중...")
    if args.dry_run and not AUTH_FILE.exists():
        yt = YTMusic()  # 익명 (검색만 가능)
    else:
        yt = YTMusic(str(AUTH_FILE))
    print("✅ 인증 완료\n")

    # 플레이리스트 로드
    with open(PLAYLISTS_JSON, encoding="utf-8") as f:
        playlists = json.load(f)

    print(f"총 {len(playlists)}개 플레이리스트 발견:")
    for p in playlists:
        print(f"  - {clean_text(p['name'])}: {p['song_count']}곡")

    # 진행 상황 로드
    progress = load_progress()

    # 처리
    for playlist in playlists:
        if args.playlist and clean_text(playlist["name"]) != args.playlist:
            continue
        import_playlist(yt, playlist, args.dry_run, progress)

    print("\n\n모든 작업 완료!")
    if args.dry_run:
        print("실제 임포트를 하려면 --dry-run 없이 실행하세요.")


if __name__ == "__main__":
    main()
