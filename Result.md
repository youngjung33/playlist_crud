# 멜론 플레이리스트 추출 시도 결과

## 환경
- 디바이스: Samsung Galaxy , ADB 연결됨
- 대상 앱: `com.iloen.melon` (멜론 뮤직)
- 루트: 없음 / 앱 debuggable: 아님

---

## 시도 1. run-as (내부 DB 직접 접근)

```bash
adb shell "run-as com.iloen.melon ls /data/data/com.iloen.melon/"
```

**결과: ❌ 실패**
- 오류: `run-as: package not debuggable: com.iloen.melon`
- 원인: 릴리즈 앱은 debuggable 플래그 없음

---

## 시도 2. ADB Backup

```bash
adb backup -noapk -f melon_backup.ab com.iloen.melon
```

**결과: ❌ 실패**
- 백업 파일 생성됨 (`melon_backup.ab`) 하지만 **549 bytes** 짜리 헤더만 존재
- 헤더 내용: `ANDROID BACKUP / 5 / 1 / AES-256`
- 원인: 앱이 `allowBackup=false` + AES-256 암호화 설정으로 데이터 차단

---

## 시도 3. OkHttp mcache 파싱

```bash
adb pull /sdcard/Android/data/com.iloen.melon/files/mcache/ ./mcache_dump/
```

**결과: ❌ 실패**
- 525개 파일 (약 1GB) pull 성공
- `.0` 파일: 정수값 하나만 저장 (checksum 추정), URL 정보 없음
- `.1` 파일: 전부 AES 암호화된 바이너리 (magic bytes 랜덤)
- 원인: 앱이 캐시 데이터를 자체 암호화 처리함, 복호화 키는 `/data/data/` 내부에 있어 루트 없이 접근 불가

---

## 접근 가능한 경로 (외부 저장소)

```
/sdcard/Android/data/com.iloen.melon/
├── files/
│   ├── offline/2/   (오프라인 파일 없음)
│   ├── mcache/      (암호화된 캐시 525개)
│   ├── melon.info   (암호화된 인증 정보)
│   ├── log/
│   ├── lyric/
│   └── streamlyric/
└── cache/
    ├── image_cache/
    ├── coil_image_cache/
    └── http/
```

---

## 현재 상태 요약

| 방법 | 결과 |
|------|------|
| run-as (내부 DB) | ❌ non-debuggable |
| ADB Backup | ❌ allowBackup=false + AES-256 |
| mcache 파싱 | ❌ 자체 AES 암호화 |
| **멜론 웹 스크래핑** | 🔲 미시도 |
| **mitmproxy 프록시 인터셉트** | 🔲 미시도 |
| **루팅된 기기** | 🔲 미시도 |

---

## 다음 시도 후보

### 우선순위 1. 멜론 웹사이트 스크래핑
- `melon.com` 로그인 후 내 플레이리스트 페이지 Playwright로 스크래핑
- 별도 장비 불필요, 바로 시작 가능

### 우선순위 2. mitmproxy 프록시 인터셉트
- PC에서 mitmproxy 실행 → 폰 Wi-Fi 프록시를 PC로 설정
- 멜론 앱 실행 → 플레이리스트 화면 열기 → API 응답 캡처
- Certificate Pinning 가능성 있음 (앱에서 차단할 수도 있음)

### 우선순위 3. 루팅된 기기
- 루트 있으면 `/data/data/com.iloen.melon/databases/` 직접 접근
- SQLite DB에서 플레이리스트 테이블 쿼리 가능
