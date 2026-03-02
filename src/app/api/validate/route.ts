import { NextResponse } from 'next/server';

const MELON_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  Referer: 'https://www.melon.com/',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9',
};

export async function GET() {
  const cookie = process.env.MELON_COOKIE;
  const memberKey = process.env.MELON_MEMBER_KEY;

  // 1) env 값 존재 여부
  if (!cookie || !memberKey) {
    return NextResponse.json({
      ok: false,
      reason: '.env 파일에 MELON_COOKIE 또는 MELON_MEMBER_KEY가 없습니다.',
    });
  }

  // 2) 실제 멜론 요청으로 쿠키 유효 여부 확인
  try {
    const url = new URL(
      'https://www.melon.com/mymusic/playlist/mymusicplaylist_listAjax.htm'
    );
    url.searchParams.set('memberKey', memberKey);
    url.searchParams.set('startIndex', '1');
    url.searchParams.set('pageSize', '1');

    const res = await fetch(url.toString(), {
      headers: { ...MELON_HEADERS, Cookie: cookie },
    });

    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        reason: `멜론 서버 오류: HTTP ${res.status}`,
      });
    }

    const html = await res.text();

    // 로그인 리다이렉트 패턴 감지 (미인증 시 짧은 JS 리다이렉트 반환)
    const isLoginRedirect =
      html.includes('PCGLOBAL/login') ||
      html.includes('mem/login') ||
      html.includes('member/login') ||
      (html.includes('location.href') && html.length < 800);

    if (isLoginRedirect) {
      return NextResponse.json({
        ok: false,
        reason: '쿠키가 만료되었습니다. 멜론에서 새 쿠키를 복사해 .env를 업데이트하세요.',
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      reason: e instanceof Error ? e.message : '멜론 연결 중 오류가 발생했습니다.',
    });
  }
}
