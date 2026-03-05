# Playlist Transfer

멜론 플레이리스트를 YouTube Music으로 이전하는 웹 도구.

## 필수 조건

- Node.js 18+
- Python 3.9+
- `pip install ytmusicapi`

## 설치 및 실행

```bash
git clone https://github.com/youngjung33/playlist_crud.git
cd playlist_crud
npm install
cp .env.example .env   # .env 파일 편집 후 멜론 쿠키 입력
npm run dev
```

## 환경 설정

### 멜론 쿠키 (`.env`)

멜론 웹사이트 로그인 후 개발자 도구 → Application → Cookies에서 복사

```env
MELON_COOKIE=__T_=...; keyCookie=12345; ...
MELON_MEMBER_KEY=12345
```

### YouTube Music 인증 (`src/adapters/browser.json`)

```bash
cd src/adapters
py -3 -m ytmusicapi browser
```

## 사용법

1. `http://localhost:3000` 접속
2. **1단계**: Melon 선택 → 추출 시작 (또는 JSON/xlsx 파일 업로드)
3. **2단계**: YouTube Music 선택 → 플레이리스트 선택 → 이전 시작

> 중단해도 `data/import_progress.json`에 진행 상황이 저장되어 이어서 실행 가능합니다.

## 로드맵

- [ ] Spotify, Apple Music 등 추가 서비스 지원
