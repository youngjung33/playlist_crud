# Playlist Transfer

멜론 플레이리스트를 YouTube Music으로 이전하는 웹 도구.

> **현재는 로컬 실행 전용이며**, 서버리스(Vercel 등) 배포는 지원하지 않습니다. `playlists.json`·`data/` 파일 기반 저장을 사용합니다.

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
2. **1단계 (추출)**  
   - **Melon**: 인증 확인 후 **플레이리스트 목록 가져오기** → 원하는 플레이리스트만 선택 (또는 전체 선택) → **추출 시작**. 목록 없이 **전체 추출 시작**만 눌러도 됨.  
   - **또는** JSON/xlsx 파일을 **파일로 불러오기**로 업로드
3. **2단계 (이전)**: YouTube Music 선택 → 이전할 플레이리스트 선택 → **이전 시작**

> 중단해도 `data/import_progress.json`에 진행 상황이 저장되어 이어서 실행 가능합니다.

## 로드맵

- [ ] Spotify, Apple Music 등 추가 서비스 지원
