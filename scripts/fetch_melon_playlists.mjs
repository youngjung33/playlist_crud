/**
 * 멜론 내 플레이리스트 전체 추출기 (Node.js)
 *
 * 실행: node scripts/fetch_melon_playlists.mjs
 * 출력: playlists.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, ".env") });

const COOKIE = process.env.MELON_COOKIE ?? "";
const MEMBER_KEY = process.env.MELON_MEMBER_KEY ?? "";

if (!COOKIE || !MEMBER_KEY) {
  console.error("❌ scripts/.env 에 MELON_COOKIE 와 MELON_MEMBER_KEY 를 입력해주세요.");
  process.exit(1);
}

const PAGE_SIZE = 50;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  Referer: "https://www.melon.com/",
  Cookie: COOKIE,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ko-KR,ko;q=0.9",
};

async function fetchHtml(url, params = {}) {
  const u = new URL(url);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  const res = await fetch(u.toString(), { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${u.toString()}`);
  return res.text();
}

function parsePlaylistList(html) {
  const playlists = [];
  // 플레이리스트 ID: goPlaylistDetail('0','Y','N','11111111')
  const idRe = /goPlaylistDetail\([^)]*'(\d{6,})'\)/g;
  const seen = new Set();

  let m;
  while ((m = idRe.exec(html)) !== null) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);

    // 주변 HTML에서 이름, 곡수 추출
    const block = html.slice(Math.max(0, m.index - 100), m.index + 1500);

    // 플레이리스트 이름: title="이름 - 페이지 이동"
    const nameM = /title="([^"]+) - 페이지 이동"/.exec(block);
    const name = nameM ? nameM[1].trim() : id;

    // 곡수: 총 NNN곡
    const countM = /총 (\d+)곡/.exec(block);
    const song_count = countM ? parseInt(countM[1]) : 0;

    playlists.push({ id, name, song_count });
  }
  return playlists;
}

function parseSongs(html) {
  const songs = [];
  const rows = html.split("<tr");

  for (const row of rows) {
    // 곡 ID
    const idM = /goSongDetail\('(\d+)'\)/.exec(row);
    if (!idM) continue;
    const id = idM[1];

    // 곡명: title="BANG BANG 곡정보 - 페이지 이동"
    const titleM = /title="([^"]+) 곡정보 - 페이지 이동"/.exec(row);
    const title = titleM ? titleM[1].trim() : "";

    // 아티스트: goArtistDetail 링크 직접 텍스트
    const artistRe = /goArtistDetail\('[^']+'\)[^>]+>([^<]+)</g;
    const artists = [];
    let am;
    while ((am = artistRe.exec(row)) !== null) {
      const a = am[1].trim();
      if (a && !artists.includes(a)) artists.push(a);
    }
    const artist = artists.join(", ");

    // 앨범: goAlbumDetail 링크 텍스트
    const albumM = /goAlbumDetail\('[^']+'\)[^>]+>([^<]+)</.exec(row);
    const album = albumM ? albumM[1].trim() : "";

    if (id && title) {
      songs.push({ id, title, artist, album });
    }
  }
  return songs;
}

async function fetchPlaylistList() {
  console.log("▶ 플레이리스트 목록 조회 중...");
  const url = "https://www.melon.com/mymusic/playlist/mymusicplaylist_listAjax.htm";
  const playlists = [];
  let page = 1;

  while (true) {
    const html = await fetchHtml(url, { memberKey: MEMBER_KEY, startIndex: (page - 1) * PAGE_SIZE + 1, pageSize: PAGE_SIZE });
    const items = parsePlaylistList(html);

    if (items.length === 0) break;
    playlists.push(...items);
    console.log(`  ${page}페이지: ${items.length}개`);

    if (items.length < PAGE_SIZE) break;
    page++;
    await sleep(500);
  }

  return playlists;
}

async function fetchSongsInPlaylist(playlistId, total) {
  const url =
    "https://www.melon.com/mymusic/playlist/mymusicplaylistview_listSong.htm";
  const songs = [];
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  let page = 1;

  while (true) {
    const html = await fetchHtml(url, { plylstSeq: playlistId, page });
    const items = parseSongs(html);

    if (items.length === 0) break;
    songs.push(...items);

    if (items.length < PAGE_SIZE || page >= totalPages) break;
    page++;
    await sleep(300);
  }

  return songs;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("멜론 플레이리스트 추출 시작\n");

  const playlists = await fetchPlaylistList();
  console.log(`\n총 ${playlists.length}개 플레이리스트 발견\n`);

  if (playlists.length === 0) {
    console.error("❌ 플레이리스트를 찾지 못했습니다. 쿠키가 유효한지 확인해주세요.");
    process.exit(1);
  }

  const result = [];
  for (let i = 0; i < playlists.length; i++) {
    const pl = playlists[i];
    console.log(`▶ [${i + 1}/${playlists.length}] '${pl.name}' (${pl.song_count}곡) 조회 중...`);
    const songs = await fetchSongsInPlaylist(pl.id, pl.song_count);
    result.push({ ...pl, songs });
    console.log(`  → ${songs.length}곡 완료`);
    await sleep(500);
  }

  const outputPath = path.join(__dirname, "..", "playlists.json");
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");

  const totalSongs = result.reduce((s, p) => s + p.songs.length, 0);
  console.log(`\n완료: ${result.length}개 플레이리스트, 총 ${totalSongs}곡`);
  console.log(`저장: ${outputPath}`);
}

main().catch((e) => {
  console.error("오류:", e.message);
  process.exit(1);
});
